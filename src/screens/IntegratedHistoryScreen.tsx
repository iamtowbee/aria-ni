// src/screens/IntegratedHistoryScreen.tsx
/**
 * Integrated History Screen
 * 
 * Connected to AppCoordinator for real conversation data
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useTheme } from '../ui/theme/ThemeProvider';
import { useApp } from '../AppCoordinator';

export interface IntegratedHistoryScreenProps {
  onBack: () => void;
}

const agentConfigs: Record<string, { name: string; emoji: string; color: string }> = {
  core: { name: 'Core', emoji: '🤖', color: '#3B82F6' },
  vision: { name: 'Vision', emoji: '👁️', color: '#8B5CF6' },
  creativity: { name: 'Creativity', emoji: '🎨', color: '#EC4899' },
  ocr: { name: 'OCR', emoji: '📝', color: '#10B981' },
  alpha: { name: 'Alpha', emoji: '📱', color: '#F59E0B' },
  beta: { name: 'Beta', emoji: '💬', color: '#3B82F6' },
  gamma: { name: 'Gamma', emoji: '💾', color: '#6366F1' },
  delta: { name: 'Delta', emoji: '❤️', color: '#EF4444' },
};

export const IntegratedHistoryScreen: React.FC<IntegratedHistoryScreenProps> = ({
  onBack,
}) => {
  const { colors, tokens } = useTheme();
  const { conversations, loadConversation, deleteConversation } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  const formatTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  // Convert Map to array and sort by lastMessageAt
  const conversationList = Array.from(conversations.values())
    .sort((a, b) => b.lastMessageAt - a.lastMessageAt);

  // Filter conversations
  const filteredConversations = conversationList.filter(conv => {
    // Agent filter
    if (selectedFilter && conv.agentId !== selectedFilter) {
      return false;
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const hasMatch = conv.messages.some(msg => 
        msg.text.toLowerCase().includes(query)
      );
      if (!hasMatch) return false;
    }
    
    return true;
  });

  const handleDelete = (conversationId: string) => {
    Alert.alert(
      'Delete Conversation',
      'Are you sure you want to delete this conversation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteConversation(conversationId),
        },
      ]
    );
  };

  const handleSelect = (conversationId: string) => {
    loadConversation(conversationId);
    onBack();
  };

  const getConversationTitle = (conv: any): string => {
    const firstUserMessage = conv.messages.find((m: any) => m.isUser);
    return firstUserMessage?.text || 'New Conversation';
  };

  const getConversationPreview = (conv: any): string => {
    const lastMessage = conv.messages[conv.messages.length - 1];
    return lastMessage?.text || '';
  };

  const renderConversation = ({ item }: { item: any }) => {
    const agent = agentConfigs[item.agentId] || agentConfigs.core;
    
    return (
      <TouchableOpacity
        style={[styles.conversationCard, { backgroundColor: colors.surface }]}
        onPress={() => handleSelect(item.id)}
        onLongPress={() => handleDelete(item.id)}
      >
        <View style={styles.cardHeader}>
          {/* Agent Avatar */}
          <View style={[styles.agentAvatar, { backgroundColor: agent.color }]}>
            <Text style={styles.agentEmoji}>{agent.emoji}</Text>
          </View>

          {/* Title and Time */}
          <View style={styles.cardHeaderText}>
            <Text style={[styles.conversationTitle, { color: colors.text.primary }]}>
              {getConversationTitle(item).substring(0, 50)}
            </Text>
            <Text style={[styles.timestamp, { color: colors.text.tertiary }]}>
              {formatTime(item.lastMessageAt)}
            </Text>
          </View>
        </View>

        {/* Preview */}
        <Text
          style={[styles.preview, { color: colors.text.secondary }]}
          numberOfLines={2}
        >
          {getConversationPreview(item)}
        </Text>

        {/* Footer */}
        <View style={styles.cardFooter}>
          <View style={[styles.badge, { backgroundColor: colors.surfaceVariant }]}>
            <Text style={[styles.badgeText, { color: agent.color }]}>
              {agent.name}
            </Text>
          </View>
          
          <Text style={[styles.messageCount, { color: colors.text.tertiary }]}>
            {item.messages.length} messages
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={[styles.backIcon, { color: colors.text.primary }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          Conversations ({conversationList.length})
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchInput, { backgroundColor: colors.surface }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchText, { color: colors.text.primary }]}
            placeholder="Search conversations..."
            placeholderTextColor={colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* List */}
      <FlatList
        data={filteredConversations}
        renderItem={renderConversation}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>💬</Text>
            <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
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
  
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  
  searchIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  
  searchText: {
    flex: 1,
    fontSize: 16,
  },
  
  listContent: {
    padding: 20,
    gap: 12,
  },
  
  conversationCard: {
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  
  agentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  
  agentEmoji: {
    fontSize: 20,
  },
  
  cardHeaderText: {
    flex: 1,
  },
  
  conversationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  
  timestamp: {
    fontSize: 12,
  },
  
  preview: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  messageCount: {
    fontSize: 12,
  },
  
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  
  emptyText: {
    fontSize: 16,
  },
});
