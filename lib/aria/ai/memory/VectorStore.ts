/**
 * AriaVectorStore — On-device vector database with approximate nearest neighbor search
 *
 * Architecture:
 *  - HNSW-inspired layered graph for O(log n) ANN search
 *  - Cosine similarity metric
 *  - IndexedDB persistence layer
 *  - Metadata filtering + hybrid keyword/vector scoring
 *  - Automatic pruning / memory budget management
 */

const DB_NAME = "aria_vector_store";
const DB_VERSION = 2;
const STORE_NAME = "embeddings";
const META_STORE = "metadata";
const MAX_VECTORS = 50_000;
const EMBEDDING_DIM = 384; // MiniLM-L6-v2 compatible

// ── HNSW Graph Layer ─────────────────────────────────────────────────────────

class HNSWLayer {
  constructor() {
    this.nodes = new Map(); // id → { id, neighbors: Set<id> }
  }
  addNode(id) {
    if (!this.nodes.has(id)) this.nodes.set(id, { id, neighbors: new Set() });
  }
  connect(a, b) {
    this.nodes.get(a)?.neighbors.add(b);
    this.nodes.get(b)?.neighbors.add(a);
  }
  getNeighbors(id) {
    return this.nodes.get(id)?.neighbors ?? new Set();
  }
  removeNode(id) {
    const node = this.nodes.get(id);
    if (node) {
      for (const nb of node.neighbors) this.nodes.get(nb)?.neighbors.delete(id);
      this.nodes.delete(id);
    }
  }
}

// ── Vector Math ──────────────────────────────────────────────────────────────

function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i]*b[i]; na += a[i]*a[i]; nb += b[i]*b[i]; }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function l2(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) { const d = a[i]-b[i]; s += d*d; }
  return Math.sqrt(s);
}

function normalize(v) {
  let n = 0;
  for (const x of v) n += x*x;
  n = Math.sqrt(n);
  return n === 0 ? v : v.map(x => x/n);
}

// ── Main VectorStore ─────────────────────────────────────────────────────────

