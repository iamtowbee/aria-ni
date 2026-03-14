// src/components/ui/AgentSelector.tsx
/**
 * Agent Selector Carousel
 * 
 * Inspired by Character.AI's character selection
 * Features:
 * - Horizontal scrollable carousel
 * - Active agent highlight
 * - Agent previews with colors
 * - Smooth transitions
 */

import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../ui/theme/ThemeProvider';

const { width } = Dimensions.get('window');

export interface Agent {
  id: string;
  name: string;
  description: string;
  emoji: string;
  color: string;
  specialty: string;
}

export interface AgentSelectorProps {
  agents: Agent[];
  activeAgent: string;
  onSelectAgent: (agentId: string) => void;
  showDescription?: boolean;
}

export const AgentSelector: React.FC<AgentSelectorProps> = ({
  agents,
  activeAgent,
  onSelectAgent,
  showDescription = true,
}) => {
  const { colors, tokens } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);

  const handleAgentPress = (agent: Agent, index: number) => {
    onSelectAgent(agent.id);
    
    // Scroll to center the selected agent
    scrollViewRef.current?.scrollTo({
      x: index * 140 - (width / 2) + 70,
      animated: true,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text.primary }]}>
        Choose your AI companion
      </Text>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={140}
      >
        {agents.map((agent, index) => {
          const isActive = agent.id === activeAgent;
          
          return (
            <TouchableOpacity
              key={agent.id}
              activeOpacity={0.8}
              onPress={() => handleAgentPress(agent, index)}
              style={styles.agentItem}
            >
              <Animated.View
                style={[
                  styles.agentCard,
                  {
                    backgroundColor: isActive ? agent.color : colors.surface,
                    borderWidth: isActive ? 3 : 1,
                    borderColor: isActive ? agent.color : colors.border.main,
                    transform: [{ scale: isActive ? 1.05 : 1 }],
                  },
                ]}
              >
                {/* Agent Avatar */}
                <View style={[
                  styles.agentAvatar,
                  { backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : agent.color },
                ]}>
                  <Text style={styles.agentEmoji}>{agent.emoji}</Text>
                </View>

                {/* Agent Name */}
                <Text
                  style={[
                    styles.agentName,
                    { color: isActive ? '#FFFFFF' : colors.text.primary },
                  ]}
                  numberOfLines={1}
                >
                  {agent.name}
                </Text>

                {/* Specialty Badge */}
                <View style={[
                  styles.specialtyBadge,
                  { backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : colors.surfaceVariant },
                ]}>
                  <Text
                    style={[
                      styles.specialtyText,
                      { color: isActive ? '#FFFFFF' : colors.text.secondary },
                    ]}
                    numberOfLines={1}
                  >
                    {agent.specialty}
                  </Text>
                </View>

                {/* Active indicator */}
                {isActive && (
                  <View style={styles.activeIndicator}>
                    <View style={styles.activeDot} />
                  </View>
                )}
              </Animated.View>

              {/* Description (below card) */}
              {showDescription && isActive && (
                <Text
                  style={[
                    styles.description,
                    { color: colors.text.secondary },
                  ]}
                  numberOfLines={2}
                >
                  {agent.description}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
  },
  
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  
  scrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  
  agentItem: {
    width: 128,
  },
  
  agentCard: {
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  
  agentAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  agentEmoji: {
    fontSize: 32,
  },
  
  agentName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  
  specialtyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  
  specialtyText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  activeIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  
  description: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 16,
  },
});
