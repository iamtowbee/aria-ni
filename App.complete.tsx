// App.complete.tsx
/**
 * Complete Integrated Aria Nova App
 * 
 * Wires everything together with proper state management
 */

import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';

// Providers
import { ThemeProvider } from './src/ui/theme/ThemeProvider';
import { AppProvider, useApp } from './src/context/AppContext';

// Screens
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { IntegratedModernChatScreen } from './src/screens/IntegratedModernChatScreen';
import { ModernSettingsScreen } from './src/screens/ModernSettingsScreen';
import { ConversationHistoryScreen } from './src/screens/ConversationHistoryScreen';
import { AgentDetailsScreen, sampleAgents } from './src/screens/AgentDetailsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Tab Icon Component
const TabIcon = ({ emoji, focused }: { emoji: string; focused: boolean }) => (
  <Text style={{ fontSize: focused ? 28 : 24, opacity: focused ? 1 : 0.6 }}>
    {emoji}
  </Text>
);

// Main Tab Navigator
const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#9CA3AF',
      }}
    >
      <Tab.Screen
        name="Chat"
        component={IntegratedModernChatScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="💬" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="History"
        component={ConversationHistoryScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="📚" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={ModernSettingsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
};

// App Content (after providers)
const AppContent = () => {
  const { state, setShowOnboarding, setOnboarded } = useApp();
  
  const handleOnboardingComplete = () => {
    setOnboarded(true);
    setShowOnboarding(false);
  };

  if (state.showOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen
          name="AgentDetails"
          component={AgentDetailsScreen}
          options={{ presentation: 'modal' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// Root App Component
export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <AppContent />
        <StatusBar style="auto" />
      </AppProvider>
    </ThemeProvider>
  );
}
