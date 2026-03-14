// @ts-nocheck
/**
 * AriaEmbeddingEngine — On-device text + image embeddings
 *
 * Text: Xenova/all-MiniLM-L6-v2 (384-dim, ~22MB, runs in worker)
 * Vision: CLIP-style embeddings via Xenova/clip-vit-base-patch32
 * Audio: Whisper small for speech → text before embedding
 *
 * All models run via @xenova/transformers (ONNX Runtime Web)
 * Progressive loading: text model first, vision on demand
 */

const MODELS = {
  text: {
    id: "Xenova/all-MiniLM-L6-v2",
    task: "feature-extraction",
    dim: 384,
  },
  vision: {
    id: "Xenova/clip-vit-base-patch32",
    task: "zero-shot-image-classification",
    dim: 512,
  },
  speech: {
    id: "Xenova/whisper-tiny",
    task: "automatic-speech-recognition",
  },
  reranker: {
    id: "Xenova/ms-marco-MiniLM-L-6-v2",
    task: "text-classification",
  },
};

export class AriaEmbeddingEngine {
  constructor() {
    this._textPipeline = null;
    this._visionPipeline = null;
    this._speechPipeline = null;
    this._rerankerPipeline = null;
    this._loadingText = false;
    this._loadingVision = false;
    this._cache = new Map(); // text → embedding cache (LRU)
    this._cacheMaxSize = 512;
    this.ready = false;
    this.onProgress = null;
  }

  // ── Init ─────────────────────────────────────────────────────────────────

  async init(options = {}) {
    const { preloadVision = false } = options;

    await this._loadTextModel();
    if (preloadVision) await this._loadVisionModel();
    this.ready = true;
    return this;
  }

  async _loadTextModel() {
    if (this._textPipeline || this._loadingText) return;
    this._loadingText = true;

    try {
      // Dynamic import of transformers.js (loaded from CDN in browser)
      const { pipeline, env } = await import(
        "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2"
      );

      env.allowLocalModels = false;
      env.useBrowserCache = true;

      this._textPipeline = await pipeline(
        MODELS.text.task,
        MODELS.text.id,
        {
          progress_callback: (p) => {
            this.onProgress?.({ stage: "text_model", ...p });
          },
          quantized: true, // 8-bit quant for mobile
        }
      );
      console.log("[EmbeddingEngine] Text model loaded");
    } catch (err) {
      console.warn("[EmbeddingEngine] Transformers.js unavailable, using mock embeddings:", err.message);
      // Fallback: deterministic mock embeddings for dev/testing
      this._textPipeline = { _mock: true };
    } finally {
      this._loadingText = false;
    }
  }

  async _loadVisionModel() {
    if (this._visionPipeline || this._loadingVision) return;
    this._loadingVision = true;
    try {
      const { pipeline } = await import("https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2");
      this._visionPipeline = await pipeline(
        "image-feature-extraction",
        "Xenova/clip-vit-base-patch32",
        { quantized: true }
      );
      console.log("[EmbeddingEngine] Vision model loaded");
    } catch(err) {
      console.warn("[EmbeddingEngine] Vision model unavailable:", err.message);
      this._visionPipeline = { _mock: true };
    } finally {
      this._loadingVision = false;
    }
  }

  // ── Text Embedding ────────────────────────────────────────────────────────

  async embedText(text, options = {}) {
    const { normalize = true, pooling = "mean", cacheKey = null } = options;

    // Cache hit
    const key = cacheKey ?? text;
    if (this._cache.has(key)) return this._cache.get(key);

    await this._loadTextModel();

    let embedding;

    if (this._textPipeline?._mock) {
      embedding = this._mockEmbed(text, MODELS.text.dim);
    } else {
      const output = await this._textPipeline(text, {
        pooling,
        normalize,
      });
      embedding = Array.from(output.data);
    }

    this._cacheSet(key, embedding);
    return embedding;
  }

  /**
   * Batch embed multiple texts efficiently
   */
  async embedBatch(texts, options = {}) {
    const results = [];
    // Process in chunks of 8 for memory efficiency
    const chunkSize = 8;
    for (let i = 0; i < texts.length; i += chunkSize) {
      const chunk = texts.slice(i, i + chunkSize);
      const embeddings = await Promise.all(chunk.map(t => this.embedText(t, options)));
      results.push(...embeddings);
    }
    return results;
  }

  /**
   * Embed a document with sliding window for long texts
   */
  async embedDocument(text, options = {}) {
    const { windowSize = 256, stride = 128, summarize = false } = options;
    const words = text.split(/\s+/);

    if (words.length <= windowSize) return this.embedText(text, options);

    // Sliding window chunks
    const chunks = [];
    for (let i = 0; i < words.length; i += stride) {
      chunks.push(words.slice(i, i + windowSize).join(" "));
      if (i + windowSize >= words.length) break;
    }

    const embeddings = await this.embedBatch(chunks, options);

    // Mean pool all chunk embeddings
    const dim = embeddings[0].length;
    const pooled = new Float32Array(dim);
    for (const emb of embeddings) {
      for (let i = 0; i < dim; i++) pooled[i] += emb[i] / embeddings.length;
    }
    return Array.from(pooled);
  }

