// src/integration/EcosystemProvider.tsx
/**
 * Ecosystem Provider
 * 
 * React Context provider that wraps EcosystemBridge
 * Makes ecosystem accessible to all UI components
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { EcosystemBridge, AgentMessage, AgentResponse } from './EcosystemBridge';
import { AIEcosystem } from '../AIEcosystem';

interface EcosystemContextValue {
  // State
  activeAgent: string;
  messages: AgentMessage[];
  isProcessing: boolean;
  
  // Actions
  sendMessage: (text: string, images?: string[]) => Promise<void>;
  switchAgent: (agentId: string) => void;
  clearMessages: () => void;
  
  // Agents
  availableAgents: any[];
  
  // Raw bridge access if needed
  bridge: EcosystemBridge | null;
}

const EcosystemContext = createContext<EcosystemContextValue | null>(null);

export const useEcosystem = () => {
  const context = useContext(EcosystemContext);
  if (!context) {
    throw new Error('useEcosystem must be used within EcosystemProvider');
  }
  return context;
};

interface EcosystemProviderProps {
  ecosystem: AIEcosystem;
  children: React.ReactNode;
}

export const EcosystemProvider: React.FC<EcosystemProviderProps> = ({
  ecosystem,
  children,
}) => {
  const [bridge] = useState(() => new EcosystemBridge(ecosystem));
  const [activeAgent, setActiveAgent] = useState('core');
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Subscribe to messages from bridge
  useEffect(() => {
    const unsubscribe = bridge.onMessage((message) => {
      setMessages(prev => [...prev, message]);
    });

    return unsubscribe;
  }, [bridge]);

  // Send message
  const sendMessage = useCallback(async (text: string, images?: string[]) => {
    if (!text.trim() || isProcessing) return;

    setIsProcessing(true);

    try {
      await bridge.sendMessage(text, {
        agentId: activeAgent,
        images,
      });
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage: AgentMessage = {
        id: `msg_${Date.now()}`,
        text: `Sorry, I encountered an error: ${error.message}`,
        isUser: false,
        agentId: activeAgent,
        timestamp: Date.now(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  }, [bridge, activeAgent, isProcessing]);

  // Switch agent
  const switchAgent = useCallback((agentId: string) => {
    setActiveAgent(agentId);
    bridge.setActiveAgent(agentId);
  }, [bridge]);

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
    bridge.clearHistory();
  }, [bridge]);

  const value: EcosystemContextValue = {
    activeAgent,
    messages,
    isProcessing,
    sendMessage,
    switchAgent,
    clearMessages,
    availableAgents: bridge.getAgents(),
    bridge,
  };

  return (
    <EcosystemContext.Provider value={value}>
      {children}
    </EcosystemContext.Provider>
  );
};
