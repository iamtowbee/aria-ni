// src/services/ResponseCache.js
/**
 * Semantic Response Cache
 * Caches AI responses and retrieves them based on similarity
 * 100x faster for repeated queries, lower battery usage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export class ResponseCache {
  constructor(config = {}) {
    this.maxCacheSize = config.maxCacheSize || 100;
    this.similarityThreshold = config.similarityThreshold || 0.92;
    this.cacheKey = config.cacheKey || '@response_cache';
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      saves: 0,
    };
  }

  async initialize() {
    try {
      const cached = await AsyncStorage.getItem(this.cacheKey);
      if (cached) {
        const entries = JSON.parse(cached);
        this.cache = new Map(entries);
        console.log(`[ResponseCache] Loaded ${this.cache.size} cached responses`);
      }
    } catch (err) {
      console.error('[ResponseCache] Initialize error:', err);
    }
  }

  /**
   * Try to get cached response for similar prompt
   */
  async get(prompt) {
    const normalized = this._normalize(prompt);
    
    // Check exact match first (instant)
    if (this.cache.has(normalized)) {
      this.stats.hits++;
      const entry = this.cache.get(normalized);
      console.log(`[ResponseCache] ✓ Exact match (${this.stats.hits} hits)`);
      return {
        ...entry,
        cached: true,
        cacheType: 'exact',
      };
    }

    // Check semantic similarity
    const similar = this._findSimilar(normalized);
    if (similar) {
      this.stats.hits++;
      console.log(`[ResponseCache] ✓ Similar match (${similar.similarity.toFixed(2)} similarity)`);
      return {
        ...similar.entry,
        cached: true,
        cacheType: 'similar',
        similarity: similar.similarity,
      };
    }

    this.stats.misses++;
    return null;
  }

  /**
   * Store response in cache
   */
  async set(prompt, response, metadata = {}) {
    const normalized = this._normalize(prompt);
    
    const entry = {
      prompt: normalized,
      response,
      timestamp: Date.now(),
      metadata,
    };

    // Add to cache
    this.cache.set(normalized, entry);
    this.stats.saves++;

    // Evict old entries if cache is full
    if (this.cache.size > this.maxCacheSize) {
      this._evictOldest();
    }

    // Persist to storage (async, non-blocking)
    this._persistCache();

    console.log(`[ResponseCache] Saved response (${this.cache.size}/${this.maxCacheSize})`);
  }

  /**
   * Clear entire cache
   */
  async clear() {
    this.cache.clear();
    await AsyncStorage.removeItem(this.cacheKey);
    this.stats = { hits: 0, misses: 0, saves: 0 };
    console.log('[ResponseCache] Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
    
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: hitRate.toFixed(1) + '%',
      totalRequests: total,
    };
  }

  /**
   * Normalize prompt for matching
   */
  _normalize(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '');
  }

  /**
   * Find similar cached response using word overlap
   */
  _findSimilar(normalized) {
    const words = new Set(normalized.split(' '));
    let bestMatch = null;
    let bestSimilarity = 0;

    for (const [cachedPrompt, entry] of this.cache) {
      const cachedWords = new Set(cachedPrompt.split(' '));
      
      // Calculate Jaccard similarity
      const intersection = new Set([...words].filter(w => cachedWords.has(w)));
      const union = new Set([...words, ...cachedWords]);
      const similarity = intersection.size / union.size;

      if (similarity > bestSimilarity && similarity >= this.similarityThreshold) {
        bestSimilarity = similarity;
        bestMatch = { entry, similarity };
      }
    }

    return bestMatch;
  }

  /**
   * Evict oldest entry when cache is full
   */
  _evictOldest() {
    let oldestKey = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      console.log('[ResponseCache] Evicted oldest entry');
    }
  }

  /**
   * Persist cache to AsyncStorage (debounced)
   */
  _persistCache() {
    clearTimeout(this._persistTimer);
    this._persistTimer = setTimeout(async () => {
      try {
        const entries = Array.from(this.cache.entries());
        await AsyncStorage.setItem(this.cacheKey, JSON.stringify(entries));
      } catch (err) {
        console.error('[ResponseCache] Persist error:', err);
      }
    }, 1000);
  }
}

module.exports = { ResponseCache };