export class AriaVectorStore {
  constructor(options = {}) {
    this.dim = options.dim ?? EMBEDDING_DIM;
    this.maxVectors = options.maxVectors ?? MAX_VECTORS;
    this.M = options.M ?? 16;           // HNSW: max connections per node
    this.efConstruction = options.efConstruction ?? 200;
    this.efSearch = options.efSearch ?? 50;

    this.vectors = new Map();           // id → Float32Array
    this.metadata = new Map();          // id → { text, type, timestamp, tags, source, decayScore }
    this.layers = [];                   // HNSW layers (0 = base)
    this.entryPoint = null;
    this.numLayers = 0;

    this._db = null;
    this._dirty = new Set();
    this._flushTimer = null;
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  async init() {
    this._db = await this._openDB();
    await this._loadFromDB();
    console.log(`[VectorStore] Loaded ${this.vectors.size} vectors`);
    return this;
  }

  // ── Core Operations ────────────────────────────────────────────────────────

  /**
   * Insert a vector with metadata
   * @param {string} id
   * @param {number[]} vector  raw embedding (will be normalized)
   * @param {object} meta  { text, type, timestamp, tags, source }
   */
  async insert(id, vector, meta = {}) {
    if (this.vectors.size >= this.maxVectors) await this._prune();

    const v = normalize(new Float32Array(vector));
    this.vectors.set(id, v);
    this.metadata.set(id, {
      text: meta.text ?? "",
      type: meta.type ?? "memory",    // memory | fact | skill | emotion | visual
      timestamp: meta.timestamp ?? Date.now(),
      tags: meta.tags ?? [],
      source: meta.source ?? "user",  // user | vision | reasoning | system
      importance: meta.importance ?? 0.5,
      accessCount: 0,
      decayScore: 1.0,
    });

    this._hnswInsert(id, v);
    this._schedulePersist(id);
    return id;
  }

  /**
   * Search for k nearest neighbors
   * @param {number[]} queryVec
   * @param {object} opts
   */
  search(queryVec, opts = {}) {
    const {
      k = 10,
      threshold = 0.5,
      filter = null,       // fn(meta) → bool
      hybridQuery = null,  // string for BM25-style keyword boost
      rerank = true,
    } = opts;

    if (this.vectors.size === 0) return [];

    const qv = normalize(new Float32Array(queryVec));
    let candidates;

    if (this.entryPoint && this.layers.length > 1) {
      candidates = this._hnswSearch(qv, k * 3);
    } else {
      // Fallback: brute force for small stores
      candidates = this._bruteForce(qv, k * 3);
    }

    // Apply metadata filter
    if (filter) candidates = candidates.filter(c => filter(this.metadata.get(c.id)));

    // Hybrid scoring: blend vector similarity + keyword match
    if (hybridQuery) {
      const tokens = hybridQuery.toLowerCase().split(/\s+/);
      candidates = candidates.map(c => {
        const meta = this.metadata.get(c.id);
        const textTokens = (meta?.text ?? "").toLowerCase().split(/\s+/);
        const overlap = tokens.filter(t => textTokens.includes(t)).length;
        const keywordScore = overlap / Math.max(tokens.length, 1);
        return { ...c, score: c.score * 0.7 + keywordScore * 0.3 };
      });
    }

    // Temporal decay boost for recent memories
    candidates = candidates.map(c => {
      const meta = this.metadata.get(c.id);
      if (!meta) return c;
      const age = (Date.now() - meta.timestamp) / (1000 * 60 * 60 * 24); // days
      const recencyBoost = Math.exp(-age * 0.05) * 0.1;
      const importanceBoost = meta.importance * 0.1;
      return { ...c, score: c.score + recencyBoost + importanceBoost };
    });

    // Sort and threshold
    candidates.sort((a,b) => b.score - a.score);
    const results = candidates
      .filter(c => c.score >= threshold)
      .slice(0, k)
      .map(c => ({
        id: c.id,
        score: c.score,
        meta: this.metadata.get(c.id),
      }));

    // Update access counts
    for (const r of results) {
      const m = this.metadata.get(r.id);
      if (m) { m.accessCount++; m.decayScore = Math.min(1, m.decayScore + 0.01); }
    }

    return results;
  }

  /**
   * Update importance score (called by learning engine)
   */
  updateImportance(id, delta) {
    const m = this.metadata.get(id);
    if (m) { m.importance = Math.max(0, Math.min(1, m.importance + delta)); this._dirty.add(id); }
  }

  /**
   * Delete a vector
   */
  async delete(id) {
    this.vectors.delete(id);
    this.metadata.delete(id);
    this._hnswRemove(id);
    await this._deleteFromDB(id);
  }

  /**
   * Get store statistics
   */
  stats() {
    const types = {};
    for (const m of this.metadata.values()) types[m.type] = (types[m.type]||0) + 1;
    return {
      totalVectors: this.vectors.size,
      byType: types,
      memoryUsageMB: (this.vectors.size * this.dim * 4 / 1_048_576).toFixed(2),
      hnswLayers: this.layers.length,
    };
  }

  // ── HNSW Implementation ────────────────────────────────────────────────────

  _hnswInsert(id, vec) {
    const level = this._randomLevel();

    // Expand layers if needed
    while (this.layers.length <= level) this.layers.push(new HNSWLayer());
    for (const layer of this.layers) layer.addNode(id);

    if (!this.entryPoint) { this.entryPoint = id; return; }

    let ep = [this.entryPoint];
    const topLayer = this.layers.length - 1;

    // Greedy descent from top layer
    for (let l = topLayer; l > level; l--) {
      ep = this._greedySearch(ep, vec, 1, l);
    }

    // Insert with M connections per layer
    for (let l = Math.min(level, topLayer); l >= 0; l--) {
      const candidates = this._searchLayer(ep, vec, this.efConstruction, l);
      const neighbors = candidates.slice(0, this.M);
      for (const nb of neighbors) {
        this.layers[l].connect(id, nb.id);
        // Prune neighbor connections if over M
        const nbNeighbors = [...this.layers[l].getNeighbors(nb.id)];
        if (nbNeighbors.length > this.M) {
          const pruned = this._selectNeighbors(nb.id, nbNeighbors, this.M, l);
          this.layers[l].nodes.get(nb.id).neighbors = new Set(pruned.map(n=>n.id));
        }
      }
      if (candidates.length > 0) ep = [candidates[0].id];
    }

    if (level > topLayer) this.entryPoint = id;
  }

  _hnswSearch(qv, k) {
    if (!this.entryPoint) return [];
    let ep = [this.entryPoint];
    const topLayer = this.layers.length - 1;

    for (let l = topLayer; l > 0; l--) {
      ep = this._greedySearch(ep, qv, 1, l);
    }

    return this._searchLayer(ep, qv, Math.max(this.efSearch, k), 0)
      .slice(0, k)
      .map(c => ({ id: c.id, score: c.score }));
  }

  _searchLayer(epIds, qv, ef, level) {
    const visited = new Set(epIds);
    const candidates = epIds.map(id => ({ id, score: cosine(qv, this.vectors.get(id) ?? new Float32Array(this.dim)) }));
    const W = [...candidates];

    candidates.sort((a,b) => b.score - a.score);
    const C = [...candidates];

    while (C.length > 0) {
      C.sort((a,b) => b.score - a.score);
      const c = C.shift();
      const wMin = W[W.length-1]?.score ?? -1;
      if (c.score < wMin && W.length >= ef) break;

      for (const nb of this.layers[level]?.getNeighbors(c.id) ?? []) {
        if (!visited.has(nb) && this.vectors.has(nb)) {
          visited.add(nb);
          const score = cosine(qv, this.vectors.get(nb));
          if (score > wMin || W.length < ef) {
            C.push({ id: nb, score });
            W.push({ id: nb, score });
            W.sort((a,b) => b.score - a.score);
            if (W.length > ef) W.pop();
          }
        }
      }
    }

    W.sort((a,b) => b.score - a.score);
    return W;
  }

  _greedySearch(epIds, qv, k, level) {
    const results = this._searchLayer(epIds, qv, k, level);
    return results.slice(0, k).map(r => r.id);
  }

  _selectNeighbors(id, candidateIds, M, level) {
    return candidateIds
      .filter(cid => cid !== id && this.vectors.has(cid))
      .map(cid => ({ id: cid, score: cosine(this.vectors.get(id), this.vectors.get(cid)) }))
      .sort((a,b) => b.score - a.score)
      .slice(0, M);
  }

  _hnswRemove(id) {
    for (const layer of this.layers) layer.removeNode(id);
    if (this.entryPoint === id) {
      this.entryPoint = this.vectors.size > 0 ? [...this.vectors.keys()][0] : null;
    }
  }

  _randomLevel() {
    let level = 0;
    while (Math.random() < 0.5 && level < 8) level++;
    return level;
  }

  _bruteForce(qv, k) {
    const results = [];
    for (const [id, v] of this.vectors) {
      results.push({ id, score: cosine(qv, v) });
    }
    results.sort((a,b) => b.score - a.score);
    return results.slice(0, k);
  }

  // ── Pruning ────────────────────────────────────────────────────────────────

  async _prune() {
    // Remove lowest importance + oldest + least accessed vectors
    const entries = [...this.metadata.entries()].map(([id, m]) => ({
      id,
      score: m.importance * 0.4 + m.accessCount * 0.001 +
             Math.exp(-(Date.now()-m.timestamp)/(1000*60*60*24*30)) * 0.3 +
             m.decayScore * 0.3
    }));
    entries.sort((a,b) => a.score - b.score);
    const toRemove = entries.slice(0, Math.floor(this.maxVectors * 0.1));
    for (const e of toRemove) await this.delete(e.id);
    console.log(`[VectorStore] Pruned ${toRemove.length} vectors`);
  }

  // ── IndexedDB Persistence ──────────────────────────────────────────────────

  _openDB() {
    return new Promise((res, rej) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(META_STORE)) {
          const ms = db.createObjectStore(META_STORE, { keyPath: "id" });
          ms.createIndex("type", "type", { unique: false });
          ms.createIndex("timestamp", "timestamp", { unique: false });
        }
      };
      req.onsuccess = e => res(e.target.result);
      req.onerror = e => rej(e.target.error);
    });
  }

  async _loadFromDB() {
    if (!this._db) return;
    const vecs = await this._getAll(STORE_NAME);
    const metas = await this._getAll(META_STORE);

    const metaMap = new Map(metas.map(m => [m.id, m]));

    for (const v of vecs) {
      const arr = new Float32Array(v.data);
      this.vectors.set(v.id, arr);
      const meta = metaMap.get(v.id);
      if (meta) this.metadata.set(v.id, meta);
      this._hnswInsert(v.id, arr);
    }
  }

  _schedulePersist(id) {
    this._dirty.add(id);
    if (this._flushTimer) return;
    this._flushTimer = setTimeout(() => {
      this._flushToDB();
      this._flushTimer = null;
    }, 2000);
  }

  async _flushToDB() {
    if (!this._db || this._dirty.size === 0) return;
    const ids = [...this._dirty];
    this._dirty.clear();

    const vecTx = this._db.transaction(STORE_NAME, "readwrite");
    const vecStore = vecTx.objectStore(STORE_NAME);
    const metaTx = this._db.transaction(META_STORE, "readwrite");
    const metaStore = metaTx.objectStore(META_STORE);

    for (const id of ids) {
      const v = this.vectors.get(id);
      const m = this.metadata.get(id);
      if (v) vecStore.put({ id, data: Array.from(v) });
      if (m) metaStore.put({ id, ...m });
    }
  }

  _getAll(storeName) {
    return new Promise((res, rej) => {
      const tx = this._db.transaction(storeName, "readonly");
      const req = tx.objectStore(storeName).getAll();
      req.onsuccess = e => res(e.target.result);
      req.onerror = e => rej(e.target.error);
    });
  }

  async _deleteFromDB(id) {
    if (!this._db) return;
    const vtx = this._db.transaction(STORE_NAME, "readwrite");
    vtx.objectStore(STORE_NAME).delete(id);
    const mtx = this._db.transaction(META_STORE, "readwrite");
    mtx.objectStore(META_STORE).delete(id);
  }
}

export default AriaVectorStore;
