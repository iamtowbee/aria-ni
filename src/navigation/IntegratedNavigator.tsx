// src/navigation/IntegratedNavigator.tsx
/**
 * Integrated Navigator
 * 
 * Main navigation using AppCoordinator for state
 * Connects all screens with app state
 */

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../ui/theme/ThemeProvider';
import { useApp } from '../AppCoordinator';

// Import UI Components
import { SmartTabBar } from '../components/ui';

// Import Screens
import { IntegratedChatScreen } from '../screens/IntegratedChatScreen';
import { IntegratedHistoryScreen } from '../screens/IntegratedHistoryScreen';
import { ModernSettingsScreen } from '../screens/ModernSettingsScreen';

type Screen = 'chat' | 'history' | 'settings';

export const IntegratedNavigator: React.FC = () => {
  const { colors } = useTheme();
  const { conversations } = useApp();
  const [activeScreen, setActiveScreen] = useState<Screen>('chat');

  const tabs = [
    {
      id: 'chat' as Screen,
      title: 'Chat',
      icon: '💬',
      activeIcon: '💬',
    },
    {
      id: 'history' as Screen,
      title: 'History',
      icon: '📚',
      badge: conversations.size,
    },
    {
      id: 'settings' as Screen,
      title: 'Settings',
      icon: '⚙️',
    },
  ];

  const renderScreen = () => {
    switch (activeScreen) {
      case 'chat':
        return <IntegratedChatScreen />;
      case 'history':
        return <IntegratedHistoryScreen onBack={() => setActiveScreen('chat')} />;
      case 'settings':
        return <ModernSettingsScreen />;
      default:
        return <IntegratedChatScreen />;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.screen}>
        {renderScreen()}
      </View>

      <SmartTabBar
        tabs={tabs}
        activeTab={activeScreen}
        onTabChange={(tabId) => setActiveScreen(tabId as Screen)}
        hapticFeedback={true}
        showLabels={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  screen: {
    flex: 1,
  },
});
