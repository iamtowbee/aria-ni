// src/AppCoordinator.tsx
/**
 * App Coordinator
 * 
 * Central orchestration layer that connects:
 * - UI Components
 * - AI Agents
 * - Navigation
 * - State Management
 * - Services (Voice, Offline, Notifications)
 */

import React, { useState, useEffect, createContext, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import Agents
import { CoreAgent } from './agents/CoreAgent';
import { VisionAgent } from './agents/VisionAgent';
import { OCRAgent } from './agents/OCRAgent';
import { CreativityAgent } from './agents/CreativityAgent';
import { AlphaAgent } from './agents/AlphaAgent';
import { BetaAgent } from './agents/BetaAgent';
import { GammaAgent } from './agents/GammaAgent';
import { DeltaAgent } from './agents/DeltaAgent';

// Import Services
import { voiceCommandSystem } from './features/voice/VoiceCommandSystem';
import { offlineMode } from './features/offline/OfflineMode';
import { smartNotifications } from './features/notifications/SmartNotifications';
import { conversationSharing } from './features/collaboration/ConversationSharing';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  agentId: string;
  timestamp: number;
  reactions?: string[];
}

interface Conversation {
  id: string;
  messages: Message[];
  agentId: string;
  createdAt: number;
  lastMessageAt: number;
}

interface AppState {
  // Active state
  activeAgent: string;
  currentConversationId: string | null;
  isOnline: boolean;
  
  // Agents
  agents: Map<string, any>;
  
  // Conversations
  conversations: Map<string, Conversation>;
  
  // Methods
  sendMessage: (text: string) => Promise<void>;
  switchAgent: (agentId: string) => void;
  createConversation: () => string;
  loadConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  
  // Voice
  startVoiceInput: () => void;
  stopVoiceInput: () => void;
  isRecording: boolean;
  
  // Offline
  syncData: () => Promise<void>;
  
  // Notifications
  scheduleNotification: (title: string, body: string, delay: number) => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppCoordinator');
  }
  return context;
};

