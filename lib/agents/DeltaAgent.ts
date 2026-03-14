// agents/DeltaAgent.js
// Emotional intelligence agent.
// Detects user emotion, tracks mood state, and advises CoreAgent on tone adaptation.

export const EMOTIONS = {
  NEUTRAL:  { id: 'neutral',   valence: 0,    arousal: 0,    color: '#9E9E9E' },
  HAPPY:    { id: 'happy',     valence: 1,    arousal: 0.6,  color: '#FFD600' },
  SAD:      { id: 'sad',       valence: -1,   arousal: -0.5, color: '#5C6BC0' },
  ANGRY:    { id: 'angry',     valence: -0.8, arousal: 0.9,  color: '#E53935' },
  ANXIOUS:  { id: 'anxious',   valence: -0.5, arousal: 0.8,  color: '#FF7043' },
  EXCITED:  { id: 'excited',   valence: 0.9,  arousal: 1.0,  color: '#AB47BC' },
  TIRED:    { id: 'tired',     valence: -0.2, arousal: -0.9, color: '#78909C' },
  CURIOUS:  { id: 'curious',   valence: 0.5,  arousal: 0.4,  color: '#26C6DA' },
  CONFUSED: { id: 'confused',  valence: -0.3, arousal: 0.2,  color: '#FFA726' },
  GRATEFUL: { id: 'grateful',  valence: 0.9,  arousal: 0.2,  color: '#66BB6A' },
};

// Simple keyword lexicon — extend or replace with a proper sentiment model
const EMOTION_LEXICON = {
  happy:    ['happy', 'great', 'love', 'wonderful', 'amazing', 'fantastic', 'joy', 'yay', '😊', '😄', '❤️'],
  sad:      ['sad', 'unhappy', 'depressed', 'cry', 'crying', 'miss', 'lonely', 'hurt', 'pain', '😢', '😭'],
  angry:    ['angry', 'furious', 'annoyed', 'mad', 'hate', 'ugh', 'stupid', 'idiot', '😠', '😤', '🤬'],
  anxious:  ['anxious', 'worried', 'nervous', 'scared', 'fear', 'panic', 'stress', 'stressed', '😰', '😨'],
  excited:  ['excited', 'can\'t wait', 'awesome', 'yes!', 'omg', 'wow', 'epic', '🎉', '🚀', '🔥'],
  tired:    ['tired', 'exhausted', 'sleepy', 'bored', 'ugh', 'whatever', 'can\'t', '😴', '💤'],
  curious:  ['curious', 'wondering', 'how', 'why', 'what if', 'interesting', 'tell me', '🤔'],
  confused: ['confused', 'don\'t understand', 'what?', 'huh', 'unclear', 'lost', '😕', '🤨'],
  grateful: ['thank', 'thanks', 'appreciate', 'grateful', 'helpful', 'awesome help', '🙏'],
};

export class DeltaAgent {
  constructor(config = {}) {
    this.currentEmotion = EMOTIONS.NEUTRAL;
    this.emotionHistory = [];   // Rolling log of { emotion, confidence, ts }
    this.maxHistory = config.maxHistory ?? 20;

    // Mood smoothing: blend current + incoming emotion
    this.smoothingFactor = config.smoothingFactor ?? 0.4;

    // Sentiment trend: valence running average
    this._valenceWindow = [];
    this._maxWindowSize = 10;
  }

  // ─── Primary ─────────────────────────────────────────────────────────────────

  /**
   * Analyse text and update internal emotion state.
   * Returns { emotion, confidence, toneRecommendation }.
   */
  analyse(text) {
    if (!text?.trim()) return this._wrap(this.currentEmotion, 0);

    const { emotion, confidence } = this._detect(text);
    this._updateState(emotion, confidence);

    return {
      emotion: this.currentEmotion,
      confidence,
      toneRecommendation: this._toneFor(this.currentEmotion),
      avatarHint: this._avatarHintFor(this.currentEmotion),
      trend: this._trend(),
    };
  }

  /**
   * Generate a plain-English context string for CoreAgent system prompt.
   */
  getCoreContext() {
    const e = this.currentEmotion;
    const trend = this._trend();
    return {
      currentEmotion: e.id,
      valence: e.valence,
      arousal: e.arousal,
      trend,
      recommendation: this._toneFor(e),
    };
  }

  /**
   * Explicitly set emotion (e.g. from UI emoji picker or avatar tap).
   */
  setEmotion(emotionId, confidence = 1.0) {
    const emotion = EMOTIONS[emotionId.toUpperCase()] ?? EMOTIONS.NEUTRAL;
    this._updateState(emotion, confidence);
    return this.currentEmotion;
  }

  getEmotionHistory(count = 5) {
    return this.emotionHistory.slice(-count);
  }

