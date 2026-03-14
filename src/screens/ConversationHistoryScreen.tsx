// src/screens/ConversationHistoryScreen.tsx
/**
 * Conversation History Screen
 * 
 * Browse and search past conversations:
 * - List of all conversations
 * - Search and filter
 * - Agent filtering
 * - Conversation preview
 * - Delete/archive
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

interface Conversation {
  id: string;
  title: string;
  preview: string;
  agentId: string;
  agentName: string;
  agentColor: string;
  agentEmoji: string;
  messageCount: number;
  lastMessageAt: number;
  createdAt: number;
}

export interface ConversationHistoryScreenProps {
  onSelectConversation: (conversationId: string) => void;
  onBack: () => void;
}

// Sample data
const sampleConversations: Conversation[] = [
  {
    id: '1',
    title: 'Image Analysis Help',
    preview: 'Can you analyze this sunset photo?',
    agentId: 'vision',
    agentName: 'Vision',
    agentColor: '#8B5CF6',
    agentEmoji: '👁️',
    messageCount: 12,
    lastMessageAt: Date.now() - 1000 * 60 * 30, // 30 min ago
    createdAt: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
  },
  {
    id: '2',
    title: 'Story Writing Session',
    preview: 'Help me write a sci-fi short story',
    agentId: 'creativity',
    agentName: 'Creativity',
    agentColor: '#EC4899',
    agentEmoji: '🎨',
    messageCount: 25,
    lastMessageAt: Date.now() - 1000 * 60 * 60 * 5, // 5 hours ago
    createdAt: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
  },
  {
    id: '3',
    title: 'OCR Document Scan',
    preview: 'Read text from this receipt',
    agentId: 'ocr',
    agentName: 'OCR',
    agentColor: '#10B981',
    agentEmoji: '📝',
    messageCount: 3,
    lastMessageAt: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
    createdAt: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
  },
];

export const ConversationHistoryScreen: React.FC<ConversationHistoryScreenProps> = ({
  onSelectConversation,
  onBack,
}) => {
  const { colors, tokens } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [conversations] = useState(sampleConversations);

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

  const filteredConversations = conversations.filter(conv => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!conv.title.toLowerCase().includes(query) &&
          !conv.preview.toLowerCase().includes(query)) {
        return false;
      }
    }
    
    // Agent filter
    if (selectedFilter && conv.agentId !== selectedFilter) {
      return false;
    }
    
    return true;
  });

  const agentFilters = [
    { id: 'vision', name: 'Vision', emoji: '👁️', color: '#8B5CF6' },
    { id: 'creativity', name: 'Creative', emoji: '🎨', color: '#EC4899' },
    { id: 'ocr', name: 'OCR', emoji: '📝', color: '#10B981' },
  ];

  const handleDelete = (conversationId: string) => {
    Alert.alert(
      'Delete Conversation',
      'Are you sure you want to delete this conversation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => console.log('Delete:', conversationId),
        },
      ]
    );
  };

  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={[styles.conversationCard, { backgroundColor: colors.surface }]}
      onPress={() => onSelectConversation(item.id)}
      onLongPress={() => handleDelete(item.id)}
    >
      <View style={styles.cardHeader}>
        {/* Agent Avatar */}
        <View style={[styles.agentAvatar, { backgroundColor: item.agentColor }]}>
          <Text style={styles.agentEmoji}>{item.agentEmoji}</Text>
        </View>

        {/* Title and Time */}
        <View style={styles.cardHeaderText}>
          <Text style={[styles.conversationTitle, { color: colors.text.primary }]}>
            {item.title}
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
        {item.preview}
      </Text>

      {/* Footer */}
      <View style={styles.cardFooter}>
        <View style={[styles.badge, { backgroundColor: colors.surfaceVariant }]}>
          <Text style={[styles.badgeText, { color: item.agentColor }]}>
            {item.agentName}
          </Text>
        </View>
        
        <Text style={[styles.messageCount, { color: colors.text.tertiary }]}>
          {item.messageCount} messages
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={[styles.backIcon, { color: colors.text.primary }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          Conversations
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

      {/* Filter Chips */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={[
            styles.filterChip,
            {
              backgroundColor: !selectedFilter ? colors.primary : colors.surface,
              borderColor: colors.border.main,
            },
          ]}
          onPress={() => setSelectedFilter(null)}
        >
          <Text
            style={[
              styles.filterText,
              { color: !selectedFilter ? '#FFFFFF' : colors.text.primary },
            ]}
          >
            All
          </Text>
        </TouchableOpacity>

        {agentFilters.map(filter => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterChip,
              {
                backgroundColor: selectedFilter === filter.id ? filter.color : colors.surface,
                borderColor: colors.border.main,
              },
            ]}
            onPress={() => setSelectedFilter(filter.id)}
          >
            <Text style={styles.filterEmoji}>{filter.emoji}</Text>
            <Text
              style={[
                styles.filterText,
                { color: selectedFilter === filter.id ? '#FFFFFF' : colors.text.primary },
              ]}
            >
              {filter.name}
            </Text>
          </TouchableOpacity>
        ))}
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
  
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  
  filterEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  
  filterText: {
    fontSize: 14,
    fontWeight: '600',
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
