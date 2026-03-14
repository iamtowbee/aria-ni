// src/services/VoiceCommands.js
/**
 * Voice Commands System
 * 
 * Supports hands-free control with wake word + commands:
 * - "Hey Nova" - Start listening
 * - "Send it" - Send message
 * - "Start over" - Clear conversation
 * - "Read that" - Speak last message
 * - "Summarize" - Summarize conversation
 * - "Switch to creative mode" - Change mode
 * 
 * Uses expo-speech for recognition with pattern matching
 */

import * as Speech from 'expo-speech';

export class VoiceCommands {
  constructor(ecosystem) {
    this.ecosystem = ecosystem;
    this.isListening = false;
    this.wakeWordActive = false;
    
    // Command patterns
    this.commands = {
      // Wake word
      wakeWord: {
        patterns: ['hey nova', 'ok nova', 'nova'],
        action: 'wake',
        description: 'Activate voice control',
      },
      
      // Message control
      send: {
        patterns: ['send it', 'send message', 'send that'],
        action: 'send',
        description: 'Send current message',
      },
      
      cancel: {
        patterns: ['cancel', 'nevermind', 'forget it'],
        action: 'cancel',
        description: 'Cancel current action',
      },
      
      // Conversation control
      startOver: {
        patterns: ['start over', 'new conversation', 'clear chat'],
        action: 'startOver',
        description: 'Start new conversation',
      },
      
      readLast: {
        patterns: ['read that', 'read it', 'say that again'],
        action: 'readLast',
        description: 'Read last message',
      },
      
      summarize: {
        patterns: ['summarize', 'give me a summary', 'what did we talk about'],
        action: 'summarize',
        description: 'Summarize conversation',
      },
      
      // Mode switching
      creativeMode: {
        patterns: ['creative mode', 'switch to creative', 'be creative'],
        action: 'modeCreative',
        description: 'Switch to creative mode',
      },
      
      focusMode: {
        patterns: ['focus mode', 'switch to focus', 'help me focus'],
        action: 'modeFocus',
        description: 'Switch to focus mode',
      },
      
      // App control
      showSettings: {
        patterns: ['show settings', 'open settings', 'settings'],
        action: 'settings',
        description: 'Open settings',
      },
      
      help: {
        patterns: ['help', 'what can you do', 'commands'],
        action: 'help',
        description: 'Show available commands',
      },
    };

    // Callbacks
    this.onCommand = null;
    this.onWakeWord = null;
    this.onListeningChange = null;
  }

  /**
   * Start listening for wake word
   */
  async startWakeWordDetection() {
    if (this.isListening) return;

    console.log('[VoiceCommands] Starting wake word detection...');
    this.isListening = true;
    this.wakeWordActive = false;

    if (this.onListeningChange) {
      this.onListeningChange(true, false);
    }

    // Start continuous listening
    await this._listenContinuously();
  }

  /**
   * Stop listening
   */
  async stop() {
    console.log('[VoiceCommands] Stopping...');
    this.isListening = false;
    this.wakeWordActive = false;

    if (this.onListeningChange) {
      this.onListeningChange(false, false);
    }

    await this.ecosystem.beta.stopListening();
  }

  /**
   * Process voice input and detect commands
   */
  async processVoiceInput(transcript) {
    if (!transcript) return null;

    const normalized = transcript.toLowerCase().trim();
    console.log('[VoiceCommands] Processing:', normalized);

    // Check for wake word first
    if (!this.wakeWordActive) {
      const wakeWord = this._detectWakeWord(normalized);
      if (wakeWord) {
        this.wakeWordActive = true;
        console.log('[VoiceCommands] Wake word detected!');
        
        if (this.onWakeWord) {
          await this.onWakeWord();
        }

        if (this.onListeningChange) {
          this.onListeningChange(true, true);
        }

        // Speak confirmation
        Speech.speak('Yes?', { language: 'en-US', rate: 1.1 });
        
        return { type: 'wake', command: 'wake' };
      }
      
      // No wake word, ignore
      return null;
    }

    // Wake word active, process command
    const command = this._detectCommand(normalized);
    
    if (command) {
      console.log('[VoiceCommands] Command detected:', command.action);
      
      // Execute command
      const result = await this._executeCommand(command, normalized);
      
      // Deactivate wake word after command
      this.wakeWordActive = false;
      
      if (this.onListeningChange) {
        this.onListeningChange(true, false);
      }

      return result;
    } else {
      // Not a command, treat as regular message
      this.wakeWordActive = false;
      
      if (this.onListeningChange) {
        this.onListeningChange(true, false);
      }

      return {
        type: 'message',
        text: transcript,
      };
    }
  }

