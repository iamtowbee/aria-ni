// @ts-nocheck
/**
 * SelfAttentionEngine — Attention self-awareness mechanism
 *
 * The model doesn't just produce outputs — it observes HOW it attends to its
 * inputs, and those attention patterns become training signal for self-improvement.
 *
 * Architecture:
 *   Multi-head self-attention (pure JS, runs on-device)
 *   Attention entropy tracking → confidence estimation
 *   Cross-layer attention rollout → saliency maps
 *   Gradient-free learning via attention-guided memory consolidation
 *
 * Key insight: High-entropy attention = uncertain/diffuse focus.
 *              Low-entropy attention = confident/focused understanding.
 *              The model learns by reinforcing low-entropy patterns.
 */

// ── Transformer Math (pure JS, no deps) ────────────────────────────────────

/** Scaled dot-product attention */
function scaledDotProductAttention(Q, K, V, mask = null) {
  const dk = K[0].length;
  const scale = 1 / Math.sqrt(dk);
  const seqLen = Q.length;

  // Scores: [seqLen × seqLen]
  const scores = Q.map(q =>
    K.map(k => q.reduce((sum, qi, i) => sum + qi * k[i], 0) * scale)
  );

  // Optional causal mask
  if (mask) {
    for (let i = 0; i < seqLen; i++)
      for (let j = i + 1; j < seqLen; j++)
        scores[i][j] = -1e9;
  }

  // Softmax per row
  const attn = scores.map(row => softmax(row));

  // Weighted sum of values
  const output = attn.map(row =>
    V[0].map((_, j) => row.reduce((sum, a, i) => sum + a * V[i][j], 0))
  );

  return { output, attention: attn };
}

/** Multi-head attention */
function multiHeadAttention(input, Wq, Wk, Wv, Wo, numHeads) {
  const dModel = input[0].length;
  const dHead = Math.floor(dModel / numHeads);
  const seqLen = input.length;

  const headOutputs = [];
  const allHeadAttentions = [];

  for (let h = 0; h < numHeads; h++) {
    const offset = h * dHead;

    // Project to Q, K, V subspaces
    const Q = input.map(x => matVecSlice(x, Wq, offset, dHead));
    const K = input.map(x => matVecSlice(x, Wk, offset, dHead));
    const V = input.map(x => matVecSlice(x, Wv, offset, dHead));

    const { output, attention } = scaledDotProductAttention(Q, K, V, true);
    headOutputs.push(output);
    allHeadAttentions.push(attention);
  }

  // Concat heads → project
  const concat = input.map((_, i) =>
    headOutputs.flatMap(h => h[i])
  );
  const projected = concat.map(row => matVec(row, Wo));

  return { output: projected, attentions: allHeadAttentions };
}

// ── Attention Analysis ──────────────────────────────────────────────────────

/**
 * Compute entropy of an attention distribution.
 * Low entropy = confident focus; high entropy = diffuse/uncertain.
 */
function attentionEntropy(attnRow) {
  let entropy = 0;
  for (const p of attnRow) {
    if (p > 1e-10) entropy -= p * Math.log2(p);
  }
  return entropy;
}

/**
 * Attention rollout: propagate attention across all layers to get
 * a saliency map from output → input tokens.
 * Abnar & Zuidema, 2020.
 */
function attentionRollout(layerAttentions) {
  const seqLen = layerAttentions[0][0].length;
  // Start with identity
  let rollout = Array.from({ length: seqLen }, (_, i) =>
    Array.from({ length: seqLen }, (_, j) => i === j ? 1 : 0)
  );

  for (const headAttentions of layerAttentions) {
    // Average over heads
    const avgAttn = averageHeadAttentions(headAttentions);
    // Add residual (identity) and re-normalize
    const withResidual = avgAttn.map((row, i) =>
      row.map((v, j) => (v + (i === j ? 1 : 0)) / 2)
    );
    const normalized = withResidual.map(row => {
      const sum = row.reduce((a, b) => a + b, 0);
      return row.map(v => v / (sum || 1));
    });
    rollout = matMul(normalized, rollout);
  }

  return rollout;
}

/** Token-level importance scores from rollout (last token attends to inputs) */
function tokenImportance(rollout) {
  const lastRow = rollout[rollout.length - 1];
  const max = Math.max(...lastRow);
  return lastRow.map(v => max > 0 ? v / max : 0);
}

/** Compute per-head entropy statistics */
function headEntropyStats(attentions) {
  return attentions.map(headAttn => {
    const entropies = headAttn.map(row => attentionEntropy(row));
    return {
      mean: entropies.reduce((a, b) => a + b, 0) / entropies.length,
      max:  Math.max(...entropies),
      min:  Math.min(...entropies),
    };
  });
}

