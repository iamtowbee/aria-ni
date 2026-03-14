// src/features/voice/VoiceCommandSystem.ts
/**
 * Voice Command System
 * 
 * Advanced voice control with:
 * - Wake word detection
 * - Natural language commands
 * - Multi-language support
 * - Custom command registration
 * - Voice shortcuts
 * - Hands-free operation
 */

import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface VoiceCommand {
  id: string;
  trigger: string[];
  action: string;
  category: 'navigation' | 'agent' | 'feature' | 'system' | 'custom';
  description: string;
  parameters?: string[];
}

export interface VoiceCommandResult {
  recognized: boolean;
  command?: VoiceCommand;
  confidence: number;
  parameters?: Record<string, any>;
  timestamp: number;
}

/**
 * VoiceCommandSystem
 * 
 * Enables hands-free voice control of the entire app
 */
export class VoiceCommandSystem {
  private commands: Map<string, VoiceCommand> = new Map();
  private isListening: boolean = false;
  private wakeWord: string = 'hey aria';
  private language: string = 'en-US';
  private commandHistory: VoiceCommandResult[] = [];
  private readonly MAX_HISTORY = 50;

  constructor() {
    this.initializeDefaultCommands();
  }

  /**
   * Initialize built-in commands
   */
  private initializeDefaultCommands(): void {
    const defaultCommands: VoiceCommand[] = [
      // Navigation
      {
        id: 'nav_home',
        trigger: ['go home', 'show home', 'home screen'],
        action: 'navigate_home',
        category: 'navigation',
        description: 'Navigate to home screen',
      },
      {
        id: 'nav_settings',
        trigger: ['open settings', 'show settings', 'settings'],
        action: 'navigate_settings',
        category: 'navigation',
        description: 'Open settings screen',
      },
      {
        id: 'nav_shop',
        trigger: ['open shop', 'show shop', 'go to shop'],
        action: 'navigate_shop',
        category: 'navigation',
        description: 'Navigate to shop',
      },

      // Agent Control
      {
        id: 'agent_vision',
        trigger: ['activate vision', 'use vision', 'vision mode'],
        action: 'activate_agent_vision',
        category: 'agent',
        description: 'Activate vision agent',
      },
      {
        id: 'agent_creativity',
        trigger: ['be creative', 'creative mode', 'activate creativity'],
        action: 'activate_agent_creativity',
        category: 'agent',
        description: 'Activate creativity agent',
      },
      {
        id: 'agent_ocr',
        trigger: ['read text', 'scan text', 'ocr mode'],
        action: 'activate_agent_ocr',
        category: 'agent',
        description: 'Activate OCR agent',
      },

      // Features
      {
        id: 'feature_camera',
        trigger: ['take photo', 'open camera', 'capture image'],
        action: 'open_camera',
        category: 'feature',
        description: 'Open camera',
      },
      {
        id: 'feature_export',
        trigger: ['export conversation', 'save chat', 'export chat'],
        action: 'export_conversation',
        category: 'feature',
        description: 'Export current conversation',
      },
      {
        id: 'feature_theme_dark',
        trigger: ['dark mode', 'switch to dark', 'enable dark theme'],
        action: 'set_theme_dark',
        category: 'feature',
        description: 'Switch to dark theme',
      },
      {
        id: 'feature_theme_light',
        trigger: ['light mode', 'switch to light', 'enable light theme'],
        action: 'set_theme_light',
        category: 'feature',
        description: 'Switch to light theme',
      },

      // System
      {
        id: 'sys_clear',
        trigger: ['clear chat', 'new conversation', 'start over'],
        action: 'clear_conversation',
        category: 'system',
        description: 'Clear current conversation',
      },
      {
        id: 'sys_help',
        trigger: ['help', 'what can you do', 'show commands'],
        action: 'show_help',
        category: 'system',
        description: 'Show available commands',
      },
      {
        id: 'sys_repeat',
        trigger: ['repeat', 'say again', 'what did you say'],
        action: 'repeat_last',
        category: 'system',
        description: 'Repeat last response',
      },
    ];

    defaultCommands.forEach(cmd => {
      this.commands.set(cmd.id, cmd);
    });
  }

  /**
   * Register a custom voice command
   */
  registerCommand(command: VoiceCommand): void {
    this.commands.set(command.id, command);
    console.log(`[VoiceCommand] Registered: ${command.id}`);
  }

  /**
   * Remove a command
   */
  unregisterCommand(commandId: string): void {
    this.commands.delete(commandId);
    console.log(`[VoiceCommand] Unregistered: ${commandId}`);
  }

