// agents/BetaAgent.js
// Communication agent — on-device STT + TTS. Zero API cost.
//
// STT: react-native-executorch Whisper (tiny.en, ~39MB, runs offline)
//      Falls back to expo-speech-recognition if executorch not available.
// TTS: expo-speech (system voices, entirely free, works offline)

import * as Speech from 'expo-speech';

// Try to import react-native-executorch Whisper — optional dependency
let useWhisper = null;
let WHISPER_TINY = null;
try {
  const executorch = require('react-native-executorch');
  useWhisper = executorch.useWhisper;
  WHISPER_TINY = executorch.WHISPER_TINY_EN;
} catch (_) {
  // react-native-executorch not installed — will use expo-speech-recognition fallback
}

// Fallback STT
let ExpoSpeechRecognition = null;
let addSpeechRecognitionListener = null;
try {
  const eSR = require('expo-speech-recognition');
  ExpoSpeechRecognition = eSR.ExpoSpeechRecognitionModule;
  addSpeechRecognitionListener = eSR.addSpeechRecognitionListener;
} catch (_) {}

export class BetaAgent {
  constructor(config = {}) {
    this.language  = config.language ?? 'en-US';
    this.pitch     = config.pitch    ?? 1.0;
    this.rate      = config.rate     ?? 0.95;
    this.voice     = config.voice    ?? null;
    this.isSpeaking = false;
    this._recognitionListeners = [];
    this._sttMode = useWhisper ? 'executorch' : (ExpoSpeechRecognition ? 'expo' : 'none');
    console.log(`[BetaAgent] STT mode: ${this._sttMode}`);
  }

  // ─── TTS (expo-speech — free, offline, no API) ────────────────────────────

  async speak(text, options = {}) {
    if (!text?.trim()) return;
    await this.stop();

    const clean = this._cleanForSpeech(text);
    return new Promise((resolve, reject) => {
      this.isSpeaking = true;
      Speech.speak(clean, {
        language: this.language,
        pitch:    options.pitch ?? this.pitch,
        rate:     options.rate  ?? this.rate,
        voice:    options.voice ?? this.voice ?? undefined,
        onDone:    () => { this.isSpeaking = false; resolve(); },
        onStopped: () => { this.isSpeaking = false; resolve(); },
        onError:   (err) => { this.isSpeaking = false; reject(err); },
      });
    });
  }

  async speakInChunks(text, options = {}) {
    const chunks = this._chunkText(this._cleanForSpeech(text));
    for (let i = 0; i < chunks.length; i++) {
      if (!this.isSpeaking && i > 0) break;
      await this.speak(chunks[i], { ...options, _chunk: true });
      if (i < chunks.length - 1) await this._pause(180);
    }
  }

  async stop()   { try { await Speech.stop();   } catch(_) {} this.isSpeaking = false; }
  async pause()  { try { await Speech.pause();  } catch(_) {} }
  async resume() { try { await Speech.resume(); } catch(_) {} }

  async getAvailableVoices() { return Speech.getAvailableVoicesAsync(); }

  // ─── STT ─────────────────────────────────────────────────────────────────────

  /**
   * Start listening. Returns { stop, abort } controller.
   * Calls onResult(transcript, isFinal) and onError(error).
   *
   * Uses Whisper via react-native-executorch if available,
   * otherwise falls back to expo-speech-recognition.
   */
  async startListening({ onResult, onError, onEnd } = {}) {
    if (this._sttMode === 'executorch') {
      return this._startWhisper(onResult, onError, onEnd);
    } else if (this._sttMode === 'expo') {
      return this._startExpoSpeech(onResult, onError, onEnd);
    } else {
      throw new Error('[BetaAgent] No STT module available. Install react-native-executorch or expo-speech-recognition.');
    }
  }

  async stopListening() {
    if (this._sttMode === 'expo') {
      try { await ExpoSpeechRecognition?.stop(); } catch (_) {}
      this._cleanupListeners();
    }
    // Whisper is managed by the hook — stopping is handled by the component
  }

