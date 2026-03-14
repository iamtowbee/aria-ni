// src/components/SplitScreenView.jsx
/**
 * Split-Screen Mode
 * 
 * Shows chat + reference panel side-by-side:
 * - Chat Panel: Normal conversation
 * - Reference Panel: 
 *   - Memory context
 *   - Web search results
 *   - Code documentation
 *   - Previous conversations
 *   - Image analysis details
 * 
 * Use cases:
 * - Research with AI assistant
 * - Coding with documentation
 * - Writing with references
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export const SplitScreenView = ({
  chatPanel,
  onReferenceTypeChange,
}) => {
  const [showReference, setShowReference] = useState(false);
  const [referenceType, setReferenceType] = useState('memory');
  const [referenceData, setReferenceData] = useState([]);
  
  const panelWidth = useSharedValue(showReference ? width * 0.5 : width);

  const toggleReference = () => {
    setShowReference(!showReference);
    panelWidth.value = withSpring(!showReference ? width * 0.5 : width);
  };

  const changeReferenceType = (type) => {
    setReferenceType(type);
    if (onReferenceTypeChange) {
      onReferenceTypeChange(type);
    }
  };

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx) => {
      ctx.startWidth = panelWidth.value;
    },
    onActive: (event, ctx) => {
      const newWidth = ctx.startWidth + event.translationX;
      panelWidth.value = Math.max(width * 0.3, Math.min(width * 0.7, newWidth));
    },
  });

  const chatPanelStyle = useAnimatedStyle(() => ({
    width: panelWidth.value,
  }));

  const referencePanelStyle = useAnimatedStyle(() => ({
    width: width - panelWidth.value,
  }));

  return (
    <View style={styles.container}>
      {/* Chat Panel */}
      <Animated.View style={[styles.chatPanel, chatPanelStyle]}>
        {chatPanel}
        
        {/* Toggle Button */}
        {!showReference && (
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={toggleReference}
          >
            <Text style={styles.toggleButtonText}>📚</Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Divider (draggable) */}
      {showReference && (
        <PanGestureHandler onGestureEvent={gestureHandler}>
          <Animated.View style={styles.divider} />
        </PanGestureHandler>
      )}

      {/* Reference Panel */}
      {showReference && (
        <Animated.View style={[styles.referencePanel, referencePanelStyle]}>
          <ReferencePanel
            type={referenceType}
            data={referenceData}
            onClose={() => toggleReference()}
            onTypeChange={changeReferenceType}
          />
        </Animated.View>
      )}
    </View>
  );
};

const ReferencePanel = ({ type, data, onClose, onTypeChange }) => {
  const types = [
    { id: 'memory', label: '🧠 Memory', icon: '🧠' },
    { id: 'search', label: '🔍 Search', icon: '🔍' },
    { id: 'docs', label: '📖 Docs', icon: '📖' },
    { id: 'history', label: '📜 History', icon: '📜' },
  ];

  return (
    <View style={styles.referencePanelContent}>
      {/* Header */}
      <View style={styles.referenceHeader}>
        <Text style={styles.referenceTitle}>Reference</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Type Selector */}
      <ScrollView
        horizontal
        style={styles.typeSelectorScroll}
        showsHorizontalScrollIndicator={false}
      >
        {types.map(t => (
          <TouchableOpacity
            key={t.id}
            style={[
              styles.typeButton,
              type === t.id && styles.typeButtonActive,
            ]}
            onPress={() => onTypeChange(t.id)}
          >
            <Text style={styles.typeIcon}>{t.icon}</Text>
            <Text
              style={[
                styles.typeLabel,
                type === t.id && styles.typeLabelActive,
              ]}
            >
              {t.label.split(' ')[1]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView style={styles.referenceContent}>
        <ReferenceContent type={type} data={data} />
      </ScrollView>
    </View>
  );
};

const ReferenceContent = ({ type, data }) => {
  switch (type) {
    case 'memory':
      return <MemoryView data={data} />;
    case 'search':
      return <SearchView data={data} />;
    case 'docs':
      return <DocsView data={data} />;
    case 'history':
      return <HistoryView data={data} />;
    default:
      return <EmptyView />;
  }
};

const MemoryView = ({ data }) => (
  <View style={styles.contentView}>
    <Text style={styles.contentTitle}>Conversation Context</Text>
    {data && data.length > 0 ? (
      data.map((item, index) => (
        <View key={index} style={styles.memoryItem}>
          <Text style={styles.memoryText}>{item.content}</Text>
          <Text style={styles.memoryMeta}>
            {item.importance} • {new Date(item.timestamp).toLocaleString()}
          </Text>
        </View>
      ))
    ) : (
      <Text style={styles.emptyText}>No memories yet</Text>
    )}
  </View>
);

const SearchView = ({ data }) => (
  <View style={styles.contentView}>
    <Text style={styles.contentTitle}>Search Results</Text>
    <Text style={styles.emptyText}>
      Web search results will appear here
    </Text>
  </View>
);

const DocsView = ({ data }) => (
  <View style={styles.contentView}>
    <Text style={styles.contentTitle}>Documentation</Text>
    <Text style={styles.emptyText}>
      Code documentation will appear here
    </Text>
  </View>
);

const HistoryView = ({ data }) => (
  <View style={styles.contentView}>
    <Text style={styles.contentTitle}>Previous Conversations</Text>
    <Text style={styles.emptyText}>
      Past conversations will appear here
    </Text>
  </View>
);

const EmptyView = () => (
  <View style={styles.contentView}>
    <Text style={styles.emptyText}>Select a reference type</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#1A1A2E',
  },
  chatPanel: {
    backgroundColor: '#1A1A2E',
  },
  divider: {
    width: 4,
    backgroundColor: '#6C63FF',
    cursor: 'col-resize',
  },
  referencePanel: {
    backgroundColor: '#16213E',
    borderLeftWidth: 1,
    borderLeftColor: '#6C63FF',
  },
  referencePanelContent: {
    flex: 1,
  },
  referenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#6C63FF',
  },
  referenceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EAEAEA',
  },
  closeButton: {
    fontSize: 24,
    color: '#EAEAEA',
  },
  typeSelectorScroll: {
    maxHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#6C63FF',
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    paddingHorizontal: 15,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: '#1A1A2E',
  },
  typeButtonActive: {
    backgroundColor: '#6C63FF',
  },
  typeIcon: {
    fontSize: 20,
    marginRight: 5,
  },
  typeLabel: {
    fontSize: 14,
    color: '#888',
  },
  typeLabelActive: {
    color: '#EAEAEA',
    fontWeight: 'bold',
  },
  referenceContent: {
    flex: 1,
    padding: 15,
  },
  contentView: {
    flex: 1,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#EAEAEA',
    marginBottom: 15,
  },
  memoryItem: {
    backgroundColor: '#1A1A2E',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  memoryText: {
    fontSize: 14,
    color: '#EAEAEA',
    marginBottom: 5,
  },
  memoryMeta: {
    fontSize: 11,
    color: '#888',
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 40,
  },
  toggleButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  toggleButtonText: {
    fontSize: 24,
  },
});

/**
 * Usage:
 * 
 * <SplitScreenView
 *   chatPanel={<ChatScreen ecosystem={ecosystem} />}
 *   onReferenceTypeChange={(type) => {
 *     // Load data for reference type
 *   }}
 * />
 */
