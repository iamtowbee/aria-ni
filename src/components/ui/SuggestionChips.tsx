// src/components/ui/SuggestionChips.tsx
/**
 * Suggestion Chips
 * 
 * Inspired by Google Assistant and Character.AI
 * Features:
 * - Quick action suggestions
 * - Context-aware prompts
 * - Smooth animations
 * - Customizable actions
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../ui/theme/ThemeProvider';

export interface Suggestion {
  id: string;
  text: string;
  icon?: string;
  action?: () => void;
}

export interface SuggestionChipsProps {
  suggestions: Suggestion[];
  onSuggestionPress: (suggestion: Suggestion) => void;
  horizontal?: boolean;
}

export const SuggestionChips: React.FC<SuggestionChipsProps> = ({
  suggestions,
  onSuggestionPress,
  horizontal = true,
}) => {
  const { colors, tokens } = useTheme();

  if (suggestions.length === 0) return null;

  const chipContent = (
    <>
      {suggestions.map((suggestion) => (
        <TouchableOpacity
          key={suggestion.id}
          activeOpacity={0.7}
          onPress={() => {
            suggestion.action?.();
            onSuggestionPress(suggestion);
          }}
          style={[
            styles.chip,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border.main,
            },
          ]}
        >
          {suggestion.icon && (
            <Text style={styles.icon}>{suggestion.icon}</Text>
          )}
          <Text
            style={[styles.chipText, { color: colors.text.primary }]}
            numberOfLines={1}
          >
            {suggestion.text}
          </Text>
        </TouchableOpacity>
      ))}
    </>
  );

  if (horizontal) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalContainer}
        style={styles.scrollView}
      >
        {chipContent}
      </ScrollView>
    );
  }

  return <View style={styles.verticalContainer}>{chipContent}</View>;
};

const styles = StyleSheet.create({
  scrollView: {
    flexGrow: 0,
  },
  
  horizontalContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  
  verticalContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  
  icon: {
    fontSize: 16,
    marginRight: 6,
  },
  
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
