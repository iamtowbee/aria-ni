import { useRef, useEffect, useCallback, useState } from "react";

/**
 * VoiceOrb — A fluid, audio-reactive animated orb component.
 *
 * Props:
 *  - state: "idle" | "listening" | "thinking" | "speaking"
 *  - audioStream: MediaStream | null   (live mic/audio stream)
 *  - audioData: Float32Array | null    (manual frequency override, 0–1 range)
 *  - size: number                      (canvas size in px, default 300)
 *  - color: string                     (primary color, default "#4A9EFF")
 *  - accentColor: string               (accent color, default "#A78BFA")
 *  - glowColor: string                 (glow color, default "#60A5FA")
 *  - sensitivity: number               (0–1, default 0.8)
 *  - smoothing: number                 (0–1, FFT smoothing, default 0.85)
 *  - className: string
 *  - style: object
 */
export function VoiceOrb({
  state = "idle",
  audioStream = null,
  audioData = null,
  size = 300,
  color = "#4A9EFF",
  accentColor = "#A78BFA",
  glowColor = "#60A5FA",
  sensitivity = 0.8,
  smoothing = 0.85,
  className = "",
  style = {},
}) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const analyserRef = useRef(null);
  const audioCtxRef = useRef(null);
  const sourceRef = useRef(null);
  const freqDataRef = useRef(new Float32Array(256).fill(0));
  const timeRef = useRef(0);
  const stateRef = useRef(state);
  const ampRef = useRef(0);

  stateRef.current = state;

  // --- Audio Analysis Setup ---
  useEffect(() => {
    if (!audioStream) {
      if (analyserRef.current) {
        analyserRef.current = null;
      }
      if (sourceRef.current) {
        try { sourceRef.current.disconnect(); } catch(_) {}
        sourceRef.current = null;
      }
      return;
    }

    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    audioCtxRef.current = ctx;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = smoothing;
    analyserRef.current = analyser;

    const source = ctx.createMediaStreamSource(audioStream);
    source.connect(analyser);
    sourceRef.current = source;

    return () => {
      try { source.disconnect(); } catch(_) {}
      try { ctx.close(); } catch(_) {}
      analyserRef.current = null;
      audioCtxRef.current = null;
      sourceRef.current = null;
    };
  }, [audioStream, smoothing]);

  // --- Canvas Draw Loop ---
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;

    // Gather frequency data
    if (analyserRef.current) {
      const buf = new Float32Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getFloatFrequencyData(buf);
      // Normalize -100dB..0dB → 0..1
      for (let i = 0; i < freqDataRef.current.length; i++) {
        freqDataRef.current[i] = Math.max(0, Math.min(1, (buf[i] + 100) / 100));
      }
    } else if (audioData) {
      for (let i = 0; i < freqDataRef.current.length; i++) {
        freqDataRef.current[i] = audioData[i] ?? 0;
      }
    }

    const freq = freqDataRef.current;

    // Compute amplitude bands
    const bassAmp  = avg(freq, 0, 8)   * sensitivity;
    const midAmp   = avg(freq, 8, 48)  * sensitivity;
    const highAmp  = avg(freq, 48, 128) * sensitivity;
    const totalAmp = (bassAmp * 0.6 + midAmp * 0.3 + highAmp * 0.1);

    // Smooth the amplitude
    ampRef.current += (totalAmp - ampRef.current) * 0.12;
    const amp = ampRef.current;

    timeRef.current += getSpeed(stateRef.current, amp);

    const t = timeRef.current;

    // Clear
    ctx.clearRect(0, 0, W, H);

    // State-specific params
    const params = getStateParams(stateRef.current, amp, t);

    // --- Outer glow ---
    const glowR = params.baseRadius * (1.6 + amp * 0.8);
    const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
    grd.addColorStop(0, hexAlpha(glowColor, 0.0));
    grd.addColorStop(0.4, hexAlpha(glowColor, params.glowAlpha * 0.35));
    grd.addColorStop(1, hexAlpha(glowColor, 0));
    ctx.beginPath();
    ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();

    // --- Blob layers (back to front) ---
    const layers = [
      { scale: 1.0,  alpha: 0.5,  colorA: accentColor, colorB: color,      phaseOffset: 0,         radiusMult: 1.00 },
      { scale: 0.88, alpha: 0.65, colorA: color,       colorB: accentColor, phaseOffset: Math.PI/3, radiusMult: 0.95 },
      { scale: 0.72, alpha: 0.8,  colorA: glowColor,   colorB: color,       phaseOffset: Math.PI/6, radiusMult: 0.85 },
      { scale: 0.52, alpha: 1.0,  colorA: "#ffffff",   colorB: glowColor,   phaseOffset: Math.PI/2, radiusMult: 0.70 },
    ];

    for (const layer of layers) {
      drawBlob(ctx, cx, cy, params, layer, t, amp, bassAmp, midAmp, highAmp);
    }

    // --- Inner core highlight ---
    const coreR = params.baseRadius * 0.22;
    const coreGrd = ctx.createRadialGradient(
      cx - coreR * 0.3, cy - coreR * 0.3, 0,
      cx, cy, coreR * 1.6
    );
    coreGrd.addColorStop(0, hexAlpha("#ffffff", 0.7 * params.coreAlpha));
    coreGrd.addColorStop(0.5, hexAlpha("#ffffff", 0.15 * params.coreAlpha));
    coreGrd.addColorStop(1, hexAlpha("#ffffff", 0));
    ctx.beginPath();
    ctx.arc(cx, cy, coreR * 1.6, 0, Math.PI * 2);
    ctx.fillStyle = coreGrd;
    ctx.fill();

    animFrameRef.current = requestAnimationFrame(draw);
  }, [color, accentColor, glowColor, sensitivity, audioData]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={className}
      style={{ display: "block", ...style }}
      aria-label={`Voice orb – ${state}`}
    />
  );
}

