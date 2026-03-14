// src/screens/ModernSettingsScreen.tsx
/**
 * Modern Settings Screen
 * 
 * Comprehensive settings with sections:
 * - Profile & Account
 * - Appearance & Theme
 * - Voice & Audio
 * - Privacy & Data
 * - Notifications
 * - About
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useTheme } from '../ui/theme/ThemeProvider';

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  type: 'toggle' | 'action' | 'info';
  icon?: string;
  value?: boolean;
  onPress?: () => void;
  destructive?: boolean;
}

interface SettingSection {
  title: string;
  items: SettingItem[];
}

export const ModernSettingsScreen: React.FC = () => {
  const { colors, tokens, theme, setTheme, isDark } = useTheme();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

  const sections: SettingSection[] = [
    {
      title: 'Account',
      items: [
        {
          id: 'profile',
          title: 'Profile Settings',
          subtitle: 'Manage your profile and preferences',
          type: 'action',
          icon: '👤',
          onPress: () => Alert.alert('Profile', 'Profile settings'),
        },
        {
          id: 'subscription',
          title: 'Subscription',
          subtitle: 'Free Plan',
          type: 'action',
          icon: '💎',
          onPress: () => Alert.alert('Subscription', 'Manage subscription'),
        },
      ],
    },
    {
      title: 'Appearance',
      items: [
        {
          id: 'theme_light',
          title: 'Light Mode',
          type: 'action',
          icon: '☀️',
          onPress: () => setTheme('light'),
        },
        {
          id: 'theme_dark',
          title: 'Dark Mode',
          type: 'action',
          icon: '🌙',
          onPress: () => setTheme('dark'),
        },
        {
          id: 'theme_auto',
          title: 'Auto (System)',
          type: 'action',
          icon: '🔄',
          onPress: () => setTheme('auto'),
        },
      ],
    },
    {
      title: 'Features',
      items: [
        {
          id: 'voice',
          title: 'Voice Input',
          subtitle: 'Enable voice commands',
          type: 'toggle',
          icon: '🎤',
          value: voiceEnabled,
          onPress: () => setVoiceEnabled(!voiceEnabled),
        },
        {
          id: 'offline',
          title: 'Offline Mode',
          subtitle: 'Work without internet',
          type: 'toggle',
          icon: '📴',
          value: offlineMode,
          onPress: () => setOfflineMode(!offlineMode),
        },
        {
          id: 'notifications',
          title: 'Notifications',
          subtitle: 'Get alerts and updates',
          type: 'toggle',
          icon: '🔔',
          value: notificationsEnabled,
          onPress: () => setNotificationsEnabled(!notificationsEnabled),
        },
      ],
    },
    {
      title: 'Privacy & Data',
      items: [
        {
          id: 'analytics',
          title: 'Usage Analytics',
          subtitle: 'Help improve the app',
          type: 'toggle',
          icon: '📊',
          value: analyticsEnabled,
          onPress: () => setAnalyticsEnabled(!analyticsEnabled),
        },
        {
          id: 'data',
          title: 'Data Management',
          subtitle: 'Export or delete your data',
          type: 'action',
          icon: '💾',
          onPress: () => Alert.alert('Data', 'Manage your data'),
        },
        {
          id: 'clear_cache',
          title: 'Clear Cache',
          subtitle: 'Free up storage space',
          type: 'action',
          icon: '🗑️',
          onPress: () => Alert.alert('Clear Cache', 'Cache cleared!'),
        },
      ],
    },
    {
      title: 'About',
      items: [
        {
          id: 'version',
          title: 'Version',
          subtitle: '2.4.0',
          type: 'info',
          icon: 'ℹ️',
        },
        {
          id: 'help',
          title: 'Help & Support',
          type: 'action',
          icon: '❓',
          onPress: () => Alert.alert('Help', 'Contact support'),
        },
        {
          id: 'terms',
          title: 'Terms & Privacy',
          type: 'action',
          icon: '📄',
          onPress: () => Alert.alert('Terms', 'View terms and privacy'),
        },
        {
          id: 'logout',
          title: 'Sign Out',
          type: 'action',
          icon: '🚪',
          destructive: true,
          onPress: () => Alert.alert('Sign Out', 'Are you sure?'),
        },
      ],
    },
  ];

  const renderSettingItem = (item: SettingItem) => {
    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.settingItem,
          { backgroundColor: colors.surface, borderColor: colors.border.light },
        ]}
        onPress={item.type === 'toggle' ? item.onPress : item.type === 'action' ? item.onPress : undefined}
        activeOpacity={item.type === 'info' ? 1 : 0.7}
        disabled={item.type === 'info'}
      >
        <View style={styles.settingLeft}>
          {item.icon && <Text style={styles.settingIcon}>{item.icon}</Text>}
          <View style={styles.settingText}>
            <Text
              style={[
                styles.settingTitle,
                { color: item.destructive ? colors.error : colors.text.primary },
              ]}
            >
              {item.title}
            </Text>
            {item.subtitle && (
              <Text style={[styles.settingSubtitle, { color: colors.text.secondary }]}>
                {item.subtitle}
              </Text>
            )}
          </View>
        </View>

        {item.type === 'toggle' && (
          <Switch
            value={item.value}
            onValueChange={item.onPress}
            trackColor={{ false: colors.border.main, true: colors.primary }}
            thumbColor={colors.neutral[0]}
          />
        )}

        {item.type === 'action' && (
          <Text style={[styles.chevron, { color: colors.text.tertiary }]}>›</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          Settings
        </Text>
      </View>

      {/* Settings List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {sections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>
              {section.title}
            </Text>
            {section.items.map(renderSettingItem)}
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.text.tertiary }]}>
            Aria Nova Ultimate
          </Text>
          <Text style={[styles.footerText, { color: colors.text.tertiary }]}>
            Made with ❤️
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
  },
  
  scrollView: {
    flex: 1,
  },
  
  scrollContent: {
    paddingVertical: 20,
  },
  
  section: {
    marginBottom: 32,
  },
  
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  settingIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  
  settingText: {
    flex: 1,
  },
  
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  
  settingSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  
  chevron: {
    fontSize: 24,
    fontWeight: '300',
  },
  
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  
  footerText: {
    fontSize: 13,
    marginVertical: 4,
  },
});
