import { useState, useRef, useCallback, useEffect } from "react";

/**
 * useVoiceOrb — Complete audio pipeline hook for VoiceOrb.
 *
 * Returns:
 *  {
 *    state,           // "idle" | "listening" | "thinking" | "speaking"
 *    setState,
 *    audioStream,     // MediaStream for VoiceOrb
 *    audioData,       // Float32Array of normalized freq bins
 *    amplitude,       // 0–1 current amplitude
 *    isRecording,
 *    startListening,  // request mic + set state to "listening"
 *    stopListening,   // stop mic
 *    setThinking,     // switch to thinking state
 *    setSpeaking,     // switch to speaking state + optional TTS stream
 *    connectStream,   // manually inject a MediaStream
 *    error,
 *  }
 */
export function useVoiceOrb(options = {}) {
  const {
    fftSize = 512,
    smoothing = 0.85,
    silenceThreshold = 0.02,
    silenceTimeout = 1500,
  } = options;

  const [state, setState] = useState("idle");
  const [audioStream, setAudioStream] = useState(null);
  const [audioData, setAudioData] = useState(null);
  const [amplitude, setAmplitude] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);

  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopAnalysis();
    };
  }, []);

  const stopAnalysis = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (sourceRef.current) {
      try { sourceRef.current.disconnect(); } catch(_) {}
      sourceRef.current = null;
    }
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch(_) {}
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setAudioStream(null);
    setIsRecording(false);
    stopAnalysis();
  }, [stopAnalysis]);

  const startAnalysisLoop = useCallback((stream) => {
    stopAnalysis();

    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    audioCtxRef.current = ctx;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = fftSize;
    analyser.smoothingTimeConstant = smoothing;
    analyserRef.current = analyser;

    const source = ctx.createMediaStreamSource(stream);
    source.connect(analyser);
    sourceRef.current = source;

    const bufLen = analyser.frequencyBinCount;
    const freqBuf = new Float32Array(bufLen);
    const normBuf = new Float32Array(bufLen);

    function tick() {
      if (!mountedRef.current || !analyserRef.current) return;

      analyser.getFloatFrequencyData(freqBuf);

      let sum = 0;
      for (let i = 0; i < bufLen; i++) {
        normBuf[i] = Math.max(0, Math.min(1, (freqBuf[i] + 100) / 100));
        sum += normBuf[i];
      }
      const amp = sum / bufLen;

      setAmplitude(amp);
      setAudioData(new Float32Array(normBuf));

      // Silence detection
      if (amp < silenceThreshold) {
        if (!silenceTimerRef.current) {
          silenceTimerRef.current = setTimeout(() => {
            if (mountedRef.current) setAmplitude(0);
            silenceTimerRef.current = null;
          }, silenceTimeout);
        }
      } else {
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [fftSize, smoothing, silenceThreshold, silenceTimeout, stopAnalysis]);

  const startListening = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;
      setAudioStream(stream);
      setIsRecording(true);
      setState("listening");
      startAnalysisLoop(stream);
    } catch(err) {
      setError(err.message || "Microphone access denied");
      setState("idle");
    }
  }, [startAnalysisLoop]);

  const stopListening = useCallback(() => {
    stopStream();
    setState("idle");
  }, [stopStream]);

  const setThinking = useCallback(() => {
    setState("thinking");
  }, []);

  const setSpeaking = useCallback((stream = null) => {
    setState("speaking");
    if (stream) {
      streamRef.current = stream;
      setAudioStream(stream);
      startAnalysisLoop(stream);
    }
  }, [startAnalysisLoop]);

  const connectStream = useCallback((stream) => {
    if (streamRef.current) stopStream();
    streamRef.current = stream;
    setAudioStream(stream);
    startAnalysisLoop(stream);
  }, [stopStream, startAnalysisLoop]);

  return {
    state,
    setState,
    audioStream,
    audioData,
    amplitude,
    isRecording,
    startListening,
    stopListening,
    setThinking,
    setSpeaking,
    connectStream,
    error,
  };
}
