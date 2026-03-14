// @ts-nocheck
/**
 * OnDeviceTrainer
 * Real gradient-based on-device ML training via @tensorflow/tfjs-react-native.
 *
 * Four trainable heads (all trained on-device, zero cloud):
 *
 *   1. EmbeddingAdapter  [D→bottleneck→D]  — personalises token representations
 *   2. PreferenceHead    [D→32→1]          — predicts reward from response embedding
 *   3. RetrievalReranker [2D→32→1]         — learns which memories are relevant to this user
 *   4. AttentionProbe    [D→16→1]          — predicts token entropy before forward pass
 *
 * Two-speed learning:
 *   Fast  — SelfAttentionEngine Hebbian updates  (every turn, ~0ms, no gradients)
 *   Slow  — OnDeviceTrainer SGD/Adam             (every 5 turns, background microtask)
 *
 * Training workflow:
 *   ingest() → ring buffer → train() runs every trainEveryN turns →
 *   TF.js model.fit() with shuffle + dropout → asyncStorageIO persists weights
 */

import * as tf from '@tensorflow/tfjs';
import { asyncStorageIO } from '@tensorflow/tfjs-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  ADAPTER:  'aria_tf_adapter_v2',
  PREF:     'aria_tf_pref_v2',
  RERANKER: 'aria_tf_reranker_v2',
  PROBE:    'aria_tf_probe_v2',
  LOG:      'aria_tf_log_v2',
};

// ── Model builders ─────────────────────────────────────────────────────────────

function makeAdapter(D = 64, bottle = 16) {
  const m = tf.sequential({ name: 'adapter' });
  m.add(tf.layers.dense({ units: bottle, inputShape: [D], activation: 'relu',
    kernelInitializer: 'glorotUniform', biasInitializer: 'zeros' }));
  m.add(tf.layers.dropout({ rate: 0.1 }));
  // Init output to zeros so residual starts as identity
  m.add(tf.layers.dense({ units: D, activation: 'linear',
    kernelInitializer: 'zeros', biasInitializer: 'zeros' }));
  m.compile({ optimizer: tf.train.adam(1e-3), loss: 'meanSquaredError' });
  return m;
}

function makePreferenceHead(D = 64) {
  const m = tf.sequential({ name: 'pref' });
  m.add(tf.layers.dense({ units: 32, inputShape: [D], activation: 'relu',
    kernelRegularizer: tf.regularizers.l2({ l2: 1e-2 }) }));
  m.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
  m.compile({ optimizer: tf.train.adam(5e-4), loss: 'binaryCrossentropy',
    metrics: ['accuracy'] });
  return m;
}

function makeReranker(D = 64) {
  const inp = tf.input({ shape: [D * 2] });
  const h1  = tf.layers.dense({ units: 32, activation: 'relu' }).apply(inp);
  const h2  = tf.layers.dense({ units: 16, activation: 'relu' }).apply(h1);
  const out = tf.layers.dense({ units: 1,  activation: 'sigmoid' }).apply(h2);
  const m   = tf.model({ inputs: inp, outputs: out, name: 'reranker' });
  m.compile({ optimizer: tf.train.adam(1e-3), loss: 'binaryCrossentropy' });
  return m;
}

function makeProbe(D = 64) {
  const m = tf.sequential({ name: 'probe' });
  m.add(tf.layers.dense({ units: 16, inputShape: [D], activation: 'tanh' }));
  m.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
  m.compile({ optimizer: tf.train.adam(2e-3), loss: 'meanSquaredError' });
  return m;
}

// ── OnDeviceTrainer ────────────────────────────────────────────────────────────

export class OnDeviceTrainer {
  constructor(opts = {}) {
    this.D           = opts.embedDim    ?? 64;
    this.bottle      = opts.bottleneck  ?? 16;
    this.batchSize   = opts.batchSize   ?? 8;
    this.epochs      = opts.epochs      ?? 3;
    this.maxBuffer   = opts.maxBuffer   ?? 128;
    this.trainEveryN = opts.trainEveryN ?? 5;

    this.adapter  = null;
    this.pref     = null;
    this.reranker = null;
    this.probe    = null;

    this.ready   = false;
    this.backend = 'none';
    this._queue  = 0;
    this._training = false;

    // Ring buffers
    this.buf = {
      inEmb:   [],   // number[][D]
      outEmb:  [],   // number[][D]
      rewards: [],   // number[]
      entropy: [],   // number[][] (per-token)
      pairs:   [],   // { qEmb, mEmb, rel }[]
    };

    // Training log
    this.log = {
      sessions:    0,
      totalEpochs: 0,
      lossHistory: { adapter: [], pref: [], reranker: [], probe: [] },
      lastAt:      null,
      backend:     'none',
    };

    // Callbacks
    this.onReady      = null;  // ({ backend })
    this.onTrainStart = null;  // ({ bufferN, session })
    this.onEpochEnd   = null;  // ({ name, epoch, loss })
    this.onTrainDone  = null;  // ({ session, losses, ms })
    this.onError      = null;  // (err)
  }

  // ── Init ────────────────────────────────────────────────────────────────────

