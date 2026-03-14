// src/services/SmartSuggestions.js
/**
 * Smart Suggestions
 * 
 * Predicts what the user might want to ask next based on:
 * - Current conversation context
 * - User's past questions
 * - Common follow-up patterns
 * - Agent capabilities
 * 
 * Shows as chips: ["Can you elaborate?", "Show example", "What about..."]
 */

export class SmartSuggestions {
  constructor(config = {}) {
    this.maxSuggestions = config.maxSuggestions || 3;
    this.conversationHistory = [];
    this.userPatterns = new Map(); // User's common question patterns
    
    // Common follow-up patterns
    this.followUpTemplates = {
      explanation: [
        'Can you elaborate?',
        'Tell me more',
        'Why is that?',
        'How does that work?',
      ],
      example: [
        'Show me an example',
        'Can you give an example?',
        'What would that look like?',
      ],
      comparison: [
        'What are the alternatives?',
        'How does this compare?',
        'What are the tradeoffs?',
      ],
      action: [
        'What should I do next?',
        'How do I get started?',
        'Can you help me with that?',
      ],
      clarification: [
        'I don\'t understand',
        'Can you explain differently?',
        'What do you mean?',
      ],
    };

    // Context-based suggestions
    this.contextPatterns = {
      code: {
        keywords: ['code', 'function', 'class', 'error', 'bug'],
        suggestions: [
          'Explain this code',
          'Find the bug',
          'Optimize this',
          'Add comments',
        ],
      },
      creative: {
        keywords: ['story', 'write', 'create', 'design'],
        suggestions: [
          'Make it longer',
          'Try a different style',
          'Add more details',
          'Change the ending',
        ],
      },
      learning: {
        keywords: ['explain', 'what is', 'how does', 'why'],
        suggestions: [
          'Give me an example',
          'Explain like I\'m 5',
          'What\'s the history?',
          'Quiz me on this',
        ],
      },
      decision: {
        keywords: ['should I', 'which', 'better', 'choose'],
        suggestions: [
          'What are the pros and cons?',
          'Give me a recommendation',
          'What would you do?',
          'Are there other options?',
        ],
      },
    };
  }

  /**
   * Get suggestions based on current context
   * 
   * @param {Object} context - Current conversation context
   * @returns {Array} Array of suggestion objects
   */
  getSuggestions(context = {}) {
    const suggestions = [];

    // 1. Context-based suggestions
    const contextSuggestions = this._getContextSuggestions(context);
    suggestions.push(...contextSuggestions);

    // 2. Follow-up suggestions
    const followUpSuggestions = this._getFollowUpSuggestions(context);
    suggestions.push(...followUpSuggestions);

    // 3. User pattern suggestions
    const patternSuggestions = this._getUserPatternSuggestions();
    suggestions.push(...patternSuggestions);

    // 4. Capability suggestions (what Nova can do)
    const capabilitySuggestions = this._getCapabilitySuggestions(context);
    suggestions.push(...capabilitySuggestions);

    // Deduplicate and rank
    const unique = this._deduplicate(suggestions);
    const ranked = this._rankSuggestions(unique, context);

    return ranked.slice(0, this.maxSuggestions);
  }

  /**
   * Record user interaction to learn patterns
   */
  recordInteraction(userQuery, context = {}) {
    this.conversationHistory.push({
      query: userQuery,
      context,
      timestamp: Date.now(),
    });

    // Learn user patterns
    this._learnPattern(userQuery);

    // Trim history
    if (this.conversationHistory.length > 50) {
      this.conversationHistory.shift();
    }
  }

  /**
   * Get context-based suggestions
   */
  _getContextSuggestions(context) {
    if (!context.lastMessage) return [];

    const lastMessage = context.lastMessage.toLowerCase();
    const suggestions = [];

    // Match against context patterns
    Object.entries(this.contextPatterns).forEach(([category, pattern]) => {
      const hasKeyword = pattern.keywords.some(kw => lastMessage.includes(kw));
      if (hasKeyword) {
        suggestions.push(...pattern.suggestions.map(text => ({
          text,
          type: 'context',
          category,
          score: 1.0,
        })));
      }
    });

    return suggestions;
  }

