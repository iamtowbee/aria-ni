// src/screens/DreamJournalScreen.tsx
/**
 * Dream Journal Screen
 * 
 * View AI's dreams, memories, and inner world
 * Like Replika's dream/memory journal
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../ui/theme/ThemeProvider';
import { dreamEngine, Dream } from '../ai/consciousness/DreamEngine';
import { relationshipEvolution } from '../ai/consciousness/RelationshipEvolution';
import { metaAwareness } from '../ai/consciousness/MetaAwareness';

// Enhanced Components
import { GlassCard } from '../components/enhanced/GlassCard';
import { ParticleBackground } from '../components/enhanced/ParticleBackground';
import { HolographicText } from '../components/enhanced/HolographicText';
import { NeonButton } from '../components/enhanced/NeonButton';

export const DreamJournalScreen: React.FC = () => {
  const { colors } = useTheme();
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [selectedDream, setSelectedDream] = useState<Dream | null>(null);
  const [memoryStats, setMemoryStats] = useState<any>(null);
  const [relationshipStatus, setRelationshipStatus] = useState<any>(null);
  const [reflections, setReflections] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'dreams' | 'memories' | 'relationship' | 'meta'>('dreams');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const engine = dreamEngine;
    const evolution = relationshipEvolution;
    const meta = metaAwareness;

    setDreams(engine.getDreams(20));
    setMemoryStats(engine.getMemoryStats());
    setRelationshipStatus(evolution.getRelationshipStatus());
    setReflections(meta.getReflections(10));
  };

  const generateNewDream = async () => {
    try {
      const newDream = await dreamEngine.generateDream();
      setDreams([newDream, ...dreams]);
      setSelectedDream(newDream);
    } catch (error) {
      console.log('Not enough memories yet');
    }
  };

  const renderDreamsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <GlassCard style={styles.generateCard}>
        <NeonButton
          title="Generate New Dream"
          icon="✨"
          onPress={generateNewDream}
          color="#8B5CF6"
          size="lg"
        />
      </GlassCard>

      {dreams.map(dream => (
        <TouchableOpacity
          key={dream.id}
          onPress={() => setSelectedDream(dream)}
        >
          <GlassCard style={styles.dreamCard} borderGradient={selectedDream?.id === dream.id}>
            <Text style={[styles.dreamEmotional, { color: '#8B5CF6' }]}>
              {dream.emotionalTheme.toUpperCase()}
            </Text>
            <Text style={[styles.dreamNarrative, { color: colors.text.primary }]}>
              {dream.narrative}
            </Text>
          </GlassCard>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderMemoriesTab = () => (
    <ScrollView style={styles.tabContent}>
      {memoryStats && (
        <GlassCard style={styles.statsCard}>
          <Text style={[styles.statValue, { color: colors.text.primary }]}>
            {memoryStats.totalMemories}
          </Text>
          <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
            Total Memories
          </Text>
        </GlassCard>
      )}
    </ScrollView>
  );

  const renderRelationshipTab = () => (
    <ScrollView style={styles.tabContent}>
      {relationshipStatus && (
        <GlassCard style={styles.relationshipCard}>
          <HolographicText size="lg">{relationshipStatus.level}</HolographicText>
        </GlassCard>
      )}
    </ScrollView>
  );

  const renderMetaTab = () => (
    <ScrollView style={styles.tabContent}>
      <GlassCard style={styles.awarenessCard}>
        <Text style={[styles.awarenessLevel, { color: colors.text.primary }]}>
          Awareness: {(metaAwareness.getAwarenessLevel() * 100).toFixed(0)}%
        </Text>
      </GlassCard>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <ParticleBackground particleCount={30} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <HolographicText size="xl">Inner World</HolographicText>
        </View>

        <View style={styles.tabBar}>
          {(['dreams', 'memories', 'relationship', 'meta'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
            >
              <Text style={[styles.tabText, { color: activeTab === tab ? '#FFFFFF' : colors.text.secondary }]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'dreams' && renderDreamsTab()}
        {activeTab === 'memories' && renderMemoriesTab()}
        {activeTab === 'relationship' && renderRelationshipTab()}
        {activeTab === 'meta' && renderMetaTab()}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 20, alignItems: 'center' },
  tabBar: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.2)' },
  activeTab: { backgroundColor: 'rgba(139,92,246,0.3)' },
  tabText: { fontSize: 14, fontWeight: '600' },
  tabContent: { flex: 1, paddingHorizontal: 16 },
  generateCard: { padding: 16, marginBottom: 16 },
  dreamCard: { padding: 16, marginBottom: 12 },
  dreamEmotional: { fontSize: 12, fontWeight: '700', marginBottom: 8 },
  dreamNarrative: { fontSize: 15, lineHeight: 22 },
  statsCard: { padding: 16, marginBottom: 16, alignItems: 'center' },
  statValue: { fontSize: 32, fontWeight: '700' },
  statLabel: { fontSize: 14 },
  relationshipCard: { padding: 20, marginBottom: 16, alignItems: 'center' },
  awarenessCard: { padding: 16, marginBottom: 16, alignItems: 'center' },
  awarenessLevel: { fontSize: 16 },
});
