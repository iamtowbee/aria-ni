// src/core/events/AgentBus.js
/**
 * Agent Communication Protocol
 * 
 * Allows agents to communicate directly with each other,
 * enabling emergent behaviors and coordinated responses.
 * 
 * Examples:
 * - DeltaAgent detects stress → BetaAgent adjusts voice tone
 * - GammaAgent recalls important memory → CoreAgent emphasizes it
 * - InterfaceAgent changes theme → All agents adjust behavior
 * 
 * Architecture: Pub/Sub pattern with typed events
 */

export class AgentBus {
  constructor() {
    this.subscribers = new Map(); // event → [handlers]
    this.eventHistory = []; // For debugging
    this.maxHistory = 100;
  }

  /**
   * Subscribe to events
   * 
   * @param {string} event - Event name
   * @param {Function} handler - Callback(payload)
   * @returns {Function} Unsubscribe function
   */
  on(event, handler) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, []);
    }
    
    this.subscribers.get(event).push(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.subscribers.get(event);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  /**
   * Emit event to all subscribers
   * 
   * @param {string} event - Event name
   * @param {Object} payload - Event data
   */
  async emit(event, payload = {}) {
    const timestamp = Date.now();
    
    // Record event in history
    this.eventHistory.push({
      event,
      payload,
      timestamp,
    });

    // Trim history if too long
    if (this.eventHistory.length > this.maxHistory) {
      this.eventHistory.shift();
    }

    // Get subscribers
    const handlers = this.subscribers.get(event) || [];
    
    if (handlers.length === 0) {
      console.log(`[AgentBus] No subscribers for '${event}'`);
      return;
    }

    console.log(`[AgentBus] Emitting '${event}' to ${handlers.length} subscribers`);

    // Call all handlers
    const results = await Promise.allSettled(
      handlers.map(handler => handler(payload))
    );

    // Log any errors
    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        console.error(`[AgentBus] Handler ${i} failed for '${event}':`, result.reason);
      }
    });
  }

  /**
   * Remove all subscribers for an event
   */
  off(event) {
    this.subscribers.delete(event);
  }

  /**
   * Get event history for debugging
   */
  getHistory(limit = 10) {
    return this.eventHistory.slice(-limit);
  }

  /**
   * Clear event history
   */
  clearHistory() {
    this.eventHistory = [];
  }

  /**
   * Get all registered events
   */
  getEvents() {
    return Array.from(this.subscribers.keys());
  }

  /**
   * Get subscriber count for event
   */
  getSubscriberCount(event) {
    return (this.subscribers.get(event) || []).length;
  }
}

/**
 * Pre-defined event types
 */
export const AgentEvents = {
  // Emotion events
  EMOTION_CHANGED: 'emotion:changed',
  EMOTION_INTENSITY_HIGH: 'emotion:intensity:high',
  
  // Memory events
  MEMORY_STORED: 'memory:stored',
  MEMORY_RECALLED: 'memory:recalled',
  MEMORY_IMPORTANT: 'memory:important',
  
  // Voice events
  SPEECH_STARTED: 'speech:started',
  SPEECH_ENDED: 'speech:ended',
  LISTENING_STARTED: 'listening:started',
  LISTENING_ENDED: 'listening:ended',
  
  // UI events
  THEME_CHANGED: 'ui:theme:changed',
  AVATAR_STATE_CHANGED: 'ui:avatar:changed',
  
  // Inference events
  GENERATION_STARTED: 'inference:started',
  GENERATION_COMPLETED: 'inference:completed',
  GENERATION_FAILED: 'inference:failed',
  
  // Context events
  CONTEXT_COMPRESSED: 'context:compressed',
  CONTEXT_EXPANDED: 'context:expanded',
  
  // Agent coordination
  TASK_DELEGATED: 'agent:task:delegated',
  TASK_COMPLETED: 'agent:task:completed',
  AGENT_ERROR: 'agent:error',
};

/**
 * Example Usage:
 * 
 * // In DeltaAgent
 * bus.emit(AgentEvents.EMOTION_CHANGED, {
 *   emotion: 'stressed',
 *   intensity: 0.8
 * });
 * 
 * // In BetaAgent
 * bus.on(AgentEvents.EMOTION_CHANGED, (payload) => {
 *   if (payload.emotion === 'stressed') {
 *     this.setVoice({ pitch: 0.9, speed: 0.85, tone: 'calm' });
 *   }
 * });
 * 
 * // In InterfaceAgent
 * bus.on(AgentEvents.EMOTION_CHANGED, (payload) => {
 *   this.setAvatarColor(this.getEmotionColor(payload.emotion));
 * });
 */
