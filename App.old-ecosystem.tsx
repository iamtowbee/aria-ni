// App.js
// Main entry point with navigation, model download, and proper UX

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Modal,
  Alert,
} from 'react-native';
import { createAIEcosystem } from './src/AIEcosystem';
import ChatScreen from './src/screens/ChatScreen';
import SettingsScreen from './src/screens/SettingsScreen';

export default function App() {
  const [ecosystem, setEcosystem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingStage, setLoadingStage] = useState({ stage: '', percent: 0 });
  const [error, setError] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [needsModelDownload, setNeedsModelDownload] = useState(false);

  useEffect(() => {
    checkAndInitialize();
  }, []);

  async function checkAndInitialize() {
    try {
      // Check if model exists
      const { ModelDownloader } = require('./src/models/ModelDownloader');
      const downloader = new ModelDownloader();
      const hasModel = await downloader.isDownloaded('tinyllama-1.1b');

      if (!hasModel) {
        setNeedsModelDownload(true);
        setLoading(false);
        return;
      }

      // Model exists, initialize
      await initializeAI();
    } catch (err) {
      console.error('Check error:', err);
      setError(err.message);
      setLoading(false);
    }
  }

  async function downloadAndInitialize() {
    try {
      setLoading(true);
      setNeedsModelDownload(false);

      const { ModelDownloader } = require('./src/models/ModelDownloader');
      const downloader = new ModelDownloader();

      await downloader.download('tinyllama-1.1b', (progress) => {
        setLoadingStage({
          stage: 'Downloading model',
          percent: progress.percent,
        });
      });

      // Model downloaded, now initialize
      await initializeAI();
    } catch (err) {
      console.error('Download error:', err);
      setError(err.message);
      setLoading(false);
    }
  }

  async function initializeAI() {
    try {
      const ai = createAIEcosystem({
        personality: {
          name: 'Nova',
          traits: ['helpful', 'curious', 'empathetic'],
          tone: 'friendly',
        },
        autoSpeak: false,
        onUIStateChange: (payload) => {
          console.log('UI State:', payload);
        },
        onNotification: (message, type) => {
          if (type === 'error') {
            Alert.alert('Error', message);
          }
        },
      });

      await ai.initialize((progress) => {
        setLoadingStage(progress);
      });

      setEcosystem(ai);
      setLoading(false);
    } catch (err) {
      console.error('Initialization error:', err);
      setError(err.message);
      setLoading(false);
    }
  }

  function retry() {
    setError(null);
    setLoading(true);
    checkAndInitialize();
  }

  // Model download screen
  if (needsModelDownload) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.centerContent}>
          <Text style={styles.title}>Nova AI</Text>
          <Text style={styles.subtitle}>Local AI Assistant</Text>
          
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>First Time Setup</Text>
            <Text style={styles.infoText}>
              Nova needs to download the TinyLlama model to run locally on your device.
            </Text>
            <Text style={styles.infoText}>
              • Size: ~637 MB{'\n'}
              • One-time download{'\n'}
              • Runs completely offline{'\n'}
              • Zero API costs
            </Text>
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={downloadAndInitialize}
          >
            <Text style={styles.primaryButtonText}>Download Model</Text>
          </TouchableOpacity>

          <Text style={styles.footnote}>
            Requires WiFi or unlimited data plan
          </Text>
        </View>
      </View>
    );
  }

  // Loading screen
  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.centerContent}>
          <Text style={styles.title}>Nova AI</Text>
          <ActivityIndicator
            size="large"
            color="#6C63FF"
            style={styles.loader}
          />
          <Text style={styles.loadingText}>
            {loadingStage.stage || 'Initializing...'}
          </Text>
          {loadingStage.percent > 0 && (
            <>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${loadingStage.percent}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {Math.round(loadingStage.percent)}%
              </Text>
            </>
          )}
          <Text style={styles.loadingSubtext}>
            {loadingStage.stage === 'model'
              ? 'Loading language model...'
              : 'Initializing agents...'}
          </Text>
        </View>
      </View>
    );
  }

  // Error screen
  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.centerContent}>
          <Text style={styles.title}>⚠️ Error</Text>
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
          <TouchableOpacity style={styles.primaryButton} onPress={retry}>
            <Text style={styles.primaryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Main app
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Settings Button */}
      <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => setShowSettings(true)}
      >
        <Text style={styles.settingsButtonText}>⚙️</Text>
      </TouchableOpacity>

      {/* Chat Screen */}
      <ChatScreen ecosystem={ecosystem} />

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SettingsScreen
          ecosystem={ecosystem}
          onClose={() => setShowSettings(false)}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  title: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#6C63FF',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 20,
    color: '#EAEAEA',
    marginBottom: 40,
  },
  loader: {
    marginVertical: 30,
  },
  loadingText: {
    fontSize: 18,
    color: '#EAEAEA',
    marginTop: 20,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#888',
    marginTop: 10,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#16213E',
    borderRadius: 4,
    marginTop: 20,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6C63FF',
  },
  progressText: {
    fontSize: 24,
    color: '#6C63FF',
    fontWeight: 'bold',
    marginTop: 10,
  },
  infoBox: {
    backgroundColor: '#16213E',
    padding: 20,
    borderRadius: 16,
    marginBottom: 30,
    width: '100%',
    borderWidth: 1,
    borderColor: '#6C63FF',
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EAEAEA',
    marginBottom: 15,
  },
  infoText: {
    fontSize: 16,
    color: '#888',
    lineHeight: 24,
    marginBottom: 10,
  },
  errorBox: {
    backgroundColor: '#E53935',
    padding: 20,
    borderRadius: 16,
    marginVertical: 20,
    width: '100%',
  },
  errorText: {
    fontSize: 16,
    color: '#EAEAEA',
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#6C63FF',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 24,
    minWidth: 200,
  },
  primaryButtonText: {
    color: '#EAEAEA',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  footnote: {
    fontSize: 12,
    color: '#888',
    marginTop: 20,
    textAlign: 'center',
  },
  settingsButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#16213E',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    borderWidth: 1,
    borderColor: '#6C63FF',
  },
  settingsButtonText: {
    fontSize: 24,
  },
});