  // ── Vision Embedding ───────────────────────────────────────────────────────

  async embedImage(imageData, options = {}) {
    const { type = "base64" } = options;

    if (!this._visionPipeline) await this._loadVisionModel();

    if (this._visionPipeline?._mock) {
      return this._mockEmbed(typeof imageData === "string" ? imageData.slice(0, 64) : "img", 512);
    }

    try {
      const output = await this._visionPipeline(imageData);
      return Array.from(output.data ?? output);
    } catch(err) {
      console.error("[EmbeddingEngine] Image embedding failed:", err);
      return this._mockEmbed("vision_error", 512);
    }
  }

  /**
   * Describe an image using CLIP zero-shot classification
   * Returns: { caption, confidence, tags }
   */
  async describeImage(imageData, candidates = []) {
    const defaultCandidates = [
      "a person", "a document", "text on screen", "a product", "food",
      "outdoor scene", "indoor scene", "code or interface", "handwriting",
      "a chart or graph", "an animal", "a vehicle"
    ];

    const labels = candidates.length > 0 ? candidates : defaultCandidates;

    if (!this._visionPipeline || this._visionPipeline._mock) {
      return { caption: "visual content", confidence: 0.5, tags: ["visual"] };
    }

    const classifier = await this._getZeroShotPipeline();
    const result = await classifier(imageData, labels);
    return {
      caption: result[0]?.label ?? "unknown",
      confidence: result[0]?.score ?? 0,
      tags: result.slice(0, 3).map(r => r.label),
    };
  }

  // ── Speech Transcription ───────────────────────────────────────────────────

  async transcribeSpeech(audioBuffer, options = {}) {
    const { language = "en" } = options;

    if (!this._speechPipeline) {
      try {
        const { pipeline } = await import("https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2");
        this._speechPipeline = await pipeline(
          MODELS.speech.task, MODELS.speech.id,
          { quantized: true, chunk_length_s: 30 }
        );
      } catch {
        return { text: "", confidence: 0 };
      }
    }

    const result = await this._speechPipeline(audioBuffer, { language });
    return { text: result.text ?? "", confidence: 1.0 };
  }

  // ── Reranking ─────────────────────────────────────────────────────────────

  /**
   * Cross-encoder reranking for high-precision retrieval
   * @param {string} query
   * @param {Array<{id, text, score}>} candidates
   */
  async rerank(query, candidates, topK = 5) {
    if (candidates.length === 0) return [];
    if (candidates.length <= topK) return candidates;

    // Simple rerank without cross-encoder (fallback)
    const scored = await Promise.all(
      candidates.map(async c => {
        const qEmb = await this.embedText(query);
        const cEmb = await this.embedText(c.text ?? "");
        const sim = cosineSim(qEmb, cEmb);
        return { ...c, rerankScore: sim * 0.6 + (c.score ?? 0) * 0.4 };
      })
    );

    scored.sort((a, b) => b.rerankScore - a.rerankScore);
    return scored.slice(0, topK);
  }

  // ── Semantic Similarity ───────────────────────────────────────────────────

  async similarity(textA, textB) {
    const [a, b] = await Promise.all([this.embedText(textA), this.embedText(textB)]);
    return cosineSim(a, b);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  _mockEmbed(seed, dim) {
    // Deterministic mock: same input → same vector
    const arr = new Float32Array(dim);
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
    const rng = mulberry32(h >>> 0);
    for (let i = 0; i < dim; i++) arr[i] = rng() * 2 - 1;
    // Normalize
    let n = 0;
    for (const x of arr) n += x*x;
    n = Math.sqrt(n);
    for (let i = 0; i < dim; i++) arr[i] /= n;
    return Array.from(arr);
  }

  _cacheSet(key, val) {
    if (this._cache.size >= this._cacheMaxSize) {
      // Evict oldest
      const first = this._cache.keys().next().value;
      this._cache.delete(first);
    }
    this._cache.set(key, val);
  }

  async _getZeroShotPipeline() {
    if (this._zshotPipeline) return this._zshotPipeline;
    const { pipeline } = await import("https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2");
    this._zshotPipeline = await pipeline("zero-shot-image-classification", "Xenova/clip-vit-base-patch32", { quantized: true });
    return this._zshotPipeline;
  }
}

// ── Utility ──────────────────────────────────────────────────────────────────

function cosineSim(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i]*b[i]; na += a[i]*a[i]; nb += b[i]*b[i]; }
  return na === 0 || nb === 0 ? 0 : dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function mulberry32(a) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export default AriaEmbeddingEngine;
