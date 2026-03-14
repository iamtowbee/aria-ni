// @ts-nocheck
// agents/GammaAgent.js
// Long-term memory: storage, retrieval, deduplication, importance scoring.

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

export class GammaAgent {
  constructor(config = {}) {
    this.storageKey = config.storageKey || '@ai_memory_v2';
    this.maxShortTerm = config.maxShortTerm || 50;
    this.maxLongTerm = config.maxLongTerm || 500;
    this.memoryIndex = null;
    this.initialized = false;
    this._dirty = false;
    this._saveTimer = null;
  }

  // ─── Lifecycle ───────────────────────────────────────────────────────────────

  async initialize() {
    if (this.initialized) return;
    try {
      await this._loadIndex();
      this.initialized = true;
    } catch (err) {
      console.warn('[GammaAgent] Init failed, starting fresh:', err.message);
      this._resetIndex();
      this.initialized = true;
    }
  }

  // ─── Write ────────────────────────────────────────────────────────────────────

  async store(memory) {
    await this.initialize();

    const entry = {
      id: this._generateId(),
      content: memory.content ?? memory,
      type: memory.type ?? 'general',
      timestamp: Date.now(),
      importance: memory.importance ?? 0.5,
      tags: memory.tags ?? [],
      context: memory.context ?? {},
    };

    // Deduplicate: skip if very similar content already exists in short-term
    if (this._isDuplicate(entry)) return entry;

    this.memoryIndex.shortTerm.unshift(entry); // newest first

    // Promote high-importance to long-term (no duplicates)
    if (entry.importance > 0.7 && !this._inLongTerm(entry.id)) {
      this.memoryIndex.longTerm.unshift(entry);
    }

    // Trim short-term: archive borderline memories before eviction
    while (this.memoryIndex.shortTerm.length > this.maxShortTerm) {
      const evicted = this.memoryIndex.shortTerm.pop();
      if (evicted.importance > 0.6 && !this._inLongTerm(evicted.id)) {
        this.memoryIndex.longTerm.unshift(evicted);
      }
    }

    // Trim long-term by importance
    if (this.memoryIndex.longTerm.length > this.maxLongTerm) {
      this.memoryIndex.longTerm.sort((a, b) => b.importance - a.importance);
      this.memoryIndex.longTerm = this.memoryIndex.longTerm.slice(0, this.maxLongTerm);
    }

    this._scheduleSave();
    return entry;
  }

  // ─── Read ─────────────────────────────────────────────────────────────────────

  async recall(query, options = {}) {
    await this.initialize();

    const {
      limit = 5,
      minImportance = 0,
      type = null,
      recencyWeight = 0.3,
      bandwidthLite = false,   // return less when on low-bandwidth tier
    } = options;

    const effectiveLimit = bandwidthLite ? Math.min(limit, 2) : limit;

    // Deduplicated pool
    const seen = new Set();
    const pool = [];
    for (const m of [...this.memoryIndex.shortTerm, ...this.memoryIndex.longTerm]) {
      if (!seen.has(m.id)) {
        seen.add(m.id);
        pool.push(m);
      }
    }

    let filtered = pool.filter(m =>
      m.importance >= minImportance && (type === null || m.type === type)
    );

    const scored = filtered.map(m => ({
      ...m,
      _score: this._relevanceScore(m, query, recencyWeight),
    }));

    scored.sort((a, b) => b._score - a._score);
    return scored.slice(0, effectiveLimit);
  }

  async getRecentMemories(count = 10) {
    await this.initialize();
    return [...this.memoryIndex.shortTerm].slice(0, count);
  }

  async getImportantMemories(count = 10) {
    await this.initialize();
    return [...this.memoryIndex.longTerm]
      .sort((a, b) => b.importance - a.importance)
      .slice(0, count);
  }

  async getMemoryStats() {
    await this.initialize();

    const all = [...this.memoryIndex.shortTerm, ...this.memoryIndex.longTerm];
    const timestamps = all.map(m => m.timestamp);

    // ✅ FIX: Math.min/max with spread crashes on empty arrays
    const oldest = timestamps.length ? Math.min(...timestamps) : null;
    const newest = timestamps.length ? Math.max(...timestamps) : null;
    const avg = all.length
      ? all.reduce((s, m) => s + m.importance, 0) / all.length
      : 0;

    return {
      shortTermCount: this.memoryIndex.shortTerm.length,
      longTermCount: this.memoryIndex.longTerm.length,
      totalCount: all.length,
      oldestMemory: oldest,
      newestMemory: newest,
      avgImportance: parseFloat(avg.toFixed(3)),
    };
  }

  // ─── Delete / Clear ───────────────────────────────────────────────────────────

  async deleteMemory(id) {
    await this.initialize();
    this.memoryIndex.shortTerm = this.memoryIndex.shortTerm.filter(m => m.id !== id);
    this.memoryIndex.longTerm = this.memoryIndex.longTerm.filter(m => m.id !== id);
    this._scheduleSave();
  }

  async clearAllMemories() {
    this._resetIndex();
    await this._saveIndex();
  }

  // ─── Export ───────────────────────────────────────────────────────────────────

  async exportMemories() {
    await this.initialize();

    const data = {
      ...this.memoryIndex,
      exportDate: new Date().toISOString(),
      version: '2.0',
    };

    const filePath = `${FileSystem.documentDirectory}memory-export-${Date.now()}.json`;
    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(data, null, 2));
    return filePath;
  }

  // ─── Private ─────────────────────────────────────────────────────────────────

  _isDuplicate(entry) {
    const content = typeof entry.content === 'string'
      ? entry.content.trim().toLowerCase()
      : JSON.stringify(entry.content);

    return this.memoryIndex.shortTerm.slice(0, 5).some(m => {
      const existing = typeof m.content === 'string'
        ? m.content.trim().toLowerCase()
        : JSON.stringify(m.content);
      return existing === content;
    });
  }

  _inLongTerm(id) {
    return this.memoryIndex.longTerm.some(m => m.id === id);
  }

  _relevanceScore(memory, query, recencyWeight) {
    let score = memory.importance;

    // Recency decay: exponential with 30-day half-life
    const ageDays = (Date.now() - memory.timestamp) / 86400000;
    score += Math.exp(-ageDays / 30) * recencyWeight;

    // Keyword match
    if (typeof query === 'string') {
      const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      if (words.length > 0) {
        const blob = (
          typeof memory.content === 'string'
            ? memory.content
            : JSON.stringify(memory.content)
        ).toLowerCase();

        const hits = words.filter(w => blob.includes(w)).length;
        score += (hits / words.length) * 0.5;
      }
    }

    return score;
  }

  _scheduleSave() {
    // Debounce writes — batch multiple stores into one write
    if (this._saveTimer) clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => this._saveIndex(), 500);
  }

  async _loadIndex() {
    const raw = await AsyncStorage.getItem(this.storageKey);
    if (raw) {
      this.memoryIndex = JSON.parse(raw);
      this.memoryIndex.metadata.lastAccessed = Date.now();
    } else {
      this._resetIndex();
    }
  }

  async _saveIndex() {
    this.memoryIndex.metadata.lastAccessed = Date.now();
    await AsyncStorage.setItem(this.storageKey, JSON.stringify(this.memoryIndex));
  }

  _resetIndex() {
    this.memoryIndex = {
      shortTerm: [],
      longTerm: [],
      metadata: { created: Date.now(), lastAccessed: Date.now(), version: '2.0' },
    };
  }

  _generateId() {
    return `mem_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }
}
