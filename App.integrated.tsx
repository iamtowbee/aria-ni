// App.tsx
/**
 * Aria Nova Ultimate - Integrated Main App
 * 
 * Connects all systems:
 * - AppCoordinator (state management)
 * - ThemeProvider (theming)
 * - Navigation
 * - All screens and components
 */

import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Providers
import { ThemeProvider } from './src/ui/theme/ThemeProvider';
import { AppCoordinator } from './src/AppCoordinator';
import { VoiceOrbProvider } from './src/components/voice-orb/VoiceOrbProvider';

// Screens
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { IntegratedNavigator } from './src/navigation/IntegratedNavigator';

const ONBOARDING_KEY = '@aria_nova_onboarding_complete';

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    try {
      const completed = await AsyncStorage.getItem(ONBOARDING_KEY);
      setShowOnboarding(!completed);
    } catch (error) {
      console.error('Error checking onboarding:', error);
      setShowOnboarding(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      setShowOnboarding(false);
    } catch (error) {
      console.error('Error saving onboarding:', error);
    }
  };

  if (isLoading) {
    return null; // Or a loading screen
  }

  return (
    <ThemeProvider defaultTheme="auto">
      <AppCoordinator>
        <VoiceOrbProvider>
          <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            {showOnboarding ? (
              <OnboardingScreen onComplete={handleOnboardingComplete} />
            ) : (
              <IntegratedNavigator />
            )}
          </SafeAreaView>
        </VoiceOrbProvider>
      </AppCoordinator>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
