// @ts-nocheck
/**
 * SelfLearningModel — On-device self-improving language model
 *
 * Combines:
 *  1. SelfAttentionEngine   — tiny transformer with attention introspection
 *  2. TinyTokenizer         — BPE tokenizer that grows with experience
 *  3. WebLLM/TinyLM bridge  — larger model for initial responses
 *  4. Experience replay     — learns from its own outputs
 *  5. Attention-guided updates — Hebbian weight adjustments driven by attention
 *  6. Curiosity signal      — seeks out high-entropy (uncertain) topics
 *
 * Learning loop (runs every N turns):
 *   Forward pass → measure attention entropy → store experience →
 *   Consolidate (replay best experiences) → tokenizer learns new merges →
 *   Confidence metrics update → adapt learning rate
 */

import SelfAttentionEngine from '../attention/SelfAttentionEngine';
import TinyTokenizer, { SPECIAL_TOKENS } from './TinyTokenizer';

// Model config presets
const CONFIGS = {
  nano: {  dModel: 32,  numHeads: 2, numLayers: 2, dFF: 64,  vocabSize: 1024 },
  tiny: {  dModel: 64,  numHeads: 4, numLayers: 3, dFF: 128, vocabSize: 2048 },
  small: { dModel: 128, numHeads: 4, numLayers: 4, dFF: 256, vocabSize: 4096 },
};

export class SelfLearningModel {
  constructor(options = {}) {
    const config = CONFIGS[options.size ?? 'tiny'];

    this.config    = { ...config, ...options };
    this.name      = options.name ?? 'Aria-TinyLM-Self';

    // Core components
    this.tokenizer = new TinyTokenizer({ maxVocabSize: config.vocabSize });
    this.attention = new SelfAttentionEngine(config);

    // Learning state
    this.turnCount        = 0;
    this.learnEveryN      = options.learnEveryN ?? 3;
    this.consolidateEveryN = options.consolidateEveryN ?? 10;

    // Self-awareness state
    this.selfState = {
      confidence:        0.5,   // running avg confidence
      curiosity:         0.5,   // inverse of recent confidence
      learningRate:      0.001, // adapts based on loss
      vocabGrowthRate:   0,     // tokens learned per session
      uncertainTopics:   [],    // topics model struggles with
      strongTopics:      [],    // topics model is confident about
      totalExperiences:  0,
      totalLearningSteps: 0,
    };

    // Interaction history (for self-critique)
    this.history = [];
    this.maxHistory = 40;

    // Self-critique: model evaluates its own outputs
    this.selfCritiqueEnabled = options.selfCritique ?? true;

    // Callbacks
    this.onLearnStep    = null;  // ({ signal, confidence, step })
    this.onConsolidate  = null;  // ({ merged, steps })
    this.onInsight      = null;  // ({ type, content })

    // Persistence key
    this._storageKey = 'aria_selflearning_v1';
  }

  // ── Core Inference ────────────────────────────────────────────────────────

  /**
   * Process input text through the self-attention engine.
   * Returns attention metadata + confidence for every forward pass.
   */
  think(inputText) {
    const ids = this.tokenizer.encode(inputText, { addBos: true, truncate: true });
    if (ids.length === 0) return null;

    const result = this.attention.forward(ids);
    const { attentionMeta } = result;

    // Update running self-state
    const alpha = 0.1;
    this.selfState.confidence = (1 - alpha) * this.selfState.confidence
                              + alpha * attentionMeta.confidence;
    this.selfState.curiosity  = 1 - this.selfState.confidence;

    return {
      tokenIds:    ids,
      logits:      result.logits,
      attention:   attentionMeta,
      confidence:  attentionMeta.confidence,
      uncertain:   attentionMeta.uncertainTokens.map(i => this.tokenizer.decode([ids[i]])),
      topTokens:   this._topLogits(result.logits, 5),
    };
  }

  /**
   * Full self-learning turn:
   *   1. Think (forward pass with attention)
   *   2. Record experience
   *   3. Learn (if learnEveryN turns)
   *   4. Tokenizer learns from text
   *   5. Self-critique (optional)
   */
  async processTurn(userText, ariaResponse) {
    this.turnCount++;

    // 1. Think about the user input
    const thinkResult = this.think(userText);
    if (!thinkResult) return null;

    // 2. Think about the response (self-monitoring)
    const responseThink = this.think(ariaResponse);

    // 3. Compute reward signal:
    //    - High reward if response is confident + relevant
    //    - Low reward if response is uncertain/diffuse
    const reward = this._computeReward(thinkResult, responseThink, userText, ariaResponse);

    // 4. Store experience in attention engine
    const inputIds    = thinkResult.tokenIds;
    const responseIds = responseThink?.tokenIds ?? this.tokenizer.encode(ariaResponse);
    this.attention.learn(inputIds, responseIds, reward);

    // 5. Learn BPE merges from both texts
    const tokLearned = this.tokenizer.learnFromText(userText + ' ' + ariaResponse);

    // 6. Update history
    this.history.push({
      userText,
      ariaResponse,
      confidence:  thinkResult.confidence,
      reward,
      uncertain:   thinkResult.uncertain,
      timestamp:   Date.now(),
    });
    if (this.history.length > this.maxHistory) this.history.shift();

    // 7. Periodic consolidation
    let consolidateResult = null;
    if (this.turnCount % this.consolidateEveryN === 0) {
      consolidateResult = this.attention.consolidate(16);
      this.selfState.totalLearningSteps++;
      this.onConsolidate?.({ ...consolidateResult, turn: this.turnCount });
    }

    // 8. Self-critique: detect topics needing improvement
    if (this.selfCritiqueEnabled) {
      this._updateSelfAwareness(thinkResult, userText);
    }

    this.selfState.totalExperiences++;
    this.selfState.vocabGrowthRate = tokLearned.learned;

    const step = {
      turn:         this.turnCount,
      reward,
      confidence:   thinkResult.confidence,
      uncertain:    thinkResult.uncertain,
      tokenization: tokLearned,
      consolidated: !!consolidateResult,
      learningSignal: this.attention.metrics.learningSignal,
    };

    this.onLearnStep?.(step);
    return step;
  }