  /**
   * Process spoken text and match to command
   */
  processVoiceInput(spokenText: string): VoiceCommandResult {
    const lowerText = spokenText.toLowerCase().trim();
    const timestamp = Date.now();

    // Check for wake word
    if (!this.checkWakeWord(lowerText)) {
      return {
        recognized: false,
        confidence: 0,
        timestamp,
      };
    }

    // Remove wake word from text
    const commandText = this.removeWakeWord(lowerText);

    // Find matching command
    for (const [id, command] of this.commands) {
      for (const trigger of command.trigger) {
        if (commandText.includes(trigger.toLowerCase())) {
          const result: VoiceCommandResult = {
            recognized: true,
            command,
            confidence: this.calculateConfidence(commandText, trigger),
            parameters: this.extractParameters(commandText, command),
            timestamp,
          };

          this.addToHistory(result);
          return result;
        }
      }
    }

    return {
      recognized: false,
      confidence: 0,
      timestamp,
    };
  }

  /**
   * Check if wake word is present
   */
  private checkWakeWord(text: string): boolean {
    return text.includes(this.wakeWord.toLowerCase());
  }

  /**
   * Remove wake word from text
   */
  private removeWakeWord(text: string): string {
    return text.replace(this.wakeWord.toLowerCase(), '').trim();
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(text: string, trigger: string): number {
    const words = text.split(' ');
    const triggerWords = trigger.split(' ');
    
    const matchCount = triggerWords.filter(word => 
      text.includes(word)
    ).length;

    return matchCount / triggerWords.length;
  }

  /**
   * Extract parameters from command
   */
  private extractParameters(
    text: string,
    command: VoiceCommand
  ): Record<string, any> {
    const params: Record<string, any> = {};

    if (!command.parameters) {
      return params;
    }

    // Extract named entities, numbers, etc.
    // This is a simple implementation - can be enhanced
    const numbers = text.match(/\d+/g);
    if (numbers && command.parameters.includes('number')) {
      params.number = parseInt(numbers[0]);
    }

    return params;
  }

  /**
   * Add command to history
   */
  private addToHistory(result: VoiceCommandResult): void {
    this.commandHistory.push(result);

    if (this.commandHistory.length > this.MAX_HISTORY) {
      this.commandHistory.shift();
    }
  }

  /**
   * Get all available commands
   */
  getAllCommands(): VoiceCommand[] {
    return Array.from(this.commands.values());
  }

  /**
   * Get commands by category
   */
  getCommandsByCategory(category: VoiceCommand['category']): VoiceCommand[] {
    return this.getAllCommands().filter(cmd => cmd.category === category);
  }

  /**
   * Get command history
   */
  getHistory(limit: number = 10): VoiceCommandResult[] {
    return this.commandHistory.slice(-limit);
  }

  /**
   * Clear command history
   */
  clearHistory(): void {
    this.commandHistory = [];
  }

  /**
   * Set wake word
   */
  setWakeWord(wakeWord: string): void {
    this.wakeWord = wakeWord;
  }

  /**
   * Set language
   */
  setLanguage(language: string): void {
    this.language = language;
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalCommands: number;
    categoryCounts: Record<string, number>;
    recentUsage: number;
  } {
    const categoryCounts: Record<string, number> = {};

    this.getAllCommands().forEach(cmd => {
      categoryCounts[cmd.category] = (categoryCounts[cmd.category] || 0) + 1;
    });

    const recentUsage = this.commandHistory.filter(
      h => Date.now() - h.timestamp < 3600000 // Last hour
    ).length;

    return {
      totalCommands: this.commands.size,
      categoryCounts,
      recentUsage,
    };
  }

  /**
   * Save settings
   */
  async saveSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem('voice_commands_settings', JSON.stringify({
        wakeWord: this.wakeWord,
        language: this.language,
        customCommands: Array.from(this.commands.values()).filter(
          cmd => cmd.category === 'custom'
        ),
      }));
    } catch (error) {
      console.error('[VoiceCommand] Save failed:', error);
    }
  }

  /**
   * Load settings
   */
  async loadSettings(): Promise<void> {
    try {
      const saved = await AsyncStorage.getItem('voice_commands_settings');
      if (saved) {
        const settings = JSON.parse(saved);
        this.wakeWord = settings.wakeWord || this.wakeWord;
        this.language = settings.language || this.language;
        
        // Restore custom commands
        if (settings.customCommands) {
          settings.customCommands.forEach((cmd: VoiceCommand) => {
            this.registerCommand(cmd);
          });
        }
      }
    } catch (error) {
      console.error('[VoiceCommand] Load failed:', error);
    }
  }
}

// Singleton instance
export const voiceCommandSystem = new VoiceCommandSystem();