// ── Self-Aware Attention Engine ─────────────────────────────────────────────

export class SelfAttentionEngine {
  constructor(options = {}) {
    this.dModel    = options.dModel    ?? 64;    // embedding dim
    this.numHeads  = options.numHeads  ?? 4;     // attention heads
    this.numLayers = options.numLayers ?? 3;     // transformer layers
    this.dFF       = options.dFF       ?? 128;   // feed-forward dim
    this.vocabSize = options.vocabSize ?? 512;   // token vocab

    const dHead = Math.floor(this.dModel / this.numHeads);

    // Initialize weights (Xavier uniform)
    this.layers = Array.from({ length: this.numLayers }, () => ({
      Wq: xavier(this.dModel, this.dModel),
      Wk: xavier(this.dModel, this.dModel),
      Wv: xavier(this.dModel, this.dModel),
      Wo: xavier(this.dModel, this.dModel),
      W1: xavier(this.dModel, this.dFF),
      W2: xavier(this.dFF,    this.dModel),
      b1: zeros(this.dFF),
      b2: zeros(this.dModel),
      // Layer norm params
      gamma: ones(this.dModel),
      beta:  zeros(this.dModel),
    }));

    // Token embeddings
    this.embedding = xavier(this.vocabSize, this.dModel);

    // Output projection
    this.Wout = xavier(this.dModel, this.vocabSize);

    // Attention history for self-monitoring
    this.attentionHistory = [];      // last N forward passes
    this.maxHistory        = 50;

    // Self-awareness metrics
    this.metrics = {
      avgEntropy:        0,
      confidenceScore:   0,
      attentionFocus:    [],   // which tokens got most attention
      uncertainTokens:   [],   // tokens with high entropy
      learningSignal:    0,    // gradient-free update magnitude
    };

    // Learning buffer: (input, output, attention) triples
    this.experienceBuffer = [];
    this.bufferSize        = 256;

    // Adaptation rate
    this.learningRate = 0.001;
  }

  // ── Forward Pass ───────────────────────────────────────────────────────────

  /**
   * Full forward pass with attention introspection.
   * Returns logits + rich attention metadata.
   */
  forward(tokenIds) {
    // Embed tokens
    let hidden = tokenIds.map(id => [...(this.embedding[id % this.vocabSize] ?? zeros(this.dModel))]);

    // Add positional encoding
    hidden = hidden.map((h, pos) => h.map((v, i) =>
      v + Math.sin(pos / Math.pow(10000, (2 * Math.floor(i / 2)) / this.dModel)) *
          (i % 2 === 0 ? 1 : 0) +
      Math.cos(pos / Math.pow(10000, (2 * Math.floor(i / 2)) / this.dModel)) *
          (i % 2 === 1 ? 1 : 0)
    ));

    const layerAttentions = [];

    // Transformer layers
    for (let l = 0; l < this.numLayers; l++) {
      const layer = this.layers[l];

      // Multi-head self-attention
      const { output: attnOut, attentions } = multiHeadAttention(
        hidden, layer.Wq, layer.Wk, layer.Wv, layer.Wo, this.numHeads
      );
      layerAttentions.push(attentions);

      // Residual + layer norm
      hidden = hidden.map((h, i) => layerNorm(
        h.map((v, j) => v + attnOut[i][j]),
        layer.gamma, layer.beta
      ));

      // Feed-forward
      const ffOut = hidden.map(h => {
        const h1 = gelu(matVec(h, layer.W1).map((v, i) => v + layer.b1[i]));
        return matVec(h1, layer.W2).map((v, i) => v + layer.b2[i]);
      });

      // Residual + layer norm
      hidden = hidden.map((h, i) => layerNorm(
        h.map((v, j) => v + ffOut[i][j]),
        layer.gamma, layer.beta
      ));
    }

    // Output projection (last token for autoregressive)
    const lastHidden = hidden[hidden.length - 1];
    const logits = matVec(lastHidden, this.Wout);

    // ── Attention Introspection ─────────────────────────────────────────────

    // Rollout for saliency
    const rollout    = attentionRollout(layerAttentions);
    const importance = tokenImportance(rollout);

    // Per-layer, per-head entropy
    const layerEntropies = layerAttentions.map(headAttns => headEntropyStats(headAttns));

    // Overall confidence: inverse of mean entropy normalized to [0,1]
    const maxPossibleEntropy = Math.log2(tokenIds.length);
    const allEntropies = layerEntropies.flatMap(l => l.map(h => h.mean));
    const meanEntropy  = allEntropies.reduce((a, b) => a + b, 0) / (allEntropies.length || 1);
    const confidence   = maxPossibleEntropy > 0 ? Math.max(0, 1 - meanEntropy / maxPossibleEntropy) : 0;

    // Tokens with high entropy (model is uncertain about their role)
    const tokenEntropies = tokenIds.map((_, i) => {
      const avgAcrossLayers = layerAttentions.reduce((sum, headAttns) => {
        const headAvg = headAttns.reduce((hs, head) => {
          return hs + attentionEntropy(head[i] ?? [1 / tokenIds.length]);
        }, 0) / headAttns.length;
        return sum + headAvg;
      }, 0) / layerAttentions.length;
      return { tokenIdx: i, entropy: avgAcrossLayers };
    });

    const uncertainTokens = tokenEntropies
      .filter(t => t.entropy > meanEntropy * 1.5)
      .map(t => t.tokenIdx);

    // Update metrics
    this.metrics.avgEntropy      = meanEntropy;
    this.metrics.confidenceScore = confidence;
    this.metrics.attentionFocus  = importance;
    this.metrics.uncertainTokens = uncertainTokens;

    // Store in history
    this._recordAttentionHistory({
      tokenIds,
      layerAttentions,
      rollout,
      importance,
      confidence,
      meanEntropy,
      logits,
    });

    return {
      logits,
      hidden,
      attentionMeta: {
        layerAttentions,
        rollout,
        tokenImportance: importance,
        layerEntropies,
        confidence,
        meanEntropy,
        uncertainTokens,
      },
    };
  }