  /**
   * Returns a React hook ref for use in components when using executorch Whisper.
   * Usage in component: const whisperRef = betaAgent.getWhisperHookConfig();
   */
  getWhisperHookConfig() {
    if (!useWhisper || !WHISPER_TINY) return null;
    return {
      hookFn: useWhisper,
      modelSource: WHISPER_TINY,  // ~39MB, downloaded once
    };
  }

  // ─── Private STT implementations ─────────────────────────────────────────────

  // react-native-executorch Whisper — best quality, fully on-device
  // NOTE: useWhisper is a React Hook — it must be called from a component.
  // This method returns config for use in a component. See WhisperComponent example.
  async _startWhisper(onResult, onError, onEnd) {
    // Whisper is hook-based — we provide a recording wrapper instead
    // The component should use useWhisper(WHISPER_TINY_EN) directly.
    // Here we give a fallback voice trigger instruction.
    console.log('[BetaAgent] Whisper is hook-based — use WhisperButton component for STT.');
    if (onError) onError('use-whisper-hook-in-component');
    return { stop: () => {}, abort: () => {} };
  }

  // expo-speech-recognition fallback — uses device ASR (Google/Apple)
  async _startExpoSpeech(onResult, onError, onEnd) {
    const { granted } = await ExpoSpeechRecognition.requestPermissionsAsync();
    if (!granted) throw new Error('[BetaAgent] Microphone permission denied.');

    this._cleanupListeners();

    const rl = addSpeechRecognitionListener('result', (e) => {
      const transcript = e.results?.[0]?.transcript ?? '';
      if (onResult) onResult(transcript, e.isFinal ?? false);
    });
    const el = addSpeechRecognitionListener('error', (e) => {
      if (onError) onError(e.error);
    });
    const endL = addSpeechRecognitionListener('end', () => {
      if (onEnd) onEnd();
    });
    this._recognitionListeners = [rl, el, endL];

    await ExpoSpeechRecognition.start({ lang: this.language, interimResults: true, maxAlternatives: 1, continuous: false });
    return { stop: () => this.stopListening(), abort: () => ExpoSpeechRecognition.abort?.() };
  }

  _cleanupListeners() {
    this._recognitionListeners.forEach(l => l?.remove?.());
    this._recognitionListeners = [];
  }

  // ─── Text helpers ─────────────────────────────────────────────────────────────

  _cleanForSpeech(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`{1,3}([\s\S]*?)`{1,3}/g, '$1')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .replace(/\n{2,}/g, '. ')
      .replace(/\n/g, ' ')
      .trim();
  }

  _chunkText(text, maxLen = 160) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [text];
    const chunks = [];
    let current = '';
    for (const s of sentences) {
      if ((current + s).length > maxLen && current) { chunks.push(current.trim()); current = s; }
      else current += ' ' + s;
    }
    if (current.trim()) chunks.push(current.trim());
    return chunks;
  }

  _pause(ms) { return new Promise(r => setTimeout(r, ms)); }
}

// ─── WhisperButton — React component for on-device Whisper STT ───────────────
// Use this in your UI for voice input when react-native-executorch is installed.
//
// import { WhisperButton } from './agents/BetaAgent';
//
// <WhisperButton onTranscript={(text) => handleInput(text)} />

export function WhisperButton({ onTranscript, style }) {
  if (!useWhisper || !WHISPER_TINY) {
    // Executorch not available — render nothing (BetaAgent handles expo fallback)
    return null;
  }

  // This is rendered in a component so hooks are allowed here
  const { React } = require('react');
  const { TouchableOpacity, Text } = require('react-native');

  const whisper = useWhisper({ model: WHISPER_TINY });

  const handlePress = async () => {
    if (whisper.isRecording) {
      await whisper.stopRecording();
      if (whisper.transcript && onTranscript) {
        onTranscript(whisper.transcript);
      }
    } else {
      await whisper.startRecording();
    }
  };

  return React.createElement(
    TouchableOpacity,
    { onPress: handlePress, style: style },
    React.createElement(Text, null, whisper.isRecording ? '⏹ Stop' : '🎙 Speak')
  );
}
