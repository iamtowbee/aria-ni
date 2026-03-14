// @ts-nocheck
/**
 * MultimodalLearningEngine — Continuous learning across text, vision, and audio
 *
 * Extends the base LearningEngine with:
 *  - Cross-modal association formation (text ↔ image embeddings)
 *  - Visual concept clustering (groups similar images into semantic categories)
 *  - Multimodal skill crystallization (procedural memory from cross-modal patterns)
 *  - Temporal episode stitching (connects related episodes into narratives)
 *  - Importance re-scoring with visual salience boost
 *  - Background consolidation loop with progressive compression
 *
 * Memory Hierarchy:
 *  Sensory buffer (seconds) → Working memory (session) → Long-term store (persistent)
 *  All three layers use the same HNSW vector store with type-based partitioning.
 */

const MEMORY_TYPES = {
  EPISODIC:    "episodic",
  SEMANTIC:    "semantic",
  VISUAL:      "visual",
  PROCEDURAL:  "procedural",
  CROSS_MODAL: "cross_modal",
  NARRATIVE:   "narrative",    // stitched episode sequences
  CONCEPT:     "concept",      // clustered visual concepts
};

const CONSOLIDATION_CONFIG = {
  intervalMs:       5 * 60_000,  // consolidate every 5 min
  episodesPerBatch: 20,          // process N recent episodes per cycle
  dupThreshold:     0.92,        // cosine similarity to trigger dedup
  decayRate:        0.012,       // daily forgetting rate
  narrativeMinLen:  3,           // min episodes to stitch into narrative
  conceptMinSize:   4,           // min visual memories to form a concept
};