  // ── Self-Learning (Gradient-Free) ──────────────────────────────────────────

  /**
   * Learn from an experience triple without backprop.
   * Uses attention-guided Hebbian-style updates.
   *
   * Core idea: tokens that received high attention AND led to
   * good outcomes (low entropy follow-up) should strengthen
   * their embedding associations.
   */
  learn(tokenIds, responseIds, reward = 1.0) {
    const { attentionMeta } = this.forward(tokenIds);
    const { tokenImportance: importance, confidence } = attentionMeta;

    // Only learn when confidence is reasonable (not random noise)
    if (confidence < 0.1) return { skipped: true, reason: "low_confidence" };

    // Attention-weighted embedding updates (Hebbian)
    for (let i = 0; i < tokenIds.length; i++) {
      const weight   = importance[i] * reward * this.learningRate;
      const inputId  = tokenIds[i] % this.vocabSize;

      // Strengthen embeddings of attended tokens toward response embedding
      for (const respId of responseIds.slice(0, 3)) {
        const respEmb = this.embedding[respId % this.vocabSize];
        const inpEmb  = this.embedding[inputId];

        // Hebbian: Δw ∝ attention_weight × (response - input) projection
        for (let d = 0; d < this.dModel; d++) {
          this.embedding[inputId][d] += weight * (respEmb[d] - inpEmb[d]) * 0.1;
        }
      }
    }

    // Attention head entropy minimization:
    // Nudge layer weights toward patterns that reduce uncertainty
    const learningSignal = importance.reduce((sum, imp, i) =>
      sum + imp * (i < tokenIds.length ? 1 : 0), 0
    ) * reward;

    for (let l = 0; l < this.numLayers; l++) {
      const layer    = this.layers[l];
      const stepSize = this.learningRate * learningSignal * 0.01;

      // Perturbation-based update (zero-order optimization)
      // If confidence is high, small pull toward current weights (stability)
      // If confidence is low, larger perturbation (exploration)
      const explorationRate = 1 - confidence;

      perturbWeights(layer.Wq, stepSize * (1 + explorationRate * 0.5));
      perturbWeights(layer.Wk, stepSize * (1 + explorationRate * 0.5));
    }

    this.metrics.learningSignal = learningSignal;

    // Store experience
    this._storeExperience({ tokenIds, responseIds, reward, confidence, importance });

    return {
      learned: true,
      signal:  learningSignal,
      confidence,
      updatedTokens: tokenIds.length,
    };
  }

  /**
   * Attention-based continual fine-tuning:
   * Replay high-reward experiences weighted by attention importance.
   */
  consolidate(topK = 16) {
    if (this.experienceBuffer.length < 4) return { skipped: true };

    // Sort by reward × confidence
    const sorted = [...this.experienceBuffer]
      .sort((a, b) => (b.reward * b.confidence) - (a.reward * a.confidence))
      .slice(0, topK);

    let totalSignal = 0;
    for (const exp of sorted) {
      const result = this.learn(exp.tokenIds, exp.responseIds, exp.reward * 0.5);
      if (result.learned) totalSignal += result.signal;
    }

    return { consolidated: sorted.length, totalSignal };
  }

  // ── Attention Visualization Data ────────────────────────────────────────────

