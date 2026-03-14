// src/screens/AgentDetailsScreen.tsx
/**
 * Agent Details Screen
 * 
 * Detailed view of each AI agent with:
 * - Agent profile
 * - Capabilities
 * - Usage statistics
 * - Examples
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../ui/theme/ThemeProvider';
import { AvatarCard } from '../components/ui/AvatarCard';

interface AgentCapability {
  title: string;
  description: string;
  icon: string;
}

interface AgentExample {
  prompt: string;
  response: string;
}

interface AgentData {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string;
  longDescription: string;
  capabilities: AgentCapability[];
  examples: AgentExample[];
  stats?: {
    conversations: number;
    accuracy: number;
    responseTime: string;
  };
}

export interface AgentDetailsScreenProps {
  agent: AgentData;
  onStartChat: () => void;
  onBack: () => void;
}

export const AgentDetailsScreen: React.FC<AgentDetailsScreenProps> = ({
  agent,
  onStartChat,
  onBack,
}) => {
  const { colors, tokens } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={[styles.backIcon, { color: colors.text.primary }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          Agent Details
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <AvatarCard
          agentName={agent.name}
          mood="happy"
          status="idle"
          avatarColor={agent.color}
          showHint={false}
        />

        {/* Description */}
        <View style={styles.section}>
          <Text style={[styles.description, { color: colors.text.primary }]}>
            {agent.longDescription}
          </Text>
        </View>

        {/* Stats */}
        {agent.stats && (
          <View style={[styles.statsContainer, { backgroundColor: colors.surface }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {agent.stats.conversations}
              </Text>
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
                Conversations
              </Text>
            </View>
            
            <View style={[styles.statDivider, { backgroundColor: colors.border.light }]} />
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {agent.stats.accuracy}%
              </Text>
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
                Accuracy
              </Text>
            </View>
            
            <View style={[styles.statDivider, { backgroundColor: colors.border.light }]} />
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {agent.stats.responseTime}
              </Text>
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
                Avg. Response
              </Text>
            </View>
          </View>
        )}

        {/* Capabilities */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Capabilities
          </Text>
          
          {agent.capabilities.map((capability, index) => (
            <View
              key={index}
              style={[styles.capabilityCard, { backgroundColor: colors.surface }]}
            >
              <Text style={styles.capabilityIcon}>{capability.icon}</Text>
              <View style={styles.capabilityText}>
                <Text style={[styles.capabilityTitle, { color: colors.text.primary }]}>
                  {capability.title}
                </Text>
                <Text style={[styles.capabilityDescription, { color: colors.text.secondary }]}>
                  {capability.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Examples */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Example Conversations
          </Text>
          
          {agent.examples.map((example, index) => (
            <View
              key={index}
              style={[styles.exampleCard, { backgroundColor: colors.surface }]}
            >
              <View style={styles.examplePrompt}>
                <Text style={[styles.exampleLabel, { color: colors.text.secondary }]}>
                  You:
                </Text>
                <Text style={[styles.exampleText, { color: colors.text.primary }]}>
                  {example.prompt}
                </Text>
              </View>
              
              <View style={styles.exampleResponse}>
                <Text style={[styles.exampleLabel, { color: agent.color }]}>
                  {agent.name}:
                </Text>
                <Text style={[styles.exampleText, { color: colors.text.primary }]}>
                  {example.response}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Action Button */}
      <View style={[styles.actionContainer, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: agent.color }]}
          onPress={onStartChat}
        >
          <Text style={styles.actionButtonText}>
            Start Chat with {agent.name}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// Example agent data
export const sampleAgents: Record<string, AgentData> = {
  core: {
    id: 'core',
    name: 'Core',
    emoji: '🤖',
    color: '#3B82F6',
    description: 'Your primary AI assistant',
    longDescription: 'Core is your versatile AI companion, designed to help with a wide range of tasks from answering questions to providing recommendations and assistance.',
    capabilities: [
      {
        title: 'General Knowledge',
        description: 'Answer questions on various topics',
        icon: '🧠',
      },
      {
        title: 'Task Assistance',
        description: 'Help with daily tasks and planning',
        icon: '✅',
      },
      {
        title: 'Conversation',
        description: 'Engage in natural dialogue',
        icon: '💬',
      },
    ],
    examples: [
      {
        prompt: 'What\'s the weather like today?',
        response: 'I can help you check the weather. Please share your location.',
      },
      {
        prompt: 'Help me plan my day',
        response: 'I\'d be happy to help! What are your main goals for today?',
      },
    ],
    stats: {
      conversations: 1247,
      accuracy: 94,
      responseTime: '1.2s',
    },
  },
  vision: {
    id: 'vision',
    name: 'Vision',
    emoji: '👁️',
    color: '#8B5CF6',
    description: 'Image analysis expert',
    longDescription: 'Vision specializes in understanding and analyzing images. It can describe scenes, identify objects, read text, and provide detailed insights about visual content.',
    capabilities: [
      {
        title: 'Image Description',
        description: 'Describe scenes and objects in images',
        icon: '🖼️',
      },
      {
        title: 'Object Detection',
        description: 'Identify and locate objects',
        icon: '🎯',
      },
      {
        title: 'Scene Analysis',
        description: 'Understand context and relationships',
        icon: '🔍',
      },
    ],
    examples: [
      {
        prompt: 'What\'s in this image?',
        response: 'I can see a sunset over a beach with palm trees. The sky has beautiful orange and pink hues.',
      },
    ],
    stats: {
      conversations: 523,
      accuracy: 96,
      responseTime: '2.1s',
    },
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  
  backIcon: {
    fontSize: 32,
    fontWeight: '300',
  },
  
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  
  placeholder: {
    width: 40,
  },
  
  scrollView: {
    flex: 1,
  },
  
  scrollContent: {
    paddingBottom: 100,
  },
  
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 32,
    padding: 20,
    borderRadius: 16,
  },
  
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  
  statDivider: {
    width: 1,
    marginHorizontal: 12,
  },
  
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  
  capabilityCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  
  capabilityIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  
  capabilityText: {
    flex: 1,
  },
  
  capabilityTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  
  capabilityDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  
  exampleCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  
  examplePrompt: {
    marginBottom: 12,
  },
  
  exampleResponse: {
    paddingLeft: 12,
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(0,0,0,0.1)',
  },
  
  exampleLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  
  exampleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  
  actionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  
  actionButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