  reset() {
    this.currentEmotion = EMOTIONS.NEUTRAL;
    this.emotionHistory = [];
    this._valenceWindow = [];
  }

  // ─── Private ─────────────────────────────────────────────────────────────────

  _detect(text) {
    const lower = text.toLowerCase();
    const scores = {};

    for (const [emotionId, keywords] of Object.entries(EMOTION_LEXICON)) {
      const hits = keywords.filter(kw => lower.includes(kw)).length;
      if (hits > 0) scores[emotionId] = hits;
    }

    if (Object.keys(scores).length === 0) {
      return { emotion: EMOTIONS.NEUTRAL, confidence: 0.3 };
    }

    // Pick highest score
    const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
    const emotionKey = best[0].toUpperCase();
    const confidence = Math.min(0.95, 0.4 + best[1] * 0.2);

    return { emotion: EMOTIONS[emotionKey] ?? EMOTIONS.NEUTRAL, confidence };
  }

  _updateState(incoming, confidence) {
    // Blend: new state = old + factor*(incoming - old)
    const blendedValence =
      this.currentEmotion.valence +
      this.smoothingFactor * confidence * (incoming.valence - this.currentEmotion.valence);

    const blendedArousal =
      this.currentEmotion.arousal +
      this.smoothingFactor * confidence * (incoming.arousal - this.currentEmotion.arousal);

    // Find closest named emotion to blended values
    this.currentEmotion = this._closestEmotion(blendedValence, blendedArousal);

    // Track history
    this.emotionHistory.push({ emotion: this.currentEmotion.id, confidence, ts: Date.now() });
    if (this.emotionHistory.length > this.maxHistory) this.emotionHistory.shift();

    // Track valence trend
    this._valenceWindow.push(blendedValence);
    if (this._valenceWindow.length > this._maxWindowSize) this._valenceWindow.shift();
  }

  _closestEmotion(valence, arousal) {
    let best = EMOTIONS.NEUTRAL;
    let minDist = Infinity;

    for (const e of Object.values(EMOTIONS)) {
      const dist = Math.hypot(e.valence - valence, e.arousal - arousal);
      if (dist < minDist) { minDist = dist; best = e; }
    }

    return best;
  }

  _trend() {
    if (this._valenceWindow.length < 3) return 'stable';
    const half = Math.floor(this._valenceWindow.length / 2);
    const recent = this._valenceWindow.slice(-half).reduce((a, b) => a + b, 0) / half;
    const older  = this._valenceWindow.slice(0, half).reduce((a, b) => a + b, 0) / half;
    const delta  = recent - older;
    if (delta > 0.15) return 'improving';
    if (delta < -0.15) return 'declining';
    return 'stable';
  }

  _toneFor(emotion) {
    const map = {
      neutral:  'balanced and clear',
      happy:    'warm and celebratory',
      sad:      'gentle, empathetic, and supportive',
      angry:    'calm, de-escalating, and patient',
      anxious:  'reassuring, slow-paced, and grounding',
      excited:  'energetic and enthusiastic',
      tired:    'concise, low-energy, avoid long responses',
      curious:  'exploratory and informative',
      confused: 'clear, step-by-step, avoid jargon',
      grateful: 'warm and appreciative',
    };
    return map[emotion.id] ?? 'balanced and clear';
  }

  _avatarHintFor(emotion) {
    const map = {
      neutral:  { expression: 'neutral',  eyeSpeed: 1.0, glowColor: '#9E9E9E' },
      happy:    { expression: 'smile',    eyeSpeed: 1.2, glowColor: '#FFD600' },
      sad:      { expression: 'sad',      eyeSpeed: 0.7, glowColor: '#5C6BC0' },
      angry:    { expression: 'frown',    eyeSpeed: 1.5, glowColor: '#E53935' },
      anxious:  { expression: 'nervous',  eyeSpeed: 1.8, glowColor: '#FF7043' },
      excited:  { expression: 'wide',     eyeSpeed: 1.6, glowColor: '#AB47BC' },
      tired:    { expression: 'droopy',   eyeSpeed: 0.5, glowColor: '#78909C' },
      curious:  { expression: 'raised',   eyeSpeed: 1.1, glowColor: '#26C6DA' },
      confused: { expression: 'squint',   eyeSpeed: 0.9, glowColor: '#FFA726' },
      grateful: { expression: 'smile',    eyeSpeed: 0.9, glowColor: '#66BB6A' },
    };
    return map[emotion.id] ?? map.neutral;
  }

  _wrap(emotion, confidence) {
    return {
      emotion,
      confidence,
      toneRecommendation: this._toneFor(emotion),
      avatarHint: this._avatarHintFor(emotion),
      trend: 'stable',
    };
  }
}