  async init() {
    try {
      await tf.ready();
      // rn-webgl = GPU via expo-gl; fallback to CPU
      for (const backend of ['rn-webgl', 'webgl', 'cpu']) {
        try { await tf.setBackend(backend); break; } catch { /* try next */ }
      }
      this.backend = tf.getBackend();

      this.adapter  = makeAdapter(this.D, this.bottle);
      this.pref     = makePreferenceHead(this.D);
      this.reranker = makeReranker(this.D);
      this.probe    = makeProbe(this.D);

      await this._loadAll();   // restore saved weights if any

      this.ready = true;
      this.log.backend = this.backend;
      this.onReady?.({ backend: this.backend });
    } catch (e) {
      this.onError?.(e);
    }
    return this;
  }

  // ── Ingestion ────────────────────────────────────────────────────────────────

  /**
   * Feed one completed turn into the training buffers.
   * Called from useAriaAI after every sendMessage().
   *
   * @param inEmb      number[] – embedding of user input
   * @param outEmb     number[] – embedding of aria response
   * @param reward     number   – turn reward from SelfLearningModel
   * @param tokenEntropies number[] – per-token entropy from SelfAttentionEngine
   * @param memPairs   { qEmb, mEmb, rel }[] – positive/negative memory pairs
   */
  ingest({ inEmb, outEmb, reward, tokenEntropies, memPairs = [] }) {
    if (inEmb)  this._push(this.buf.inEmb,   this._pad(inEmb));
    if (outEmb) this._push(this.buf.outEmb,  this._pad(outEmb));
    if (reward !== undefined) this._push(this.buf.rewards, reward);
    if (tokenEntropies?.length) this._push(this.buf.entropy, tokenEntropies);
    for (const p of memPairs) this._push(this.buf.pairs, p, this.maxBuffer * 2);

    this._queue++;
    if (this._queue >= this.trainEveryN && this.ready && !this._training) {
      this._queue = 0;
      setTimeout(() => this.train(), 0); // microtask — never block UI
    }
  }

  // ── Training ─────────────────────────────────────────────────────────────────

  async train() {
    if (!this.ready || this._training) return { skipped: 'busy' };
    if (this.buf.inEmb.length < this.batchSize) return { skipped: 'buffer_too_small' };

    this._training = true;
    const session = ++this.log.sessions;
    const t0 = Date.now();
    this.onTrainStart?.({ bufferN: this.buf.inEmb.length, session });

    const losses = {};

    try {
      // 1. Adapter: map inEmb → outEmb (learn user communication style)
      losses.adapter = await this._fitPairs(
        this.adapter, this.buf.inEmb, this.buf.outEmb
      );

      // 2. Preference head: outEmb → reward
      if (this.buf.rewards.length >= this.batchSize) {
        const len = Math.min(this.buf.outEmb.length, this.buf.rewards.length);
        losses.pref = await this._fit(
          this.pref,
          this.buf.outEmb.slice(-len),
          this.buf.rewards.slice(-len).map(r => [r])
        );
      }

      // 3. Reranker: [qEmb‖mEmb] → relevance score
      if (this.buf.pairs.length >= this.batchSize) {
        const ps = this.buf.pairs.slice(-this.maxBuffer);
        losses.reranker = await this._fit(
          this.reranker,
          ps.map(p => [...this._pad(p.qEmb), ...this._pad(p.mEmb)]),
          ps.map(p => [p.rel ? 1 : 0])
        );
      }

      // 4. Probe: inEmb → expected entropy
      if (this.buf.entropy.length >= this.batchSize &&
          this.buf.inEmb.length  >= this.batchSize) {
        const len  = Math.min(this.buf.inEmb.length, this.buf.entropy.length);
        const maxH = Math.log2(Math.max(this.buf.entropy[0]?.length ?? 1, 2));
        losses.probe = await this._fit(
          this.probe,
          this.buf.inEmb.slice(-len),
          this.buf.entropy.slice(-len).map(e => {
            const mean = e.reduce((s, v) => s + v, 0) / (e.length || 1);
            return [Math.min(1, mean / maxH)];
          })
        );
      }
    } finally {
      this._training = false;
    }

    const ms = Date.now() - t0;
    this.log.totalEpochs += this.epochs;
    this.log.lastAt = Date.now();

    for (const [k, v] of Object.entries(losses)) {
      if (v !== undefined) {
        this.log.lossHistory[k] ??= [];
        this.log.lossHistory[k].push(+v.toFixed(5));
        if (this.log.lossHistory[k].length > 40) this.log.lossHistory[k].shift();
      }
    }

    await this._saveAll();
    this.onTrainDone?.({ session, losses, ms });
    return { trained: true, session, losses, ms };
  }

  // ── Inference (called live during chat) ───────────────────────────────────

  /** Apply residual adapter to personalise an embedding. */
  adapt(emb) {
    if (!this.ready || !this.adapter) return emb;
    return tf.tidy(() => {
      const x   = tf.tensor2d([this._pad(emb)]);
      const out = Array.from(this.adapter.predict(x).dataSync());
      return Array.from(emb).map((v, i) => v + (out[i] ?? 0) * 0.15);
    });
  }