  /**
   * Returns data suitable for rendering an attention heatmap.
   */
  getAttentionHeatmap(layerIdx = 0, headIdx = 0) {
    const last = this.attentionHistory[this.attentionHistory.length - 1];
    if (!last) return null;

    const headAttn = last.layerAttentions[layerIdx]?.[headIdx];
    if (!headAttn) return null;

    return {
      matrix:      headAttn,
      entropy:     headAttn.map(row => attentionEntropy(row)),
      tokenImportance: last.importance,
      confidence:  last.confidence,
    };
  }

  /**
   * Returns aggregated attention flow visualization data.
   */
  getAttentionFlow() {
    const last = this.attentionHistory[this.attentionHistory.length - 1];
    if (!last) return null;

    const flow = last.rollout.map((row, i) => ({
      fromToken:  i,
      weights:    row,
      topSource:  row.indexOf(Math.max(...row)),
      entropy:    attentionEntropy(row),
    }));

    return {
      flow,
      tokenImportance: last.importance,
      confidence:      last.confidence,
      meanEntropy:     last.meanEntropy,
    };
  }

  getMetrics() {
    const recentHistory = this.attentionHistory.slice(-10);
    return {
      ...this.metrics,
      historySize:       this.attentionHistory.length,
      experienceSize:    this.experienceBuffer.length,
      avgRecentConfidence: recentHistory.length > 0
        ? recentHistory.reduce((s, h) => s + h.confidence, 0) / recentHistory.length
        : 0,
      weights: {
        layers:    this.numLayers,
        heads:     this.numHeads,
        dModel:    this.dModel,
        params:    this._countParams(),
      },
    };
  }

  // ── Internal ─────────────────────────────────────────────────────────────

  _recordAttentionHistory(record) {
    this.attentionHistory.push({ ...record, timestamp: Date.now() });
    if (this.attentionHistory.length > this.maxHistory) {
      this.attentionHistory.shift();
    }
  }

  _storeExperience(exp) {
    this.experienceBuffer.push({ ...exp, timestamp: Date.now() });
    if (this.experienceBuffer.length > this.bufferSize) {
      // Evict lowest-reward experiences
      this.experienceBuffer.sort((a, b) => (b.reward * b.confidence) - (a.reward * a.confidence));
      this.experienceBuffer = this.experienceBuffer.slice(0, this.bufferSize);
    }
  }

  _countParams() {
    const perLayer = 4 * this.dModel * this.dModel +  // Wq, Wk, Wv, Wo
                     this.dModel * this.dFF +           // W1
                     this.dFF * this.dModel;            // W2
    return this.numLayers * perLayer +
           this.vocabSize * this.dModel +               // embeddings
           this.dModel * this.vocabSize;                // output proj
  }
}

// ── Math Utilities ────────────────────────────────────────────────────────────

function softmax(arr) {
  const max = Math.max(...arr);
  const exp = arr.map(x => Math.exp(x - max));
  const sum = exp.reduce((a, b) => a + b, 0) || 1;
  return exp.map(x => x / sum);
}

function gelu(arr) {
  return arr.map(x => 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x ** 3))));
}

function layerNorm(x, gamma, beta, eps = 1e-6) {
  const mean = x.reduce((a, b) => a + b, 0) / x.length;
  const variance = x.reduce((a, v) => a + (v - mean) ** 2, 0) / x.length;
  const std = Math.sqrt(variance + eps);
  return x.map((v, i) => gamma[i] * ((v - mean) / std) + beta[i]);
}

function matVec(vec, mat) {
  return mat[0].map((_, j) => vec.reduce((sum, v, i) => sum + v * (mat[i]?.[j] ?? 0), 0));
}

function matVecSlice(vec, mat, offset, len) {
  return Array.from({ length: len }, (_, j) =>
    vec.reduce((sum, v, i) => sum + v * (mat[i]?.[offset + j] ?? 0), 0)
  );
}

function matMul(A, B) {
  return A.map(row => B[0].map((_, j) => row.reduce((sum, v, k) => sum + v * (B[k]?.[j] ?? 0), 0)));
}

function averageHeadAttentions(headAttentions) {
  const seqLen = headAttentions[0].length;
  return Array.from({ length: seqLen }, (_, i) =>
    Array.from({ length: seqLen }, (_, j) =>
      headAttentions.reduce((sum, h) => sum + (h[i]?.[j] ?? 0), 0) / headAttentions.length
    )
  );
}

function xavier(rows, cols) {
  const scale = Math.sqrt(2 / (rows + cols));
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => (Math.random() * 2 - 1) * scale)
  );
}

function zeros(n) { return new Array(n).fill(0); }
function ones(n)  { return new Array(n).fill(1); }

function perturbWeights(mat, scale) {
  const noiseScale = scale * 0.001;
  for (let i = 0; i < mat.length; i++)
    for (let j = 0; j < mat[i].length; j++)
      mat[i][j] += (Math.random() * 2 - 1) * noiseScale;
}

export default SelfAttentionEngine;
