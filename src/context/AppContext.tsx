// src/context/AppContext.tsx
/**
 * App Context
 * 
 * Global application state management
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Message } from '../hooks/useConversation';

export interface Agent {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string;
  specialty: string;
}

export interface AppState {
  // User
  isOnboarded: boolean;
  userName: string | null;
  
  // Agents
  agents: Agent[];
  activeAgentId: string;
  favoriteAgentIds: string[];
  
  // Features
  voiceEnabled: boolean;
  offlineMode: boolean;
  notificationsEnabled: boolean;
  
  // UI
  showOnboarding: boolean;
}

interface AppContextType {
  state: AppState;
  setOnboarded: (value: boolean) => void;
  setUserName: (name: string) => void;
  setActiveAgent: (agentId: string) => void;
  toggleFavoriteAgent: (agentId: string) => void;
  setVoiceEnabled: (value: boolean) => void;
  setOfflineMode: (value: boolean) => void;
  setNotificationsEnabled: (value: boolean) => void;
  setShowOnboarding: (value: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultAgents: Agent[] = [
  {
    id: 'core',
    name: 'Core',
    emoji: '🤖',
    color: '#3B82F6',
    description: 'Your primary AI assistant',
    specialty: 'General AI',
  },
  {
    id: 'vision',
    name: 'Vision',
    emoji: '👁️',
    color: '#8B5CF6',
    description: 'Analyze images and visual content',
    specialty: 'Image Analysis',
  },
  {
    id: 'ocr',
    name: 'OCR',
    emoji: '📝',
    color: '#10B981',
    description: 'Read and extract text from images',
    specialty: 'Text Reader',
  },
  {
    id: 'creativity',
    name: 'Creativity',
    emoji: '🎨',
    color: '#EC4899',
    description: 'Creative writing and artistic ideas',
    specialty: 'Creative',
  },
  {
    id: 'alpha',
    name: 'Alpha',
    emoji: '📱',
    color: '#F59E0B',
    description: 'Media management and organization',
    specialty: 'Media',
  },
  {
    id: 'beta',
    name: 'Beta',
    emoji: '💬',
    color: '#14B8A6',
    description: 'Communication and messaging',
    specialty: 'Communication',
  },
  {
    id: 'gamma',
    name: 'Gamma',
    emoji: '💾',
    color: '#6366F1',
    description: 'Memory and information storage',
    specialty: 'Memory',
  },
  {
    id: 'delta',
    name: 'Delta',
    emoji: '❤️',
    color: '#EF4444',
    description: 'Emotional support and wellbeing',
    specialty: 'Emotional',
  },
  {
    id: 'interface',
    name: 'Interface',
    emoji: '🎯',
    color: '#8B5CF6',
    description: 'UI/UX design and interaction',
    specialty: 'Design',
  },
  {
    id: 'jow',
    name: 'Jow',
    emoji: '🎮',
    color: '#F97316',
    description: 'Entertainment and fun activities',
    specialty: 'Entertainment',
  },
];

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>({
    isOnboarded: false,
    userName: null,
    agents: defaultAgents,
    activeAgentId: 'core',
    favoriteAgentIds: [],
    voiceEnabled: true,
    offlineMode: false,
    notificationsEnabled: true,
    showOnboarding: true,
  });

  const setOnboarded = useCallback((value: boolean) => {
    setState(prev => ({ ...prev, isOnboarded: value }));
  }, []);

  const setUserName = useCallback((name: string) => {
    setState(prev => ({ ...prev, userName: name }));
  }, []);

  const setActiveAgent = useCallback((agentId: string) => {
    setState(prev => ({ ...prev, activeAgentId: agentId }));
  }, []);

  const toggleFavoriteAgent = useCallback((agentId: string) => {
    setState(prev => ({
      ...prev,
      favoriteAgentIds: prev.favoriteAgentIds.includes(agentId)
        ? prev.favoriteAgentIds.filter(id => id !== agentId)
        : [...prev.favoriteAgentIds, agentId],
    }));
  }, []);

  const setVoiceEnabled = useCallback((value: boolean) => {
    setState(prev => ({ ...prev, voiceEnabled: value }));
  }, []);

  const setOfflineMode = useCallback((value: boolean) => {
    setState(prev => ({ ...prev, offlineMode: value }));
  }, []);

  const setNotificationsEnabled = useCallback((value: boolean) => {
    setState(prev => ({ ...prev, notificationsEnabled: value }));
  }, []);

  const setShowOnboarding = useCallback((value: boolean) => {
    setState(prev => ({ ...prev, showOnboarding: value }));
  }, []);

  return (
    <AppContext.Provider
      value={{
        state,
        setOnboarded,
        setUserName,
        setActiveAgent,
        toggleFavoriteAgent,
        setVoiceEnabled,
        setOfflineMode,
        setNotificationsEnabled,
        setShowOnboarding,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
