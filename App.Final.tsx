// App.Final.tsx
/**
 * Aria Nova Ultimate - Final Integrated App
 * 
 * Connects:
 * - Existing AIEcosystem (agents, LLM)
 * - Modern UI components
 * - Theme system
 * - Navigation
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Core ecosystem
import { AIEcosystem } from './src/AIEcosystem';

// Integration layer
import { EcosystemProvider } from './src/integration/EcosystemProvider';

// UI System
import { ThemeProvider } from './src/ui/theme/ThemeProvider';

// Screens
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { ModernChatWithEcosystem } from './src/screens/ModernChatWithEcosystem';
import { ModernSettingsScreen } from './src/screens/ModernSettingsScreen';

const ONBOARDING_KEY = '@aria_nova_onboarding_complete';

export default function App() {
  // Ecosystem state
  const [ecosystem, setEcosystem] = useState<AIEcosystem | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStage, setLoadingStage] = useState({ stage: '', percent: 0 });
  const [error, setError] = useState<string | null>(null);
  const [needsModelDownload, setNeedsModelDownload] = useState(false);
  
  // UI state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<'chat' | 'settings'>('chat');

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    try {
      const completed = await AsyncStorage.getItem(ONBOARDING_KEY);
      if (!completed) {
        setShowOnboarding(true);
        setLoading(false);
      } else {
        await checkAndInitialize();
      }
    } catch (err) {
      console.error('Error checking onboarding:', err);
      setShowOnboarding(true);
      setLoading(false);
    }
  };

  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      setShowOnboarding(false);
      await checkAndInitialize();
    } catch (err) {
      console.error('Error completing onboarding:', err);
    }
  };

  async function checkAndInitialize() {
    try {
      setLoading(true);
      
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
    } catch (err: any) {
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

      await downloader.download('tinyllama-1.1b', (progress: any) => {
        setLoadingStage({
          stage: 'Downloading model',
          percent: progress.percent,
        });
      });

      // Model downloaded, now initialize
      await initializeAI();
    } catch (err: any) {
      console.error('Download error:', err);
      setError(err.message);
      setLoading(false);
    }
  }

  async function initializeAI() {
    try {
      const ai = new AIEcosystem({
        personality: {
          name: 'Aria Nova',
          traits: ['helpful', 'curious', 'empathetic'],
          tone: 'friendly',
        },
        autoSpeak: false,
      });

      await ai.initialize((progress: any) => {
        setLoadingStage(progress);
      });

      setEcosystem(ai);
      setLoading(false);
    } catch (err: any) {
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

  // Onboarding screen
  if (showOnboarding) {
    return (
      <ThemeProvider defaultTheme="auto">
        <OnboardingScreen onComplete={handleOnboardingComplete} />
      </ThemeProvider>
    );
  }

  // Model download screen
  if (needsModelDownload) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.centerContent}>
          <Text style={styles.title}>Aria Nova</Text>
          <Text style={styles.subtitle}>AI Companion</Text>
          
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>First Time Setup</Text>
            <Text style={styles.infoText}>
              Aria Nova needs to download the AI model to run locally on your device.
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
          <Text style={styles.title}>Aria Nova</Text>
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

  // Main app with ecosystem
  if (!ecosystem) {
    return null;
  }

  return (
    <ThemeProvider defaultTheme="auto">
      <EcosystemProvider ecosystem={ecosystem}>
        <SafeAreaView style={styles.appContainer}>
          {/* Settings Button */}
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => setCurrentScreen(
              currentScreen === 'chat' ? 'settings' : 'chat'
            )}
          >
            <Text style={styles.settingsButtonText}>
              {currentScreen === 'chat' ? '⚙️' : '💬'}
            </Text>
          </TouchableOpacity>

          {/* Current Screen */}
          {currentScreen === 'chat' ? (
            <ModernChatWithEcosystem />
          ) : (
            <ModernSettingsScreen />
          )}
        </SafeAreaView>
      </EcosystemProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  
  appContainer: {
    flex: 1,
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
