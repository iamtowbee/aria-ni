/**
 * AttentionMap — Live attention heatmap component for React Native / Expo
 *
 * Renders:
 *  - Token strip with importance-scaled opacity/size
 *  - Attention heatmap grid (seqLen × seqLen)
 *  - Confidence meter
 *  - Per-token entropy bars
 *  - Uncertain tokens highlighted
 *  - Real-time self-state panel
 */

import React, { useEffect, useRef, useMemo } from 'react';
import {
  View, Text, ScrollView, Animated, StyleSheet, Pressable,
} from 'react-native';

// ── Color utils ───────────────────────────────────────────────────────────────

function lerpColor(a, b, t) {
  const r = (c) => parseInt(c.slice(1, 3), 16);
  const g = (c) => parseInt(c.slice(3, 5), 16);
  const bl = (c) => parseInt(c.slice(5, 7), 16);
  const lerp = (x, y) => Math.round(x + (y - x) * t);
  return `rgb(${lerp(r(a), r(b), t)},${lerp(g(a), g(b), t)},${lerp(bl(a), bl(b), t)})`;
}

function attentionColor(weight) {
  // 0 = dark navy, 0.5 = blue, 1 = bright cyan
  if (weight < 0.5) return lerpColor('#0c1628', '#1a5fdb', weight * 2);
  return lerpColor('#1a5fdb', '#34d8f0', (weight - 0.5) * 2);
}

function importanceColor(imp) {
  if (imp < 0.33) return '#2a3a50';
  if (imp < 0.66) return '#4A9EFF';
  return '#34d8f0';
}

function confidenceColor(conf) {
  if (conf < 0.35) return '#f06882';
  if (conf < 0.65) return '#f0b430';
  return '#2dd4a0';
}

// ── Confidence Meter ──────────────────────────────────────────────────────────

export function ConfidenceMeter({ confidence = 0, label = 'Confidence' }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, { toValue: confidence, useNativeDriver: false, tension: 40, friction: 8 }).start();
  }, [confidence]);

  const width = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const color = confidenceColor(confidence);

  return (
    <View style={styles.meterWrap}>
      <View style={styles.meterRow}>
        <Text style={styles.meterLabel}>{label}</Text>
        <Text style={[styles.meterVal, { color }]}>{Math.round(confidence * 100)}%</Text>
      </View>
      <View style={styles.meterTrack}>
        <Animated.View style={[styles.meterFill, { width, backgroundColor: color }]} />
      </View>
    </View>
  );
}

// ── Token Strip ────────────────────────────────────────────────────────────────