export const AppCoordinator: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize agents
  const [agents] = useState(() => {
    const agentMap = new Map();
    agentMap.set('core', new CoreAgent());
    agentMap.set('vision', new VisionAgent());
    agentMap.set('ocr', new OCRAgent());
    agentMap.set('creativity', new CreativityAgent());
    agentMap.set('alpha', new AlphaAgent());
    agentMap.set('beta', new BetaAgent());
    agentMap.set('gamma', new GammaAgent());
    agentMap.set('delta', new DeltaAgent());
    return agentMap;
  });

  // State
  const [activeAgent, setActiveAgent] = useState('core');
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Map<string, Conversation>>(new Map());
  const [isOnline, setIsOnline] = useState(true);
  const [isRecording, setIsRecording] = useState(false);

  // Initialize services
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    // Load saved conversations
    await loadConversations();
    
    // Initialize offline mode
    await offlineMode.loadCache();
    await offlineMode.loadSyncQueue();
    
    // Initialize notifications
    await smartNotifications.loadPreferences();
    const hasPermission = await smartNotifications.requestPermissions();
    
    // Listen to network status
    const unsubscribe = offlineMode.addListener((online) => {
      setIsOnline(online);
      if (online) {
        offlineMode.processSyncQueue();
      }
    });

    // Register voice commands
    registerVoiceCommands();

    return () => unsubscribe();
  };

  const registerVoiceCommands = () => {
    // Agent switching commands
    agents.forEach((agent, id) => {
      voiceCommandSystem.registerCommand({
        id: `switch_${id}`,
        trigger: [`switch to ${id}`, `use ${id} agent`],
        action: `switch_agent_${id}`,
        category: 'agent',
        description: `Switch to ${id} agent`,
      });
    });

    // Process voice commands
    voiceCommandSystem.getAllCommands().forEach(cmd => {
      if (cmd.action.startsWith('switch_agent_')) {
        const agentId = cmd.action.replace('switch_agent_', '');
        cmd.onPress = () => switchAgent(agentId);
      }
    });
  };

  const createConversation = (): string => {
    const id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const conversation: Conversation = {
      id,
      messages: [],
      agentId: activeAgent,
      createdAt: Date.now(),
      lastMessageAt: Date.now(),
    };
    
    setConversations(prev => new Map(prev).set(id, conversation));
    setCurrentConversationId(id);
    
    return id;
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    // Get or create conversation
    let convId = currentConversationId;
    if (!convId) {
      convId = createConversation();
    }

    const conversation = conversations.get(convId);
    if (!conversation) return;

    // Add user message
    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      text: text.trim(),
      isUser: true,
      agentId: activeAgent,
      timestamp: Date.now(),
    };

    conversation.messages.push(userMessage);
    conversation.lastMessageAt = Date.now();
    
    setConversations(new Map(conversations));

    // Store offline if needed
    if (!isOnline) {
      await offlineMode.addMessage(convId, {
        role: 'user',
        content: userMessage.text,
      });
    }

    // Get agent response
    try {
      const agent = agents.get(activeAgent);
      if (!agent) throw new Error('Agent not found');

      // Process with agent (simplified - in production, use actual agent methods)
      const response = await processWithAgent(agent, text, conversation.messages);

      // Add assistant message
      const assistantMessage: Message = {
        id: `msg_${Date.now() + 1}`,
        text: response,
        isUser: false,
        agentId: activeAgent,
        timestamp: Date.now(),
      };

      conversation.messages.push(assistantMessage);
      conversation.lastMessageAt = Date.now();
      
      setConversations(new Map(conversations));

      // Store offline if needed
      if (!isOnline) {
        await offlineMode.addMessage(convId, {
          role: 'assistant',
          content: assistantMessage.text,
        });
      }

      // Save conversations
      await saveConversations();

      // Send notification if in background
      await smartNotifications.notifyAgentResponse(
        activeAgent,
        response.substring(0, 100)
      );

    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const processWithAgent = async (
    agent: any,
    message: string,
    history: Message[]
  ): Promise<string> => {
    // This is a simplified version - in production, use actual agent methods
    // Each agent has different capabilities (chat, analyzeImage, extractText, etc.)
    
    // Check agent type and call appropriate method
    if (agent.chat) {
      return await agent.chat(message);
    }
    
    // Fallback
    return `I'm ${activeAgent} agent. You said: "${message}". This is a simulated response.`;
  };

  const switchAgent = (agentId: string) => {
    if (agents.has(agentId)) {
      setActiveAgent(agentId);
      
      // Optionally create new conversation when switching agents
      // createConversation();
    }
  };

  const loadConversation = (id: string) => {
    setCurrentConversationId(id);
  };

  const deleteConversation = async (id: string) => {
    const newConversations = new Map(conversations);
    newConversations.delete(id);
    setConversations(newConversations);
    
    if (currentConversationId === id) {
      setCurrentConversationId(null);
    }
    
    await saveConversations();
  };

  const loadConversations = async () => {
    try {
      const saved = await AsyncStorage.getItem('conversations');
      if (saved) {
        const data = JSON.parse(saved);
        setConversations(new Map(Object.entries(data)));
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const saveConversations = async () => {
    try {
      const data = Object.fromEntries(conversations);
      await AsyncStorage.setItem('conversations', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving conversations:', error);
    }
  };

  const startVoiceInput = () => {
    setIsRecording(true);
    // In production, start actual voice recording
  };

  const stopVoiceInput = () => {
    setIsRecording(false);
    // In production, stop recording and transcribe
  };

  const syncData = async () => {
    await offlineMode.processSyncQueue();
  };

  const scheduleNotification = async (title: string, body: string, delay: number) => {
    await smartNotifications.sendNotification({
      title,
      body,
      category: 'system',
      priority: 'normal',
      scheduledFor: Date.now() + delay,
    });
  };

  const value: AppState = {
    activeAgent,
    currentConversationId,
    isOnline,
    agents,
    conversations,
    sendMessage,
    switchAgent,
    createConversation,
    loadConversation,
    deleteConversation,
    startVoiceInput,
    stopVoiceInput,
    isRecording,
    syncData,
    scheduleNotification,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
