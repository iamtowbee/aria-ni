// src/navigation/MainNavigator.tsx
/**
 * Main Navigator
 * 
 * Root navigation using standardized UI components
 */

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme, SmartTabBar } from '../ui';
import { ChatScreen } from '../screens/ChatScreen';
import { AgentsScreen } from '../screens/AgentsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

type Screen = 'chat' | 'agents' | 'settings';

export const MainNavigator: React.FC = () => {
  const { colors } = useTheme();
  const [activeScreen, setActiveScreen] = useState<Screen>('chat');

  const tabs = [
    {
      id: 'chat' as Screen,
      title: 'Chat',
      icon: '💬',
      activeIcon: '💬',
    },
    {
      id: 'agents' as Screen,
      title: 'Agents',
      icon: '🤖',
      badge: 10, // Number of agents
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
        return <ChatScreen />;
      case 'agents':
        return <AgentsScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <ChatScreen />;
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