export class MultimodalLearningEngine {
  constructor(vectorStore, textEmbedder, visionEngine = null) {
    this.store      = vectorStore;
    this.embedder   = textEmbedder;
    this.vision     = visionEngine;       // MoondreamVision instance (optional)

    // Working memory (current session — fast in-memory ring buffer)
    this._workingMem  = [];               // { id, embedding, meta, addedAt }
    this._workingMax  = 200;

    // Sensory buffer (very recent items, pre-consolidation)
    this._sensoryBuf  = [];               // last ~20 interactions
    this._sensoryMax  = 20;

    // Cross-modal index: imageMemId → Set<textMemId>
    this._crossIndex  = new Map();

    // Visual concept clusters: conceptId → { centroid, memberIds, label }
    this._concepts    = new Map();

    // Skill pattern counter: topic → count
    this._skillCounts = new Map();

    // Narrative threads: threadId → { memIds[], lastActivity }
    this._narratives  = new Map();

    this._consolidationTimer = null;
    this._sessionId          = uid();
    this._turnCount          = 0;

    this.learningRate   = 0.08;
    this.forgettingRate = CONSOLIDATION_CONFIG.decayRate;

    // Callbacks
    this.onMemoryFormed     = null;   // ({ type, id, importance })
    this.onSkillLearned     = null;   // ({ topic, skillId })
    this.onConsolidation    = null;   // ({ phase, count })
    this.onConceptFormed    = null;   // ({ label, size, conceptId })
    this.onNarrativeFormed  = null;   // ({ length, narrativeId })
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  async init() {
    this._startConsolidation();
    return this;
  }

  destroy() {
    if (this._consolidationTimer) clearInterval(this._consolidationTimer);
  }

  // ── Core Learning API ─────────────────────────────────────────────────────

  /**
   * Learn from a text interaction.
   * Returns IDs of created memories.
   */
  async learnText(input) {
    const {
      userText   = "",
      ariaText   = "",
      context    = {},
      modality   = "text",
      timestamp  = Date.now(),
    } = input;

    this._turnCount++;
    const importance  = this._scoreImportance({ userText, modality });
    const topics      = this._extractTopics(`${userText} ${ariaText}`);
    const emotion     = this._detectEmotion(userText);
    const episodicTxt = `User: ${userText}\nAria: ${ariaText}`;

    const emb  = await this._embed(episodicTxt);
    if (!emb) return [];

    const memId = uid();
    await this.store.insert(memId, emb, {
      text:       episodicTxt,
      type:       MEMORY_TYPES.EPISODIC,
      timestamp,
      tags:       [...topics, modality, emotion],
      source:     "interaction",
      importance,
      sessionId:  this._sessionId,
    });

    // Push to working + sensory buffers
    this._pushWorking({ id: memId, embedding: emb, meta: { type: MEMORY_TYPES.EPISODIC, text: episodicTxt, importance, topics, timestamp } });
    this._pushSensory({ id: memId, type: "episodic", text: episodicTxt, timestamp });

    // Extract semantic facts from ariaText
    const facts = this._extractFacts(ariaText);
    for (const fact of facts) {
      const fEmb = await this._embed(fact);
      if (!fEmb) continue;
      const fid = uid();
      await this.store.insert(fid, fEmb, {
        text:       fact,
        type:       MEMORY_TYPES.SEMANTIC,
        timestamp,
        tags:       topics,
        source:     "extraction",
        importance: importance * 0.8,
      });
    }

    // Track skill patterns
    for (const topic of topics) {
      const cnt = (this._skillCounts.get(topic) ?? 0) + 1;
      this._skillCounts.set(topic, cnt);
      if (cnt % 5 === 0) await this._crystallizeSkill(topic);
    }

    // Try to stitch a narrative thread
    await this._updateNarrativeThread(memId, topics);

    this.onMemoryFormed?.({ type: MEMORY_TYPES.EPISODIC, id: memId, importance, emotion, topics });
    return [memId];
  }

  /**
   * Learn from a visual input (image + optional text description).
   * Forms visual memory and optional cross-modal association.
   */
  async learnVision(input) {
    const {
      imageData    = null,       // base64 / blob
      description  = "",        // pre-computed description (from Moondream)
      caption      = "",
      textContent  = null,       // OCR output
      tags         = [],
      hasText      = false,
      linkedTextId = null,       // associate with a text memory
      timestamp    = Date.now(),
    } = input;

    if (!description && !caption) return [];

    const richText = [caption, description, textContent && `Text: ${textContent}`]
      .filter(Boolean).join(". ");

    // Get text embedding of the description
    const textEmb = await this._embed(richText);

    // Get vision embedding if raw image available and vision engine loaded
    let visionEmb = null;
    if (imageData && this.vision?.ready) {
      try { visionEmb = await this.vision.embed(imageData); } catch {}
    }

    // Fuse if we have both
    const finalEmb = (visionEmb && textEmb)
      ? fuseVectors(visionEmb, textEmb, 0.5)
      : (visionEmb ?? textEmb);

    if (!finalEmb) return [];

    const importance = this._scoreVisualImportance({ hasText, tags });

    const visId = uid();
    await this.store.insert(visId, finalEmb, {
      text:       richText,
      type:       MEMORY_TYPES.VISUAL,
      timestamp,
      tags:       [...tags, "visual", ...(hasText ? ["has_text"] : [])],
      source:     "moondream",
      importance,
      hasFusedEmb: !!(visionEmb && textEmb),
    });

    this._pushWorking({ id: visId, embedding: finalEmb, meta: { type: MEMORY_TYPES.VISUAL, text: richText, importance, tags, timestamp } });

    const createdIds = [visId];

    // Form cross-modal association if linked to text
    if (linkedTextId) {
      const crossId = await this._formCrossModalAssociation(visId, linkedTextId, richText);
      if (crossId) createdIds.push(crossId);
    }

    // Try to cluster into visual concept
    await this._updateVisualConcepts(visId, finalEmb, tags);

    this.onMemoryFormed?.({ type: MEMORY_TYPES.VISUAL, id: visId, importance, tags });
    return createdIds;
  }

  /**
   * Explicit "remember this" — highest importance, persists indefinitely.
   */
  async remember(text, options = {}) {
    const { type = MEMORY_TYPES.SEMANTIC, importance = 0.95, tags = [] } = options;
    const emb = await this._embed(text);
    if (!emb) return null;

    const id = uid();
    await this.store.insert(id, emb, {
      text,
      type,
      timestamp:  Date.now(),
      tags:       [...tags, "explicit"],
      source:     "user_direct",
      importance,
    });

    this.onMemoryFormed?.({ type, id, importance, tags });
    return id;
  }

  // ── RAG Context Building ──────────────────────────────────────────────────

  /**
   * Build a rich multimodal context string for injection into the LLM prompt.
   * Retrieves relevant text + visual + cross-modal memories.
   */
  async buildContext(query, options = {}) {
    const {
      k              = 8,
      maxChars       = 2400,
      includeVisual  = true,
      includeCross   = true,
      threshold      = 0.38,
      recentBoost    = true,    // boost very recent session memories
    } = options;

    const queryEmb = await this._embed(query);
    if (!queryEmb) return { context: "", sources: [] };

    // Retrieve from persistent store
    const raw = this.store.search(queryEmb, {
      k: k * 3,
      threshold,
      hybridQuery: query,
    });

    // Boost very recent working-memory items
    let candidates = raw;
    if (recentBoost) {
      const recentIds = new Set(this._workingMem.slice(-30).map(m => m.id));
      candidates = raw.map(r => ({
        ...r,
        score: recentIds.has(r.id) ? r.score * 1.12 : r.score,
      }));
      candidates.sort((a, b) => b.score - a.score);
    }

    // Filter by type
    const typeFilter = (m) => {
      if (!includeVisual && m.type === MEMORY_TYPES.VISUAL) return false;
      if (!includeCross  && m.type === MEMORY_TYPES.CROSS_MODAL) return false;
      return true;
    };

    const selected = candidates
      .filter(c => typeFilter(c.meta ?? {}))
      .slice(0, k);

    // Build context string
    const parts  = [];
    let budget   = maxChars;
    const seenTexts = new Set();

    for (const r of selected) {
      const text    = r.meta?.text ?? "";
      if (seenTexts.has(text.slice(0, 60))) continue;   // skip near-duplicates
      seenTexts.add(text.slice(0, 60));

      const snippet = text.slice(0, Math.min(250, budget));
      const tokens  = snippet.length;
      if (tokens > budget) break;
      budget -= tokens;

      const age  = fmtAge(r.meta?.timestamp);
      const type = r.meta?.type ?? "memory";
      const icon = { episodic: "💬", visual: "👁", semantic: "📚", cross_modal: "🔗", skill: "⚡", narrative: "📖" }[type] ?? "·";
      parts.push(`${icon} [${type} · ${age}] ${snippet}`);
    }

    return {
      context: parts.join("\n\n"),
      sources: selected.map(r => ({
        id:       r.id,
        type:     r.meta?.type,
        score:    r.score,
        age:      r.meta?.timestamp,
        snippet:  (r.meta?.text ?? "").slice(0, 80),
      })),
    };
  }

  // ── Cross-Modal Association ───────────────────────────────────────────────

  async _formCrossModalAssociation(imageMemId, textMemId, imageText) {
    // Get text of the text memory
    const textMeta = this.store.metadata.get(textMemId);
    if (!textMeta) return null;

    const assocText = `[Visual↔Text] ${imageText} ←→ ${textMeta.text.slice(0, 150)}`;
    const assocEmb  = await this._embed(assocText);
    if (!assocEmb) return null;

    const crossId = uid();
    await this.store.insert(crossId, assocEmb, {
      text:            assocText,
      type:            MEMORY_TYPES.CROSS_MODAL,
      timestamp:       Date.now(),
      tags:            ["cross_modal", "association"],
      source:          "fusion",
      importance:      0.75,
      linkedMemories:  [imageMemId, textMemId],
    });

    // Update cross-index
    if (!this._crossIndex.has(imageMemId)) this._crossIndex.set(imageMemId, new Set());
    this._crossIndex.get(imageMemId).add(textMemId);

    this.onMemoryFormed?.({ type: MEMORY_TYPES.CROSS_MODAL, id: crossId, linkedPair: [imageMemId, textMemId] });
    return crossId;
  }

  // ── Visual Concept Clustering ─────────────────────────────────────────────

  async _updateVisualConcepts(newVisId, newEmb, tags) {
    // Search for similar visual memories
    const similar = this.store.search(Array.from(newEmb), {
      k:         8,
      threshold: 0.62,
      filter:    m => m?.type === MEMORY_TYPES.VISUAL,
    });

    if (similar.length < CONSOLIDATION_CONFIG.conceptMinSize - 1) return;

    // Check if these already belong to a concept
    let conceptId = null;
    for (const [cid, concept] of this._concepts) {
      const overlap = similar.filter(s => concept.memberIds.includes(s.id)).length;
      if (overlap >= 2) { conceptId = cid; break; }
    }

    if (!conceptId) {
      // Form a new concept
      conceptId = uid();
      const label = tags[0] ?? "visual_concept";
      const centroid = meanOfEmbeddings([Array.from(newEmb), ...similar.slice(0, 3).map(s => Array.from(this.store.vectors.get(s.id) ?? new Float32Array(newEmb.length)))]);

      this._concepts.set(conceptId, {
        label,
        centroid,
        memberIds: [newVisId, ...similar.slice(0, 3).map(s => s.id)],
        formed:    Date.now(),
      });

      // Store concept as a semantic memory
      const conceptText = `Visual concept: "${label}" — appears in ${similar.length + 1} images.`;
      const conceptEmb  = await this._embed(conceptText);
      if (conceptEmb) {
        await this.store.insert(conceptId, conceptEmb, {
          text:       conceptText,
          type:       MEMORY_TYPES.CONCEPT,
          timestamp:  Date.now(),
          tags:       [label, "concept", "visual"],
          source:     "clustering",
          importance: 0.65,
        });
      }

      this.onConceptFormed?.({ label, size: similar.length + 1, conceptId });
    } else {
      // Add to existing concept
      this._concepts.get(conceptId).memberIds.push(newVisId);
    }
  }

  // ── Narrative Stitching ───────────────────────────────────────────────────

  async _updateNarrativeThread(newMemId, topics) {
    // Find the most active thread that shares topics
    const now = Date.now();
    let bestThread = null;
    let bestScore  = 0;

    for (const [tid, thread] of this._narratives) {
      // Thread must be active within 10 min
      if (now - thread.lastActivity > 10 * 60_000) continue;
      const topicOverlap = topics.filter(t => thread.topics?.includes(t)).length;
      if (topicOverlap > bestScore) { bestScore = topicOverlap; bestThread = tid; }
    }

    if (bestThread && bestScore >= 1) {
      const thread = this._narratives.get(bestThread);
      thread.memIds.push(newMemId);
      thread.lastActivity = now;

      // If thread is long enough, crystallize into a narrative memory
      if (thread.memIds.length >= CONSOLIDATION_CONFIG.narrativeMinLen &&
          thread.memIds.length % CONSOLIDATION_CONFIG.narrativeMinLen === 0) {
        await this._crystallizeNarrative(bestThread, thread);
      }
    } else {
      // Start a new thread
      const threadId = uid();
      this._narratives.set(threadId, {
        memIds:       [newMemId],
        topics,
        lastActivity: now,
        formed:       now,
      });
    }
  }

  async _crystallizeNarrative(threadId, thread) {
    const metas = thread.memIds
      .slice(-CONSOLIDATION_CONFIG.narrativeMinLen)
      .map(id => this.store.metadata.get(id)?.text ?? "")
      .filter(Boolean);

    if (metas.length < 2) return;

    const narrativeText = `Episode sequence (${metas.length} turns): ${metas.map(t => t.slice(0, 60)).join(" → ")}`;
    const emb = await this._embed(narrativeText);
    if (!emb) return;

    const narId = uid();
    await this.store.insert(narId, emb, {
      text:       narrativeText,
      type:       MEMORY_TYPES.NARRATIVE,
      timestamp:  Date.now(),
      tags:       [...(thread.topics ?? []), "narrative"],
      source:     "stitching",
      importance: 0.7,
    });

    this.onNarrativeFormed?.({ length: metas.length, narrativeId: narId });
  }

  // ── Skill Crystallization ─────────────────────────────────────────────────

  async _crystallizeSkill(topic) {
    const topicEmb = await this._embed(topic);
    if (!topicEmb) return;

    const examples = this.store.search(topicEmb, {
      k:        10,
      threshold: 0.5,
      filter:    m => m?.type === MEMORY_TYPES.EPISODIC,
    });

    if (examples.length < 3) return;

    const skillText = `Skill: "${topic}" — learned from ${examples.length} interactions. Patterns: ${
      examples.slice(0, 3).map(e => e.meta?.text?.slice(0, 50) ?? "").join("; ")
    }`;

    const skillEmb = await this._embed(skillText);
    if (!skillEmb) return;

    const skillId = uid();
    await this.store.insert(skillId, skillEmb, {
      text:       skillText,
      type:       MEMORY_TYPES.PROCEDURAL,
      timestamp:  Date.now(),
      tags:       [topic, "crystallized_skill"],
      source:     "learning",
      importance: 0.85,
    });

    this.onSkillLearned?.({ topic, skillId, examples: examples.length });
  }

  // ── Background Consolidation ──────────────────────────────────────────────

  _startConsolidation() {
    this._consolidationTimer = setInterval(
      () => this._consolidate(),
      CONSOLIDATION_CONFIG.intervalMs
    );
  }

  async _consolidate() {
    const recentIds = this._workingMem.slice(-CONSOLIDATION_CONFIG.episodesPerBatch).map(m => m.id);
    if (recentIds.length < 3) return;

    this.onConsolidation?.({ phase: "start", count: recentIds.length });

    // 1. Dedup
    await this._dedup(recentIds);

    // 2. Decay
    await this._applyDecay();

    // 3. Reinforce frequently accessed
    for (const item of this._workingMem) {
      if ((item.meta?.importance ?? 0) > 0.75) {
        this.store.updateImportance(item.id, this.learningRate * 0.3);
      }
    }

    // 4. Trim old inactive narrative threads
    const cutoff = Date.now() - 30 * 60_000;
    for (const [tid, t] of this._narratives) {
      if (t.lastActivity < cutoff) this._narratives.delete(tid);
    }

    this.onConsolidation?.({ phase: "done" });
  }

  async _dedup(ids) {
    for (const id of ids) {
      const v = this.store.vectors.get(id);
      if (!v) continue;
      const dups = this.store.search(Array.from(v), {
        k:         3,
        threshold: CONSOLIDATION_CONFIG.dupThreshold,
      }).filter(r => r.id !== id);

      for (const dup of dups) {
        const a = this.store.metadata.get(id);
        const b = this.store.metadata.get(dup.id);
        if (!a || !b) continue;
        const keepId = (a.importance ?? 0) >= (b.importance ?? 0) ? id : dup.id;
        const dropId = keepId === id ? dup.id : id;
        this.store.updateImportance(keepId, 0.04);
        await this.store.delete(dropId);
      }
    }
  }

  async _applyDecay() {
    const now = Date.now();
    for (const [id, meta] of this.store.metadata) {
      const days   = (now - (meta.timestamp ?? now)) / 86_400_000;
      const retain = Math.exp(-this.forgettingRate * days);
      meta.decayScore = Math.max(0.05, (meta.decayScore ?? 1.0) * retain);

      // Prune if very stale and unimportant
      if (meta.decayScore < 0.1 && (meta.importance ?? 0) < 0.25 && (meta.accessCount ?? 0) === 0) {
        await this.store.delete(id);
      }
    }
  }

  // ── Buffer Management ─────────────────────────────────────────────────────

  _pushWorking(item) {
    this._workingMem.push({ ...item, addedAt: Date.now() });
    if (this._workingMem.length > this._workingMax) {
      this._workingMem.shift();
    }
  }

  _pushSensory(item) {
    this._sensoryBuf.push({ ...item, addedAt: Date.now() });
    if (this._sensoryBuf.length > this._sensoryMax) {
      this._sensoryBuf.shift();
    }
  }

  // ── Analysis Helpers ──────────────────────────────────────────────────────

  _detectEmotion(text) {
    const t = text.toLowerCase();
    if (/\b(great|love|awesome|thanks|happy|excited|amazing|wonderful)\b/.test(t)) return "positive";
    if (/\b(hate|bad|wrong|broken|terrible|frustrated|angry|sad)\b/.test(t)) return "negative";
    if (/\b(why|how|what|curious|wonder|interesting)\b/.test(t)) return "curious";
    if (/\b(urgent|asap|immediately|help|emergency)\b/.test(t)) return "urgent";
    return "neutral";
  }

  _scoreImportance({ userText, modality }) {
    let s = 0.4;
    if (userText?.length > 100) s += 0.1;
    if (/\b(remember|important|always|never|my name|i am|i work|i love|i hate)\b/i.test(userText)) s += 0.25;
    if (modality === "mixed" || modality === "vision") s += 0.1;
    if (/\b(urgent|asap|emergency)\b/i.test(userText)) s += 0.15;
    return Math.min(1, s);
  }

  _scoreVisualImportance({ hasText, tags }) {
    let s = 0.55;
    if (hasText) s += 0.15;
    if (tags.includes("person") || tags.includes("face")) s += 0.1;
    if (tags.includes("document") || tags.includes("screen")) s += 0.15;
    return Math.min(1, s);
  }

  _extractTopics(text) {
    const stops = new Set(["the","a","an","is","are","was","be","have","to","for","of","and","or","in","on","at","with"]);
    return [...new Set(
      text.toLowerCase().replace(/[^a-z0-9\s]/g,"").split(/\s+/)
        .filter(w => w.length > 3 && !stops.has(w))
    )].slice(0, 8);
  }

  _extractFacts(text) {
    return text.split(/[.!?]/)
      .map(s => s.trim())
      .filter(s => s.length > 20 && s.length < 200)
      .filter(s => /\b(is|are|was|were|has|have|can|means|called|defined|works)\b/i.test(s))
      .slice(0, 3);
  }

  async _embed(text) {
    try {
      if (!text?.trim()) return null;
      if (this.embedder?.ready) return this.embedder.embedText(text);
      if (typeof this.embedder?.embedText === "function") return this.embedder.embedText(text);
      // Mock fallback
      return mockEmbed(text, 384);
    } catch { return null; }
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  getStats() {
    return {
      turns:           this._turnCount,
      workingMemSize:  this._workingMem.length,
      sensoryBufSize:  this._sensoryBuf.length,
      crossModalLinks: [...this._crossIndex.values()].reduce((n, s) => n + s.size, 0),
      concepts:        this._concepts.size,
      narrativeThreads: this._narratives.size,
      skills:          this._skillCounts.size,
      topSkills:       [...this._skillCounts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,5)
                         .map(([t, c]) => ({ topic: t, count: c })),
      store:           this.store.stats(),
    };
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function uid() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function fmtAge(ts) {
  if (!ts) return "?";
  const d = Math.floor((Date.now() - ts) / 86_400_000);
  return d === 0 ? "today" : d === 1 ? "yesterday" : d < 7 ? `${d}d` : `${Math.floor(d/7)}w`;
}

function fuseVectors(a, b, alpha = 0.5) {
  const len = Math.max(a.length, b.length);
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    out[i] = (a[i] ?? 0) * alpha + (b[i] ?? 0) * (1 - alpha);
  }
  let n = 0; for (const x of out) n += x * x; n = Math.sqrt(n);
  return n === 0 ? Array.from(out) : Array.from(out).map(x => x / n);
}

function meanOfEmbeddings(embeddings) {
  if (!embeddings.length) return [];
  const dim = embeddings[0].length;
  const mean = new Float32Array(dim);
  for (const e of embeddings) for (let i = 0; i < dim; i++) mean[i] += e[i] / embeddings.length;
  let n = 0; for (const x of mean) n += x * x; n = Math.sqrt(n);
  return n === 0 ? Array.from(mean) : Array.from(mean).map(x => x / n);
}

function mockEmbed(seed, dim = 384) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const arr = new Float32Array(dim);
  let s = h >>> 0;
  for (let i = 0; i < dim; i++) { s = (s * 1664525 + 1013904223) >>> 0; arr[i] = (s / 0xFFFFFFFF) * 2 - 1; }
  let n = 0; for (const x of arr) n += x * x; n = Math.sqrt(n);
  return Array.from(arr).map(x => x / n);
}

export default MultimodalLearningEngine;