  /**
   * Get follow-up suggestions
   */
  _getFollowUpSuggestions(context) {
    if (!context.lastResponse) return [];

    const lastResponse = context.lastResponse.toLowerCase();
    const suggestions = [];

    // If response was long, suggest elaboration
    if (lastResponse.length > 500) {
      suggestions.push({
        text: 'Can you summarize that?',
        type: 'followup',
        category: 'clarification',
        score: 0.9,
      });
    }

    // If response mentioned steps/process
    if (lastResponse.includes('first') || lastResponse.includes('step')) {
      suggestions.push({
        text: 'Walk me through it',
        type: 'followup',
        category: 'action',
        score: 0.8,
      });
    }

    // If response was short, suggest more detail
    if (lastResponse.length < 100) {
      suggestions.push({
        text: 'Tell me more',
        type: 'followup',
        category: 'explanation',
        score: 0.7,
      });
    }

    // Always offer examples
    suggestions.push({
      text: 'Show me an example',
      type: 'followup',
      category: 'example',
      score: 0.6,
    });

    return suggestions;
  }

  /**
   * Get suggestions based on user's past patterns
   */
  _getUserPatternSuggestions() {
    const suggestions = [];

    // Find most common patterns
    const sortedPatterns = Array.from(this.userPatterns.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    sortedPatterns.forEach(([pattern, count]) => {
      suggestions.push({
        text: pattern,
        type: 'pattern',
        category: 'user',
        score: 0.5 + (count * 0.1),
      });
    });

    return suggestions;
  }

  /**
   * Get suggestions about Nova's capabilities
   */
  _getCapabilitySuggestions(context) {
    // If user hasn't used certain features, suggest them
    const suggestions = [];

    if (!context.usedVoice) {
      suggestions.push({
        text: '🎤 Try voice input',
        type: 'capability',
        category: 'feature',
        score: 0.4,
      });
    }

    if (!context.usedImage) {
      suggestions.push({
        text: '📷 Analyze an image',
        type: 'capability',
        category: 'feature',
        score: 0.4,
      });
    }

    if (!context.usedCreative) {
      suggestions.push({
        text: '✨ Write a story',
        type: 'capability',
        category: 'feature',
        score: 0.4,
      });
    }

    return suggestions;
  }

  /**
   * Learn user's question patterns
   */
  _learnPattern(query) {
    // Extract pattern (simplified)
    const words = query.toLowerCase().split(/\s+/);
    
    // Look for question patterns
    if (words[0] === 'how') {
      const pattern = 'How ' + words.slice(1, 3).join(' ') + '...';
      this._incrementPattern(pattern);
    } else if (words[0] === 'what') {
      const pattern = 'What ' + words.slice(1, 3).join(' ') + '...';
      this._incrementPattern(pattern);
    } else if (words[0] === 'why') {
      const pattern = 'Why ' + words.slice(1, 3).join(' ') + '...';
      this._incrementPattern(pattern);
    }
  }

  /**
   * Increment pattern count
   */
  _incrementPattern(pattern) {
    const count = this.userPatterns.get(pattern) || 0;
    this.userPatterns.set(pattern, count + 1);
  }

  /**
   * Deduplicate suggestions
   */
  _deduplicate(suggestions) {
    const seen = new Set();
    return suggestions.filter(s => {
      const key = s.text.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Rank suggestions by relevance
   */
  _rankSuggestions(suggestions, context) {
    return suggestions.sort((a, b) => {
      // Higher score = better suggestion
      let scoreA = a.score || 0;
      let scoreB = b.score || 0;

      // Boost context-based suggestions
      if (a.type === 'context') scoreA += 0.2;
      if (b.type === 'context') scoreB += 0.2;

      // Boost user patterns
      if (a.type === 'pattern') scoreA += 0.1;
      if (b.type === 'pattern') scoreB += 0.1;

      return scoreB - scoreA;
    });
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      conversationCount: this.conversationHistory.length,
      learnedPatterns: this.userPatterns.size,
      topPatterns: Array.from(this.userPatterns.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([pattern, count]) => ({ pattern, count })),
    };
  }

  /**
   * Clear all learned data
   */
  clear() {
    this.conversationHistory = [];
    this.userPatterns.clear();
  }
}