  /** Score (query, memory) pair relevance. */
  scoreMemory(qEmb, mEmb) {
    if (!this.ready || !this.reranker) return 0.5;
    return tf.tidy(() => {
      const x = tf.tensor2d([[...this._pad(qEmb), ...this._pad(mEmb)]]);
      return this.reranker.predict(x).dataSync()[0];
    });
  }

  /** Predict expected entropy for an embedding. */
  predictEntropy(emb) {
    if (!this.ready || !this.probe) return 0.5;
    return tf.tidy(() =>
      this.probe.predict(tf.tensor2d([this._pad(emb)])).dataSync()[0]
    );
  }

  /** Score preference for a response. */
  preferenceScore(emb) {
    if (!this.ready || !this.pref) return 0.5;
    return tf.tidy(() =>
      this.pref.predict(tf.tensor2d([this._pad(emb)])).dataSync()[0]
    );
  }

  // ── Persistence ─────────────────────────────────────────────────────────────

  async _saveAll() {
    try {
      await Promise.all([
        this.adapter.save(asyncStorageIO(KEYS.ADAPTER)),
        this.pref.save(asyncStorageIO(KEYS.PREF)),
        this.reranker.save(asyncStorageIO(KEYS.RERANKER)),
        this.probe.save(asyncStorageIO(KEYS.PROBE)),
        AsyncStorage.setItem(KEYS.LOG, JSON.stringify(this.log)),
      ]);
    } catch (e) { this.onError?.(e); }
  }

  async _loadAll() {
    const tryLoad = async (key) => {
      try { return await tf.loadLayersModel(asyncStorageIO(key)); } catch { return null; }
    };

    const [a, p, r, pr] = await Promise.all([
      tryLoad(KEYS.ADAPTER), tryLoad(KEYS.PREF),
      tryLoad(KEYS.RERANKER), tryLoad(KEYS.PROBE),
    ]);

    if (a)  { this.adapter  = a;  this.adapter.compile({  optimizer: tf.train.adam(1e-3), loss: 'meanSquaredError' }); }
    if (p)  { this.pref     = p;  this.pref.compile({     optimizer: tf.train.adam(5e-4), loss: 'binaryCrossentropy', metrics: ['accuracy'] }); }
    if (r)  { this.reranker = r;  this.reranker.compile({ optimizer: tf.train.adam(1e-3), loss: 'binaryCrossentropy' }); }
    if (pr) { this.probe    = pr; this.probe.compile({    optimizer: tf.train.adam(2e-3), loss: 'meanSquaredError' }); }

    const logRaw = await AsyncStorage.getItem(KEYS.LOG).catch(() => null);
    if (logRaw) { try { Object.assign(this.log, JSON.parse(logRaw)); } catch {} }
  }

  // ── Internal helpers ─────────────────────────────────────────────────────────

  async _fit(model, xs, ys) {
    if (!xs?.length || xs.length < this.batchSize) return undefined;
    const len = Math.min(xs.length, ys.length, this.batchSize * 8);
    try {
      const xT = tf.tensor2d(xs.slice(-len));
      const yT = tf.tensor2d(ys.slice(-len));
      const h  = await model.fit(xT, yT, {
        epochs: this.epochs, batchSize: this.batchSize, shuffle: true, verbose: 0,
        callbacks: { onEpochEnd: (ep, logs) => this.onEpochEnd?.({ ep, loss: logs.loss }) }
      });
      xT.dispose(); yT.dispose();
      return h.history.loss.at(-1);
    } catch (e) { this.onError?.(e); return undefined; }
  }

  async _fitPairs(model, xBuf, yBuf) {
    const len = Math.min(xBuf.length, yBuf.length, this.batchSize * 8);
    return len >= this.batchSize
      ? this._fit(model, xBuf.slice(-len), yBuf.slice(-len))
      : undefined;
  }

  _push(arr, val, max = this.maxBuffer) {
    arr.push(val);
    while (arr.length > max) arr.shift();
  }

  _pad(arr) {
    const a = Array.from(arr ?? []);
    if (a.length === this.D) return a;
    if (a.length  > this.D) return a.slice(0, this.D);
    return [...a, ...new Array(this.D - a.length).fill(0)];
  }

  getStats() {
    return {
      ready: this.ready, backend: this.backend,
      sessions: this.log.sessions, totalEpochs: this.log.totalEpochs,
      lastAt: this.log.lastAt, training: this._training,
      buffers: {
        inEmb: this.buf.inEmb.length, outEmb: this.buf.outEmb.length,
        rewards: this.buf.rewards.length, entropy: this.buf.entropy.length,
        pairs: this.buf.pairs.length,
      },
      lossHistory: this.log.lossHistory,
      tfMemory: typeof tf.memory === 'function' ? tf.memory() : null,
    };
  }

  dispose() {
    [this.adapter, this.pref, this.reranker, this.probe]
      .forEach(m => { try { m?.dispose(); } catch {} });
  }
}

export default OnDeviceTrainer;
