// App.tsx
/**
 * Aria Nova Ultimate - Main App Entry
 * 
 * Updated to use standardized UI library
 */

import React from 'react';
import { SafeAreaView, StyleSheet, StatusBar } from 'react-native';
import { ThemeProvider } from './src/ui';
import { MainNavigator } from './src/navigation/MainNavigator';

export default function App() {
  return (
    <ThemeProvider defaultTheme="auto">
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <MainNavigator />
      </SafeAreaView>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
