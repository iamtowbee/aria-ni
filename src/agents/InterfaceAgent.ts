// agents/InterfaceAgent.js
// Avatar & UI control agent.
// Translates ecosystem events into concrete UI state changes —
// avatar expression, animations, theme, layout, notifications.

import { Animated, Vibration, Platform } from 'react-native';

// ─── Avatar states ────────────────────────────────────────────────────────────

export const AVATAR_STATES = {
  IDLE:       { id: 'idle',       animation: 'breathe',    label: 'Idle' },
  LISTENING:  { id: 'listening',  animation: 'pulse',      label: 'Listening' },
  THINKING:   { id: 'thinking',   animation: 'spin_slow',  label: 'Thinking' },
  SPEAKING:   { id: 'speaking',   animation: 'wave',       label: 'Speaking' },
  HAPPY:      { id: 'happy',      animation: 'bounce',     label: 'Happy' },
  SAD:        { id: 'sad',        animation: 'droop',      label: 'Sad' },
  EXCITED:    { id: 'excited',    animation: 'burst',      label: 'Excited' },
  PROCESSING: { id: 'processing', animation: 'ring_spin',  label: 'Processing' },
  ERROR:      { id: 'error',      animation: 'shake',      label: 'Error' },
  CREATIVE:   { id: 'creative',   animation: 'sparkle',    label: 'Creative' },
};

// ─── Theme presets ────────────────────────────────────────────────────────────

export const THEMES = {
  DEFAULT: {
    id: 'default',
    primary: '#6C63FF',
    secondary: '#FF6584',
    background: '#1A1A2E',
    surface: '#16213E',
    text: '#EAEAEA',
    accent: '#0F3460',
    glow: '#6C63FF',
  },
  WARM: {
    id: 'warm',
    primary: '#FF7043',
    secondary: '#FFD600',
    background: '#1C1007',
    surface: '#2D1B0E',
    text: '#FFF8E1',
    accent: '#BF360C',
    glow: '#FF7043',
  },
  COOL: {
    id: 'cool',
    primary: '#26C6DA',
    secondary: '#5C6BC0',
    background: '#0D1117',
    surface: '#0A1929',
    text: '#E0F7FA',
    accent: '#006064',
    glow: '#26C6DA',
  },
  NATURE: {
    id: 'nature',
    primary: '#66BB6A',
    secondary: '#FFCA28',
    background: '#0A1F0A',
    surface: '#1B2E1B',
    text: '#F1F8E9',
    accent: '#1B5E20',
    glow: '#66BB6A',
  },
};

// ─── Creature companion mapping ───────────────────────────────────────────────
// Each agent can be embodied as a cute animal creature in the UI.

export const AGENT_CREATURES = {
  core:       { name: 'Phoenix',  emoji: '🔥', description: 'Spirit core — abstract flame' },
  alpha:      { name: 'Owl',      emoji: '🦉', description: 'Sees all — vision agent' },
  beta:       { name: 'Parrot',   emoji: '🦜', description: 'Voice agent — communicator' },
  gamma:      { name: 'Elephant', emoji: '🐘', description: 'Never forgets — memory agent' },
  delta:      { name: 'Fox',      emoji: '🦊', description: 'Empathic & perceptive' },
  creativity: { name: 'Octopus',  emoji: '🐙', description: 'Multi-armed creative thinker' },
  interface:  { name: 'Chameleon',emoji: '🦎', description: 'Adapts to any UI state' },
};

// ─── Agent ────────────────────────────────────────────────────────────────────

export class InterfaceAgent {
  constructor(config = {}) {
    this.currentAvatarState = AVATAR_STATES.IDLE;
    this.currentTheme = THEMES[config.theme?.toUpperCase()] ?? THEMES.DEFAULT;
    this.glowColor = this.currentTheme.glow;
    this.activeCreatures = new Set(['core']); // which creatures are visible

    // External state setter — inject a React setState or Zustand setter
    this._onStateChange = config.onStateChange ?? null;
    this._onThemeChange = config.onThemeChange ?? null;
    this._onNotification = config.onNotification ?? null;

    // Animated values (React Native)
    this.glowAnim = new Animated.Value(0.6);
    this.scaleAnim = new Animated.Value(1.0);
    this._currentAnimation = null;
  }

  // ─── Avatar control ───────────────────────────────────────────────────────────

  setAvatarState(stateId, options = {}) {
    const state = AVATAR_STATES[stateId.toUpperCase()] ?? AVATAR_STATES.IDLE;
    this.currentAvatarState = state;

    this._triggerAnimation(state.animation, options);
    this._emit({ type: 'avatar', state });
    return state;
  }

