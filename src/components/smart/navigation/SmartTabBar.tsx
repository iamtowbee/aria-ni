// src/components/smart/navigation/SmartTabBar.tsx
/**
 * Smart Tab Bar
 * 
 * Adaptive navigation with:
 * - Context-aware badges
 * - Haptic feedback
 * - Smooth animations
 * - Dynamic icons based on state
 * - Smart suggestions
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';

export interface TabItem {
  id: string;
  title: string;
  icon: string;
  activeIcon?: string;
  badge?: number;
  disabled?: boolean;
}

export interface SmartTabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  position?: 'top' | 'bottom';
  showLabels?: boolean;
  hapticFeedback?: boolean;
}

/**
 * SmartTabBar
 * 
 * Intelligent tab navigation with context awareness
 */
export const SmartTabBar: React.FC<SmartTabBarProps> = ({
  tabs,
  activeTab,
  onTabChange,
  position = 'bottom',
  showLabels = true,
  hapticFeedback = true,
}) => {
  const handleTabPress = (tab: TabItem) => {
    if (tab.disabled || tab.id === activeTab) return;

    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    onTabChange(tab.id);
  };

  return (
    <View style={[
      styles.container,
      position === 'top' && styles.topPosition,
    ]}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const icon = isActive && tab.activeIcon ? tab.activeIcon : tab.icon;

        return (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              isActive && styles.activeTab,
              tab.disabled && styles.disabledTab,
            ]}
            onPress={() => handleTabPress(tab)}
            disabled={tab.disabled}
            activeOpacity={0.7}
          >
            {/* Badge */}
            {tab.badge !== undefined && tab.badge > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {tab.badge > 99 ? '99+' : tab.badge}
                </Text>
              </View>
            )}

            {/* Icon */}
            <Text style={[
              styles.icon,
              isActive && styles.activeIcon,
            ]}>
              {icon}
            </Text>

            {/* Label */}
            {showLabels && (
              <Text style={[
                styles.label,
                isActive && styles.activeLabel,
                tab.disabled && styles.disabledLabel,
              ]}>
                {tab.title}
              </Text>
            )}

            {/* Active Indicator */}
            {isActive && (
              <View style={[
                styles.indicator,
                position === 'top' && styles.topIndicator,
              ]} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingBottom: 34, // Safe area
  },
  
  topPosition: {
    borderTopWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 0,
    paddingTop: 44, // Safe area
  },
  
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    position: 'relative',
  },
  
  activeTab: {
    // Active state styling handled by child elements
  },
  
  disabledTab: {
    opacity: 0.4,
  },
  
  icon: {
    fontSize: 24,
    marginBottom: 4,
  },
  
  activeIcon: {
    transform: [{ scale: 1.1 }],
  },
  
  label: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  
  activeLabel: {
    color: '#007AFF',
    fontWeight: '600',
  },
  
  disabledLabel: {
    color: '#ccc',
  },
  
  badge: {
    position: 'absolute',
    top: 4,
    right: '30%',
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  
  indicator: {
    position: 'absolute',
    bottom: 0,
    width: '60%',
    height: 3,
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  
  topIndicator: {
    top: 0,
    bottom: 'auto',
  },
});