export function TokenStrip({ tokens = [], importance = [], uncertain = [], onPress }) {
  return (
    <View style={styles.tokenStrip}>
      {tokens.map((tok, i) => {
        const imp     = importance[i] ?? 0;
        const isUncertain = uncertain.includes(tok);
        const bg      = importanceColor(imp);
        const opacity = 0.35 + imp * 0.65;
        const scale   = 0.85 + imp * 0.3;

        return (
          <Pressable key={i} onPress={() => onPress?.(i, tok, imp)}>
            <View style={[
              styles.tokenChip,
              { backgroundColor: bg, opacity },
              isUncertain && styles.tokenUncertain,
            ]}>
              <Text style={[styles.tokenText, { transform: [{ scale }] }]}>
                {tok === ' ' ? '·' : tok}
              </Text>
              <View style={[styles.tokenImpBar, { height: Math.max(2, imp * 8) }]} />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

// ── Heatmap Grid ──────────────────────────────────────────────────────────────

export function AttentionHeatmap({ matrix = [], tokens = [], maxSize = 16 }) {
  // Clip to maxSize × maxSize for display
  const size = Math.min(matrix.length, maxSize);
  const cells = useMemo(() => {
    const rows = [];
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        rows.push({ i, j, w: matrix[i]?.[j] ?? 0 });
      }
    }
    return rows;
  }, [matrix, size]);

  const cellSize = Math.min(22, Math.floor(240 / size));

  return (
    <View>
      <Text style={styles.sectionLabel}>ATTENTION MATRIX</Text>
      <View style={[styles.heatmapGrid, { width: cellSize * size + 2, height: cellSize * size + 2 }]}>
        {cells.map(({ i, j, w }) => (
          <View
            key={`${i}-${j}`}
            style={{
              position: 'absolute',
              left:  j * cellSize,
              top:   i * cellSize,
              width:  cellSize - 1,
              height: cellSize - 1,
              backgroundColor: attentionColor(w),
              borderRadius: 2,
            }}
          />
        ))}
      </View>
      {/* Axis labels */}
      <View style={styles.heatmapAxisRow}>
        {tokens.slice(0, size).map((t, i) => (
          <Text key={i} style={[styles.heatmapAxisLabel, { width: cellSize }]} numberOfLines={1}>
            {(t === ' ' ? '·' : t).slice(0, 2)}
          </Text>
        ))}
      </View>
    </View>
  );
}

// ── Entropy Bars ──────────────────────────────────────────────────────────────

export function EntropyBars({ entropy = [], tokens = [] }) {
  const maxE = Math.max(...entropy, 1);
  return (
    <View>
      <Text style={styles.sectionLabel}>TOKEN ENTROPY</Text>
      <View style={styles.entropyRow}>
        {entropy.slice(0, 12).map((e, i) => {
          const ratio = e / maxE;
          const color = ratio > 0.7 ? '#f06882' : ratio > 0.4 ? '#f0b430' : '#2dd4a0';
          return (
            <View key={i} style={styles.entropyItem}>
              <View style={[styles.entropyBar, { height: Math.max(4, ratio * 36), backgroundColor: color }]} />
              <Text style={styles.entropyLabel} numberOfLines={1}>
                {(tokens[i] === ' ' ? '·' : tokens[i] ?? '?').slice(0, 2)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ── Self-State Panel ──────────────────────────────────────────────────────────

export function SelfStatePanel({ selfState, stats }) {
  if (!selfState) return null;
  const conf = selfState.confidence ?? 0;
  const cur  = selfState.curiosity  ?? 0;
  const lr   = selfState.learningRate ?? 0.001;

  return (
    <View style={styles.selfStatePanel}>
      <Text style={styles.selfStateTitle}>SELF-AWARENESS</Text>
      <View style={styles.selfStateGrid}>
        <StateMetric label="Confidence"   value={Math.round(conf * 100) + '%'} color={confidenceColor(conf)} />
        <StateMetric label="Curiosity"    value={Math.round(cur * 100) + '%'}  color="#9b8cff" />
        <StateMetric label="LR"           value={lr.toExponential(1)}           color="#4A9EFF" />
        <StateMetric label="Turns"        value={stats?.turnCount ?? 0}         color="#f0b430" />
        <StateMetric label="Vocab"        value={stats?.tokenizer?.vocabSize ?? 0} color="#2dd4a0" />
        <StateMetric label="Experiences"  value={selfState.totalExperiences ?? 0} color="#d472f4" />
      </View>
      {selfState.uncertainTopics?.length > 0 && (
        <View style={styles.topicsRow}>
          <Text style={styles.topicsLabel}>UNCERTAIN:</Text>
          {selfState.uncertainTopics.slice(0, 4).map((t, i) => (
            <View key={i} style={[styles.topicChip, styles.topicUncertain]}>
              <Text style={styles.topicText}>{t}</Text>
            </View>
          ))}
        </View>
      )}
      {selfState.strongTopics?.length > 0 && (
        <View style={styles.topicsRow}>
          <Text style={styles.topicsLabel}>STRONG:</Text>
          {selfState.strongTopics.slice(0, 4).map((t, i) => (
            <View key={i} style={[styles.topicChip, styles.topicStrong]}>
              <Text style={styles.topicText}>{t}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function StateMetric({ label, value, color }) {
  return (
    <View style={styles.stateMetric}>
      <Text style={[styles.stateMetricVal, { color }]}>{value}</Text>
      <Text style={styles.stateMetricLabel}>{label}</Text>
    </View>
  );
}

// ── Learn Log ─────────────────────────────────────────────────────────────────

export function LearnLog({ log = [] }) {
  if (!log.length) return null;
  return (
    <View style={styles.learnLogWrap}>
      <Text style={styles.sectionLabel}>LEARNING LOG</Text>
      {log.slice(0, 6).map((step, i) => {
        const rew = step.reward ?? 0;
        const conf = step.confidence ?? 0;
        return (
          <View key={i} style={styles.logRow}>
            <Text style={styles.logTurn}>T{step.turn}</Text>
            <View style={styles.logBars}>
              <View style={[styles.logBar, { width: `${Math.round(rew * 100)}%`, backgroundColor: '#4A9EFF' }]} />
            </View>
            <Text style={[styles.logConf, { color: confidenceColor(conf) }]}>
              {Math.round(conf * 100)}%
            </Text>
            {step.uncertain?.length > 0 && (
              <Text style={styles.logUncertain}>?{step.uncertain.slice(0, 2).join(',')}</Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

// ── Full Attention Overlay ────────────────────────────────────────────────────

export function AttentionOverlay({ viz, stats, selfState, learnLog, onClose }) {
  if (!viz) return null;
  return (
    <View style={styles.overlay}>
      <View style={styles.overlayHeader}>
        <Text style={styles.overlayTitle}>ATTENTION INTROSPECTION</Text>
        <Pressable onPress={onClose}>
          <Text style={styles.closeBtn}>✕</Text>
        </Pressable>
      </View>
      <ScrollView style={styles.overlayScroll} showsVerticalScrollIndicator={false}>
        <ConfidenceMeter confidence={viz.confidence} label="Forward Pass Confidence" />

        <Text style={styles.sectionLabel}>TOKEN IMPORTANCE</Text>
        <TokenStrip tokens={viz.tokens} importance={viz.importance} uncertain={viz.uncertain} />

        <AttentionHeatmap matrix={viz.heatmap} tokens={viz.tokens} />
        <EntropyBars entropy={viz.entropy} tokens={viz.tokens} />
        <SelfStatePanel selfState={selfState ?? viz.selfState} stats={stats} />
        <LearnLog log={learnLog} />

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Meter
  meterWrap:    { marginBottom: 10 },
  meterRow:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  meterLabel:   { fontFamily: 'monospace', fontSize: 9, color: '#3a5470', letterSpacing: 1.5, textTransform: 'uppercase' },
  meterVal:     { fontFamily: 'monospace', fontSize: 10, fontWeight: '600' },
  meterTrack:   { height: 3, backgroundColor: '#0c1628', borderRadius: 2, overflow: 'hidden' },
  meterFill:    { height: '100%', borderRadius: 2 },

  // Token strip
  tokenStrip:   { flexDirection: 'row', flexWrap: 'wrap', gap: 3, marginBottom: 12 },
  tokenChip:    { paddingHorizontal: 5, paddingVertical: 3, borderRadius: 4, alignItems: 'center', minWidth: 18 },
  tokenUncertain: { borderWidth: 1, borderColor: '#f06882' },
  tokenText:    { fontFamily: 'monospace', fontSize: 9, color: '#fff' },
  tokenImpBar:  { width: '100%', backgroundColor: '#4A9EFF', borderRadius: 1, marginTop: 2 },

  // Heatmap
  heatmapGrid:  { position: 'relative', marginBottom: 4, marginTop: 4 },
  heatmapAxisRow: { flexDirection: 'row' },
  heatmapAxisLabel: { fontFamily: 'monospace', fontSize: 7, color: '#3a5470', textAlign: 'center' },

  // Entropy
  entropyRow:   { flexDirection: 'row', alignItems: 'flex-end', gap: 3, marginBottom: 12, height: 52 },
  entropyItem:  { alignItems: 'center', width: 18 },
  entropyBar:   { width: 10, borderRadius: 2 },
  entropyLabel: { fontFamily: 'monospace', fontSize: 7, color: '#3a5470', marginTop: 2, width: 18, textAlign: 'center' },

  // Self-state
  selfStatePanel: { backgroundColor: '#080f1e', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#0c2040' },
  selfStateTitle: { fontFamily: 'monospace', fontSize: 8, color: '#4A9EFF', letterSpacing: 2, marginBottom: 10, textTransform: 'uppercase' },
  selfStateGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  stateMetric:    { width: '30%', alignItems: 'center', backgroundColor: '#0c1628', borderRadius: 8, paddingVertical: 8 },
  stateMetricVal: { fontFamily: 'monospace', fontSize: 13, fontWeight: '700' },
  stateMetricLabel: { fontFamily: 'monospace', fontSize: 7, color: '#3a5470', marginTop: 2, textTransform: 'uppercase' },
  topicsRow:    { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 5, marginTop: 8 },
  topicsLabel:  { fontFamily: 'monospace', fontSize: 7, color: '#3a5470', letterSpacing: 1 },
  topicChip:    { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 100 },
  topicUncertain: { backgroundColor: 'rgba(240,104,130,0.12)', borderWidth: 1, borderColor: 'rgba(240,104,130,0.3)' },
  topicStrong:    { backgroundColor: 'rgba(45,212,160,0.1)',   borderWidth: 1, borderColor: 'rgba(45,212,160,0.3)' },
  topicText:    { fontFamily: 'monospace', fontSize: 8, color: '#d8eafc' },

  // Learn log
  learnLogWrap: { marginBottom: 12 },
  logRow:       { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  logTurn:      { fontFamily: 'monospace', fontSize: 8, color: '#3a5470', width: 24 },
  logBars:      { flex: 1, height: 4, backgroundColor: '#0c1628', borderRadius: 2, overflow: 'hidden' },
  logBar:       { height: '100%', borderRadius: 2 },
  logConf:      { fontFamily: 'monospace', fontSize: 8, width: 30, textAlign: 'right' },
  logUncertain: { fontFamily: 'monospace', fontSize: 7, color: '#f06882', maxWidth: 60 },

  // Section label
  sectionLabel: { fontFamily: 'monospace', fontSize: 8, color: '#3a5470', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6, marginTop: 10 },

  // Overlay
  overlay:       { flex: 1, backgroundColor: '#040810' },
  overlayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#0c2040' },
  overlayTitle:  { fontFamily: 'monospace', fontSize: 10, color: '#4A9EFF', letterSpacing: 2 },
  closeBtn:      { fontSize: 16, color: '#3a5470', padding: 4 },
  overlayScroll: { flex: 1, padding: 16 },
});

export default AttentionOverlay;