  // ── Self-Critique ─────────────────────────────────────────────────────────

  _computeReward(inputThink, responseThink, userText, response) {
    let reward = 0.5; // baseline

    // High confidence in input understanding → good
    reward += inputThink.confidence * 0.2;

    // Response confidence → good
    if (responseThink) reward += responseThink.confidence * 0.2;

    // Penalize very short responses (likely low information)
    if (response.length < 20) reward -= 0.2;

    // Reward relevant response (token overlap)
    const userWords   = new Set(userText.toLowerCase().split(/\s+/));
    const respWords   = response.toLowerCase().split(/\s+/);
    const overlap     = respWords.filter(w => userWords.has(w)).length;
    const relevance   = Math.min(1, overlap / Math.max(respWords.length, 1));
    reward += relevance * 0.1;

    // Penalize if many uncertain tokens
    const uncertainRatio = inputThink.uncertain.length / Math.max(inputThink.tokenIds.length, 1);
    reward -= uncertainRatio * 0.15;

    return Math.max(0, Math.min(1, reward));
  }

  _updateSelfAwareness(thinkResult, text) {
    const topics = this._extractTopics(text);

    if (thinkResult.confidence < 0.3) {
      // Low confidence → add to uncertain topics
      for (const t of topics) {
        if (!this.selfState.uncertainTopics.includes(t)) {
          this.selfState.uncertainTopics.unshift(t);
          this.selfState.uncertainTopics = this.selfState.uncertainTopics.slice(0, 10);
        }
      }
      this.onInsight?.({ type: 'uncertain', content: topics.join(', ') });
    } else if (thinkResult.confidence > 0.7) {
      // High confidence → add to strong topics
      for (const t of topics) {
        if (!this.selfState.strongTopics.includes(t)) {
          this.selfState.strongTopics.unshift(t);
          this.selfState.strongTopics = this.selfState.strongTopics.slice(0, 10);
        }
        // Remove from uncertain if was there
        this.selfState.uncertainTopics = this.selfState.uncertainTopics.filter(u => u !== t);
      }
    }

    // Adapt learning rate based on confidence trend
    const recent = this.history.slice(-5);
    if (recent.length >= 3) {
      const avgConf = recent.reduce((s, h) => s + h.confidence, 0) / recent.length;
      // High confidence → reduce LR (stable); low → increase (explore)
      this.selfState.learningRate = 0.0005 + (1 - avgConf) * 0.002;
      this.attention.learningRate = this.selfState.learningRate;
    }
  }

  // ── Attention Visualization Helpers ───────────────────────────────────────

  /**
   * Returns data for rendering attention heatmap in the UI.
   */
  getAttentionVisualization(inputText) {
    const thinkResult = this.think(inputText);
    if (!thinkResult) return null;

    const flow = this.attention.getAttentionFlow();
    const heatmap = this.attention.getAttentionHeatmap(0, 0);

    const decodedTokens = thinkResult.tokenIds.map(id =>
      this.tokenizer.decode([id], { skipSpecial: false })
    );

    return {
      tokens:          decodedTokens,
      tokenIds:        thinkResult.tokenIds,
      importance:      thinkResult.attention.tokenImportance,
      confidence:      thinkResult.confidence,
      uncertain:       thinkResult.uncertain,
      heatmap:         heatmap?.matrix ?? [],
      entropy:         heatmap?.entropy ?? [],
      flow:            flow?.flow ?? [],
      layerEntropies:  thinkResult.attention.layerEntropies,
      selfState:       { ...this.selfState },
    };
  }

  // ── Persistence ───────────────────────────────────────────────────────────

  serialize() {
    return JSON.stringify({
      config:          this.config,
      selfState:       this.selfState,
      turnCount:       this.turnCount,
      tokenizer:       this.tokenizer.serialize(),
      // Note: attention weights are large — serialize only if explicitly requested
      mergeRules:      this.tokenizer.mergeRules,
      history:         this.history.slice(-20),
    });
  }

  deserializeMeta(data) {
    const obj = JSON.parse(data);
    this.selfState  = { ...this.selfState, ...obj.selfState };
    this.turnCount  = obj.turnCount ?? 0;
    this.history    = obj.history ?? [];
    if (obj.tokenizer) this.tokenizer.deserialize(obj.tokenizer);
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  getStats() {
    return {
      name:        this.name,
      config:      this.config,
      params:      this.attention.getMetrics().weights,
      selfState:   { ...this.selfState },
      tokenizer:   this.tokenizer.getStats(),
      attention:   this.attention.getMetrics(),
      history:     this.history.length,
      turnCount:   this.turnCount,
      recentConfidence: this.history.slice(-5)
        .reduce((s, h) => s + h.confidence, 0) / Math.max(this.history.slice(-5).length, 1),
    };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  _topLogits(logits, k) {
    return logits
      .map((v, i) => ({ id: i, logit: v, token: this.tokenizer.decode([i]) }))
      .sort((a, b) => b.logit - a.logit)
      .slice(0, k);
  }

  _extractTopics(text) {
    const stops = new Set(['the','a','an','is','are','was','be','to','of','and','in','i','you']);
    return [...new Set(
      text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/)
        .filter(w => w.length > 3 && !stops.has(w))
    )].slice(0, 5);
  }
}

export default SelfLearningModel;
