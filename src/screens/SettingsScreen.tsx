// src/screens/SettingsScreen.jsx
// Settings and configuration screen

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen({ ecosystem, onClose }) {
  const [status, setStatus] = useState(null);
  const [memoryStats, setMemoryStats] = useState(null);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const status = ecosystem.getStatus();
      setStatus(status);

      const stats = await ecosystem.getMemoryStats();
      setMemoryStats(stats);

      const savedAutoSpeak = await AsyncStorage.getItem('@auto_speak');
      setAutoSpeak(savedAutoSpeak === 'true');

      setLoading(false);
    } catch (err) {
      console.error('Load settings error:', err);
      setLoading(false);
    }
  }

  async function toggleAutoSpeak(value) {
    setAutoSpeak(value);
    ecosystem.config.autoSpeak = value;
    await AsyncStorage.setItem('@auto_speak', value.toString());
  }

  async function clearMemory() {
    Alert.alert(
      'Clear Memory',
      'Are you sure? This will delete all stored memories and conversation history.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await ecosystem.clearMemories();
            const stats = await ecosystem.getMemoryStats();
            setMemoryStats(stats);
            Alert.alert('Success', 'Memory cleared');
          },
        },
      ]
    );
  }

  async function exportMemory() {
    try {
      const filepath = await ecosystem.exportMemories();
      Alert.alert('Exported', `Memory exported to:\n${filepath}`);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>Done</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Model Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Model Information</Text>
          <InfoRow label="Model" value={status.model.name} />
          <InfoRow label="Size" value={status.model.size} />
          <InfoRow label="Quantization" value={status.model.quantization || 'Q4_0'} />
          <InfoRow label="Status" value={status.model.loaded ? '✓ Loaded' : '✗ Not loaded'} />
          <InfoRow label="Mode" value="Local (On-Device)" />
        </View>

        {/* Agents Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Agents Status</Text>
          {Object.entries(status.agents).map(([name, agent]) => (
            <AgentStatusRow
              key={name}
              name={name}
              active={agent.active}
              ready={agent.ready}
            />
          ))}
        </View>

        {/* Memory Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Memory</Text>
          {memoryStats && (
            <>
              <InfoRow label="Short-term" value={`${memoryStats.shortTermCount} entries`} />
              <InfoRow label="Long-term" value={`${memoryStats.longTermCount} entries`} />
              <InfoRow label="Total" value={`${memoryStats.totalCount} entries`} />
              <InfoRow
                label="Average importance"
                value={memoryStats.avgImportance.toFixed(2)}
              />
            </>
          )}
          
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.secondaryButton} onPress={exportMemory}>
              <Text style={styles.secondaryButtonText}>Export</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dangerButton} onPress={clearMemory}>
              <Text style={styles.dangerButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Voice Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Voice</Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Auto-speak responses</Text>
            <Switch
              value={autoSpeak}
              onValueChange={toggleAutoSpeak}
              trackColor={{ false: '#555', true: '#6C63FF' }}
              thumbColor="#EAEAEA"
            />
          </View>
        </View>

        {/* Current State */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current State</Text>
          <InfoRow label="Avatar" value={status.avatarState} />
          <InfoRow label="Emotion" value={status.currentEmotion} />
          <InfoRow label="Theme" value={status.currentTheme} />
          <InfoRow
            label="Active creatures"
            value={`${status.activeCreatures.length}/7`}
          />
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>
            Nova AI is a multi-agent system running completely on your device.
            All processing happens locally with zero API costs and full offline
            capability.
          </Text>
          <Text style={styles.aboutText}>
            • 7 specialized AI agents{'\n'}
            • Local LLM inference{'\n'}
            • Emotion awareness{'\n'}
            • Long-term memory{'\n'}
            • Voice interaction{'\n'}
            • Creative mode
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function AgentStatusRow({ name, active, ready }) {
  const displayName = name.charAt(0).toUpperCase() + name.slice(1);
  const statusColor = active ? (ready !== false ? '#66BB6A' : '#FFD600') : '#888';
  const statusText = active ? (ready !== false ? 'Active' : 'Loading') : 'Inactive';

  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{displayName}</Text>
      <View style={styles.agentStatus}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={styles.infoValue}>{statusText}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1A1A2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: '#16213E',
    borderBottomWidth: 2,
    borderBottomColor: '#6C63FF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#EAEAEA',
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#6C63FF',
    borderRadius: 16,
  },
  closeButtonText: {
    color: '#EAEAEA',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#16213E',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6C63FF',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 16,
    color: '#888',
  },
  infoValue: {
    fontSize: 16,
    color: '#EAEAEA',
    fontWeight: '500',
  },
  agentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: '#EAEAEA',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#16213E',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#6C63FF',
  },
  secondaryButtonText: {
    color: '#EAEAEA',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  dangerButton: {
    flex: 1,
    backgroundColor: '#E53935',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginLeft: 8,
  },
  dangerButtonText: {
    color: '#EAEAEA',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  aboutText: {
    fontSize: 14,
    color: '#888',
    lineHeight: 22,
    marginBottom: 10,
  },
});