  /** Map ecosystem event names to avatar states. */
  onEcosystemEvent(event) {
    const map = {
      'listening:start':   'LISTENING',
      'listening:stop':    'IDLE',
      'core:thinking':     'THINKING',
      'beta:speaking':     'SPEAKING',
      'beta:done':         'IDLE',
      'creativity:start':  'CREATIVE',
      'error':             'ERROR',
    };

    const stateId = map[event];
    if (stateId) this.setAvatarState(stateId);
  }

  /** Update avatar from emotion analysis result. */
  applyEmotion(emotionResult) {
    const { emotion, avatarHint } = emotionResult;
    if (!avatarHint) return;

    this.glowColor = avatarHint.glowColor;
    this._emit({ type: 'glow', color: avatarHint.glowColor });
    this._emit({ type: 'expression', expression: avatarHint.expression });

    // Map emotion to avatar state
    const emotionToState = {
      happy:    'HAPPY',
      sad:      'SAD',
      excited:  'EXCITED',
      anxious:  'THINKING',
      angry:    'ERROR',
      default:  'IDLE',
    };

    const state = emotionToState[emotion.id] ?? emotionToState.default;
    this.setAvatarState(state);
  }

  // ─── Theme control ────────────────────────────────────────────────────────────

  setTheme(themeId) {
    const theme = THEMES[themeId.toUpperCase()] ?? THEMES.DEFAULT;
    this.currentTheme = theme;
    this.glowColor = theme.glow;

    if (this._onThemeChange) this._onThemeChange(theme);
    this._emit({ type: 'theme', theme });
    return theme;
  }

  /** Temporarily flash an accent color then revert. */
  flashColor(color, durationMs = 800) {
    this._emit({ type: 'flash', color, duration: durationMs });
    setTimeout(() => this._emit({ type: 'flash', color: this.currentTheme.glow, duration: 300 }), durationMs);
  }

  // ─── Creature control ─────────────────────────────────────────────────────────

  activateCreature(agentId) {
    this.activeCreatures.add(agentId);
    this._emit({ type: 'creature', action: 'activate', agentId, creature: AGENT_CREATURES[agentId] });
  }

  deactivateCreature(agentId) {
    if (agentId === 'core') return; // Core spirit always visible
    this.activeCreatures.delete(agentId);
    this._emit({ type: 'creature', action: 'deactivate', agentId });
  }

  animateCreature(agentId, animation = 'bounce') {
    const creature = AGENT_CREATURES[agentId];
    if (!creature) return;
    this._emit({ type: 'creature', action: 'animate', agentId, animation, creature });
  }

  getActiveCreatures() {
    return [...this.activeCreatures].map(id => ({
      agentId: id,
      ...AGENT_CREATURES[id],
    }));
  }

  // ─── Notifications ─────────────────────────────────────────────────────────────

  notify(message, type = 'info', options = {}) {
    if (this._onNotification) {
      this._onNotification({ message, type, ...options });
    }

    if (options.vibrate && Platform.OS !== 'web') {
      Vibration.vibrate(type === 'error' ? [0, 100, 50, 100] : 50);
    }
  }

  // ─── Bandwidth tier UI indicator ──────────────────────────────────────────────

  showBandwidthTier(tierLabel) {
    this._emit({ type: 'bandwidth', tier: tierLabel });
  }

  // ─── React Native animations ──────────────────────────────────────────────────

  startGlowAnimation() {
    if (this._currentAnimation) this._currentAnimation.stop();

    this._currentAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(this.glowAnim, { toValue: 1.0, duration: 1200, useNativeDriver: true }),
        Animated.timing(this.glowAnim, { toValue: 0.4, duration: 1200, useNativeDriver: true }),
      ])
    );
    this._currentAnimation.start();
  }

  stopGlowAnimation() {
    if (this._currentAnimation) {
      this._currentAnimation.stop();
      this._currentAnimation = null;
    }
    Animated.timing(this.glowAnim, { toValue: 0.6, duration: 400, useNativeDriver: true }).start();
  }

  pulseOnce() {
    Animated.sequence([
      Animated.timing(this.scaleAnim, { toValue: 1.15, duration: 150, useNativeDriver: true }),
      Animated.timing(this.scaleAnim, { toValue: 1.0,  duration: 150, useNativeDriver: true }),
    ]).start();
  }

  // ─── Private ─────────────────────────────────────────────────────────────────

  _triggerAnimation(animationName, options = {}) {
    // Translate animation name to RN Animated sequence
    switch (animationName) {
      case 'pulse':
        this.startGlowAnimation();
        break;
      case 'bounce':
        this.pulseOnce();
        break;
      case 'breathe':
        this.stopGlowAnimation();
        break;
      default:
        this.pulseOnce();
    }
  }

  _emit(payload) {
    if (this._onStateChange) {
      this._onStateChange(payload);
    }
  }
}