// ─── helpers ────────────────────────────────────────────────────────────────

function avg(arr, start, end) {
  let sum = 0;
  const n = end - start;
  for (let i = start; i < end; i++) sum += arr[i] || 0;
  return sum / n;
}

function hexAlpha(hex, alpha) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
}

function getSpeed(state, amp) {
  switch(state) {
    case "listening": return 0.022 + amp * 0.04;
    case "thinking":  return 0.038 + amp * 0.02;
    case "speaking":  return 0.028 + amp * 0.06;
    default:          return 0.008;
  }
}

function getStateParams(state, amp, t) {
  const pulse = Math.sin(t * 0.4) * 0.5 + 0.5;

  switch(state) {
    case "listening":
      return {
        baseRadius: 90 + amp * 30,
        wobbleAmp: 0.12 + amp * 0.22,
        wobbleFreq: 5,
        twist: 0.4 + amp,
        glowAlpha: 0.4 + amp * 0.6,
        coreAlpha: 0.8 + amp * 0.2,
        noiseAmp: 0.06 + amp * 0.12,
      };
    case "thinking":
      return {
        baseRadius: 80 + pulse * 12,
        wobbleAmp: 0.08 + pulse * 0.06,
        wobbleFreq: 6,
        twist: 1.2 + pulse * 0.6,
        glowAlpha: 0.3 + pulse * 0.3,
        coreAlpha: 0.6 + pulse * 0.3,
        noiseAmp: 0.04 + pulse * 0.04,
      };
    case "speaking":
      return {
        baseRadius: 88 + amp * 36,
        wobbleAmp: 0.15 + amp * 0.28,
        wobbleFreq: 7,
        twist: 0.6 + amp * 1.4,
        glowAlpha: 0.5 + amp * 0.5,
        coreAlpha: 0.9,
        noiseAmp: 0.08 + amp * 0.18,
      };
    default: // idle
      return {
        baseRadius: 72 + pulse * 6,
        wobbleAmp: 0.04 + pulse * 0.03,
        wobbleFreq: 4,
        twist: 0.2 + pulse * 0.1,
        glowAlpha: 0.12 + pulse * 0.1,
        coreAlpha: 0.5 + pulse * 0.2,
        noiseAmp: 0.015,
      };
  }
}

function drawBlob(ctx, cx, cy, params, layer, t, amp, bassAmp, midAmp, highAmp) {
  const { baseRadius, wobbleAmp, wobbleFreq, twist, noiseAmp } = params;
  const r = baseRadius * layer.radiusMult;
  const pts = 180;

  ctx.save();

  // Gradient fill
  const grd = ctx.createRadialGradient(
    cx - r * 0.25, cy - r * 0.25, r * 0.05,
    cx, cy, r * layer.scale * 1.4
  );
  grd.addColorStop(0, hexAlpha(layer.colorA, layer.alpha));
  grd.addColorStop(1, hexAlpha(layer.colorB, layer.alpha * 0.3));

  ctx.beginPath();
  for (let i = 0; i <= pts; i++) {
    const angle = (i / pts) * Math.PI * 2;
    const tOff = t * layer.scale;

    // Multi-octave organic deformation
    const w1 = Math.sin(angle * wobbleFreq + tOff + layer.phaseOffset) * wobbleAmp;
    const w2 = Math.sin(angle * (wobbleFreq + 2) + tOff * 1.3 + layer.phaseOffset * 1.5) * wobbleAmp * 0.6;
    const w3 = Math.sin(angle * 2 + tOff * 0.7) * noiseAmp;
    const w4 = Math.cos(angle * (wobbleFreq - 1) + tOff * 0.9) * noiseAmp * 0.5;

    // Bass-reactive deformation
    const bassWave = Math.sin(angle * 3 + tOff * 2) * bassAmp * 0.15;
    const midWave  = Math.sin(angle * 5 + tOff * 1.7) * midAmp * 0.08;

    // Twist / spiral
    const twistAngle = angle + twist * Math.sin(tOff * 0.2) * 0.1;
    const totalDeform = 1 + w1 + w2 + w3 + w4 + bassWave + midWave;
    const rad = r * layer.scale * totalDeform;

    const x = cx + Math.cos(twistAngle) * rad;
    const y = cy + Math.sin(twistAngle) * rad;

    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();

  ctx.fillStyle = grd;
  ctx.fill();

  ctx.restore();
}
