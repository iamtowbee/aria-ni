// src/components/smart/feedback/ContextActionSheet.tsx
/**
 * Context-Aware Action Sheet
 * 
 * Smart bottom sheet that adapts based on:
 * - Current context
 * - User permissions
 * - Agent capabilities
 * - Recent actions
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';

export interface ActionItem {
  id: string;
  title: string;
  icon: string;
  subtitle?: string;
  destructive?: boolean;
  disabled?: boolean;
  badge?: string;
  onPress: () => void;
}

export interface ActionSection {
  title?: string;
  actions: ActionItem[];
}

export interface ContextActionSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  sections: ActionSection[];
  context?: 'message' | 'agent' | 'media' | 'settings';
  showCancel?: boolean;
}

/**
 * ContextActionSheet
 * 
 * Adaptive action sheet with smart suggestions
 */
export const ContextActionSheet: React.FC<ContextActionSheetProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  sections,
  context = 'message',
  showCancel = true,
}) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleActionPress = (action: ActionItem) => {
    action.onPress();
    onClose();
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]} />
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.sheet,
          { transform: [{ translateY }] },
        ]}
      >
        {/* Header */}
        {(title || subtitle) && (
          <View style={styles.header}>
            {title && <Text style={styles.title}>{title}</Text>}
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
        )}

        {/* Sections */}
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {sections.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.section}>
              {section.title && (
                <Text style={styles.sectionTitle}>{section.title}</Text>
              )}
              
              {section.actions.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  style={[
                    styles.action,
                    action.disabled && styles.actionDisabled,
                  ]}
                  onPress={() => handleActionPress(action)}
                  disabled={action.disabled}
                >
                  <View style={styles.actionContent}>
                    <Text style={styles.actionIcon}>{action.icon}</Text>
                    <View style={styles.actionText}>
                      <Text style={[
                        styles.actionTitle,
                        action.destructive && styles.destructive,
                        action.disabled && styles.disabledText,
                      ]}>
                        {action.title}
                      </Text>
                      {action.subtitle && (
                        <Text style={styles.actionSubtitle}>
                          {action.subtitle}
                        </Text>
                      )}
                    </View>
                    {action.badge && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{action.badge}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </ScrollView>

        {/* Cancel Button */}
        {showCancel && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </Modal>
  );
};

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    opacity: 0.5,
  },
  
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.8,
    paddingBottom: 34, // Safe area
  },
  
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  
  scrollView: {
    maxHeight: SCREEN_HEIGHT * 0.6,
  },
  
  section: {
    paddingVertical: 8,
  },
  
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  
  action: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  
  actionDisabled: {
    opacity: 0.5,
  },
  
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  actionIcon: {
    fontSize: 22,
    marginRight: 12,
    width: 28,
  },
  
  actionText: {
    flex: 1,
  },
  
  actionTitle: {
    fontSize: 17,
    color: '#000',
  },
  
  destructive: {
    color: '#FF3B30',
  },
  
  disabledText: {
    color: '#999',
  },
  
  actionSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  
  badge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  
  cancelButton: {
    paddingVertical: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 8,
  },
  
  cancelText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
});
