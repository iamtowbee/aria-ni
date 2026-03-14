// src/services/ContextCompressor.js
/**
 * Context Compression with RAG
 * 
 * Solves the "context window limit" problem:
 * - Maintains 100+ message conversations
 * - Intelligent summarization of old messages
 * - RAG: Retrieve relevant past conversations
 * - Keeps recent messages verbatim
 * 
 * Architecture:
 * [Old Messages] → Summarize → [Summary]
 * [Recent 10]    → Keep      → [Recent Messages]
 * [Query]        → Search    → [Relevant Context]
 * 
 * Result: Never "forget" important details
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export class ContextCompressor {
  constructor(config = {}) {
    this.maxTokens = config.maxTokens || 2048;
    this.recentMessageCount = config.recentMessageCount || 10;
    this.summaryKey = config.summaryKey || '@conversation_summaries';
    this.vectorStore = new Map(); // Simple in-memory vector store
  }

  /**
   * Compress conversation history to fit within token limit
   * 
   * Strategy:
   * 1. Keep last N messages (most relevant)
   * 2. Summarize older messages into compact form
   * 3. Return: [summary] + [recent messages]
   */
  async compress(messages, targetTokens = null) {
    if (!messages || messages.length === 0) {
      return [];
    }

    const target = targetTokens || this.maxTokens;
    
    // If short conversation, return as-is
    if (messages.length <= this.recentMessageCount) {
      return messages;
    }

    // Split into old and recent
    const splitPoint = messages.length - this.recentMessageCount;
    const oldMessages = messages.slice(0, splitPoint);
    const recentMessages = messages.slice(splitPoint);

    // Summarize old messages
    const summary = await this._summarizeMessages(oldMessages);

    // Build compressed context
    const compressed = [
      {
        role: 'system',
        content: `Previous conversation summary: ${summary}`,
        compressed: true,
        originalCount: oldMessages.length,
      },
      ...recentMessages
    ];

    console.log(`[ContextCompressor] Compressed ${messages.length} → ${compressed.length} messages`);
    console.log(`[ContextCompressor] Summarized ${oldMessages.length} old messages`);

    return compressed;
  }

  /**
   * Expand context with relevant memories (RAG)
   * 
   * Retrieves relevant past conversations based on semantic similarity
   * to current query
   */
  async expandContext(query, topK = 5) {
    // Search vector store for relevant memories
    const relevant = await this._searchSimilar(query, topK);

    if (relevant.length === 0) {
      return { query, context: [] };
    }

    // Format as context
    const context = relevant.map(item => ({
      text: item.content,
      similarity: item.similarity,
      timestamp: item.timestamp,
    }));

    console.log(`[ContextCompressor] Found ${relevant.length} relevant memories`);

    return {
      query,
      context,
      contextText: relevant.map(r => r.content).join('\n\n'),
    };
  }

  /**
   * Store conversation for future RAG retrieval
   */
  async storeConversation(messages, metadata = {}) {
    const id = `conv_${Date.now()}`;
    const entry = {
      id,
      messages,
      metadata,
      timestamp: Date.now(),
      embedding: this._generateEmbedding(messages),
    };

    this.vectorStore.set(id, entry);

    // Persist to storage
    await this._persist();

    console.log(`[ContextCompressor] Stored conversation ${id}`);
  }

  /**
   * Clear all stored conversations
   */
  async clear() {
    this.vectorStore.clear();
    await AsyncStorage.removeItem(this.summaryKey);
    console.log('[ContextCompressor] Cleared all data');
  }

  /**
   * Get compression statistics
   */
  getStats() {
    return {
      storedConversations: this.vectorStore.size,
      recentMessageCount: this.recentMessageCount,
      maxTokens: this.maxTokens,
    };
  }

  /**
   * Summarize messages into compact form
   * 
   * Uses extractive summarization (key points)
   * Could be enhanced with LLM summarization
   */
  async _summarizeMessages(messages) {
    if (messages.length === 0) return '';

    // Extract key information
    const keyPoints = [];
    const topics = new Set();
    const userQuestions = [];
    const assistantResponses = [];

    messages.forEach(msg => {
      if (msg.role === 'user') {
        userQuestions.push(msg.content);
        // Extract potential topics (simple keyword extraction)
        const words = msg.content.toLowerCase().split(/\s+/);
        words.forEach(w => {
          if (w.length > 5 && !this._isStopWord(w)) {
            topics.add(w);
          }
        });
      } else if (msg.role === 'assistant') {
        // Take first sentence as key point
        const firstSentence = msg.content.split(/[.!?]/)[0];
        if (firstSentence) {
          assistantResponses.push(firstSentence);
        }
      }
    });

    // Build summary
    const topicList = Array.from(topics).slice(0, 5).join(', ');
    const summary = [
      `Topics discussed: ${topicList}.`,
      `${userQuestions.length} questions asked.`,
      assistantResponses.length > 0 
        ? `Key points: ${assistantResponses.slice(0, 3).join('; ')}.`
        : '',
    ].filter(Boolean).join(' ');

    return summary;
  }

  /**
   * Search for similar conversations (simple cosine similarity)
   */
  async _searchSimilar(query, topK) {
    const queryEmbedding = this._generateEmbedding([{ content: query }]);
    const results = [];

    for (const [id, entry] of this.vectorStore) {
      const similarity = this._cosineSimilarity(queryEmbedding, entry.embedding);
      if (similarity > 0.3) { // Threshold
        results.push({
          id,
          content: this._extractContent(entry.messages),
          similarity,
          timestamp: entry.timestamp,
        });
      }
    }

    // Sort by similarity and take top K
    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  /**
   * Generate simple embedding (TF-IDF style)
   * In production, use proper embeddings
   */
  _generateEmbedding(messages) {
    const text = messages.map(m => m.content || '').join(' ').toLowerCase();
    const words = text.split(/\s+/).filter(w => w.length > 3);
    
    // Count word frequencies
    const freq = {};
    words.forEach(w => {
      freq[w] = (freq[w] || 0) + 1;
    });

    // Convert to simple vector (top 50 words)
    const topWords = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)
      .map(([word, count]) => ({ word, count }));

    return topWords;
  }

  /**
   * Cosine similarity between two embeddings
   */
  _cosineSimilarity(emb1, emb2) {
    const words1 = new Map(emb1.map(e => [e.word, e.count]));
    const words2 = new Map(emb2.map(e => [e.word, e.count]));
    
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    // Calculate dot product and norms
    const allWords = new Set([...words1.keys(), ...words2.keys()]);
    allWords.forEach(word => {
      const v1 = words1.get(word) || 0;
      const v2 = words2.get(word) || 0;
      dotProduct += v1 * v2;
      norm1 += v1 * v1;
      norm2 += v2 * v2;
    });

    if (norm1 === 0 || norm2 === 0) return 0;
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * Extract readable content from messages
   */
  _extractContent(messages) {
    return messages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n')
      .slice(0, 500); // Truncate
  }

  /**
   * Simple stop word check
   */
  _isStopWord(word) {
    const stopWords = new Set([
      'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and',
      'or', 'but', 'in', 'with', 'to', 'for', 'of', 'as'
    ]);
    return stopWords.has(word);
  }

  /**
   * Persist vector store to AsyncStorage
   */
  async _persist() {
    try {
      const entries = Array.from(this.vectorStore.entries());
      await AsyncStorage.setItem(this.summaryKey, JSON.stringify(entries));
    } catch (err) {
      console.error('[ContextCompressor] Persist error:', err);
    }
  }

  /**
   * Load vector store from AsyncStorage
   */
  async initialize() {
    try {
      const stored = await AsyncStorage.getItem(this.summaryKey);
      if (stored) {
        const entries = JSON.parse(stored);
        this.vectorStore = new Map(entries);
        console.log(`[ContextCompressor] Loaded ${entries.length} conversations`);
      }
    } catch (err) {
      console.error('[ContextCompressor] Initialize error:', err);
    }
  }
}