  /**
   * Get all available commands
   */
  getCommands() {
    return Object.entries(this.commands).map(([key, cmd]) => ({
      key,
      patterns: cmd.patterns,
      description: cmd.description,
    }));
  }

  /**
   * Detect wake word in transcript
   */
  _detectWakeWord(normalized) {
    const wakeCmd = this.commands.wakeWord;
    return wakeCmd.patterns.some(pattern => normalized.includes(pattern));
  }

  /**
   * Detect command in transcript
   */
  _detectCommand(normalized) {
    for (const [key, cmd] of Object.entries(this.commands)) {
      if (key === 'wakeWord') continue;
      
      const matched = cmd.patterns.some(pattern => 
        normalized.includes(pattern)
      );
      
      if (matched) {
        return cmd;
      }
    }
    
    return null;
  }

  /**
   * Execute command action
   */
  async _executeCommand(command, transcript) {
    const action = command.action;

    switch (action) {
      case 'send':
        if (this.onCommand) {
          await this.onCommand('send', {});
        }
        Speech.speak('Sending', { language: 'en-US' });
        break;

      case 'cancel':
        if (this.onCommand) {
          await this.onCommand('cancel', {});
        }
        Speech.speak('Cancelled', { language: 'en-US' });
        break;

      case 'startOver':
        await this.ecosystem.clearMemories();
        if (this.onCommand) {
          await this.onCommand('startOver', {});
        }
        Speech.speak('Starting new conversation', { language: 'en-US' });
        break;

      case 'readLast':
        if (this.onCommand) {
          const lastMessage = await this.onCommand('readLast', {});
          if (lastMessage) {
            await this.ecosystem.speak(lastMessage);
          }
        }
        break;

      case 'summarize':
        const summary = await this._generateSummary();
        if (summary) {
          await this.ecosystem.speak(summary);
        }
        break;

      case 'modeCreative':
      case 'modeFocus':
        const mode = action === 'modeCreative' ? 'creative' : 'focus';
        if (this.onCommand) {
          await this.onCommand('changeMode', { mode });
        }
        Speech.speak(`Switching to ${mode} mode`, { language: 'en-US' });
        break;

      case 'settings':
        if (this.onCommand) {
          await this.onCommand('settings', {});
        }
        Speech.speak('Opening settings', { language: 'en-US' });
        break;

      case 'help':
        await this._speakHelp();
        break;

      default:
        Speech.speak('Command not recognized', { language: 'en-US' });
    }

    return {
      type: 'command',
      command: action,
      transcript,
    };
  }

  /**
   * Generate conversation summary
   */
  async _generateSummary() {
    try {
      const memories = await this.ecosystem.getRecentMemories(10);
      
      if (memories.length === 0) {
        return 'No conversation to summarize';
      }

      const topics = new Set();
      memories.forEach(m => {
        const words = m.content.toLowerCase().split(/\s+/);
        words.forEach(w => {
          if (w.length > 5) topics.add(w);
        });
      });

      const topicList = Array.from(topics).slice(0, 5).join(', ');
      return `We discussed ${topicList}. ${memories.length} messages total.`;
    } catch (err) {
      console.error('[VoiceCommands] Summary error:', err);
      return 'Unable to generate summary';
    }
  }

  /**
   * Speak help information
   */
  async _speakHelp() {
    const helpText = 'Available commands: Send it. Start over. Read that. Summarize. Creative mode. Focus mode. Settings. Help.';
    await Speech.speak(helpText, { language: 'en-US', rate: 0.9 });
  }

  /**
   * Continuous listening loop
   */
  async _listenContinuously() {
    while (this.isListening) {
      try {
        // Listen for voice input
        await this.ecosystem.beta.startListening({
          onResult: async (transcript, isFinal) => {
            if (isFinal) {
              await this.processVoiceInput(transcript);
            }
          },
        });

        // Wait a bit before next listen
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err) {
        console.error('[VoiceCommands] Listen error:', err);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
}

/**
 * Usage:
 * 
 * const voiceCommands = new VoiceCommands(ecosystem);
 * 
 * voiceCommands.onCommand = async (action, data) => {
 *   switch (action) {
 *     case 'send': sendMessage(); break;
 *     case 'startOver': clearChat(); break;
 *     // etc
 *   }
 * };
 * 
 * voiceCommands.onWakeWord = async () => {
 *   // Show visual feedback
 * };
 * 
 * await voiceCommands.startWakeWordDetection();
 */
