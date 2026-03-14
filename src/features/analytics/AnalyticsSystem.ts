// src/features/analytics/AnalyticsSystem.ts
/**
 * Analytics & Event Tracking System
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ==================== TYPES ====================

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: number;
  sessionId: string;
}

export interface UserProperties {
  userId?: string;
  subscriptionTier?: string;
  appVersion?: string;
  platform?: string;
  [key: string]: any;
}

// ==================== ANALYTICS ENGINE ====================

export class AnalyticsEngine {
  private sessionId: string;
  private userProperties: UserProperties = {};
  private eventQueue: AnalyticsEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.loadUserProperties();
    this.startAutoFlush();
  }

  // ==================== EVENT TRACKING ====================

  track(eventName: string, properties?: Record<string, any>): void {
    const event: AnalyticsEvent = {
      name: eventName,
      properties: {
        ...properties,
        ...this.userProperties,
      },
      timestamp: Date.now(),
      sessionId: this.sessionId,
    };

    this.eventQueue.push(event);

    if (__DEV__) {
      console.log('[Analytics]', eventName, properties);
    }

    // Flush if queue is large
    if (this.eventQueue.length >= 10) {
      this.flush();
    }
  }

  // ==================== USER PROPERTIES ====================

  setUserProperties(properties: UserProperties): void {
    this.userProperties = { ...this.userProperties, ...properties };
    this.saveUserProperties();
  }

  setUserId(userId: string): void {
    this.setUserProperties({ userId });
  }

  // ==================== COMMON EVENTS ====================

  trackScreenView(screenName: string): void {
    this.track('screen_view', { screen_name: screenName });
  }

  trackConversation(messageCount: number, duration: number): void {
    this.track('conversation', { message_count: messageCount, duration_ms: duration });
  }

  trackSubscription(tier: string, action: 'subscribe' | 'cancel' | 'upgrade'): void {
    this.track('subscription', { tier, action });
  }

  trackPurchase(itemId: string, price: number, category: string): void {
    this.track('purchase', { item_id: itemId, price, category });
  }

  trackFeatureUsed(featureName: string, context?: Record<string, any>): void {
    this.track('feature_used', { feature_name: featureName, ...context });
  }

  trackError(error: Error, context?: Record<string, any>): void {
    this.track('error', {
      error_message: error.message,
      error_stack: error.stack,
      ...context,
    });
  }

  trackPerformance(metric: string, value: number, unit: string = 'ms'): void {
    this.track('performance', { metric, value, unit });
  }

  // ==================== SESSION MANAGEMENT ====================

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  startNewSession(): void {
    this.sessionId = this.generateSessionId();
    this.track('session_start');
  }

  endSession(): void {
    this.track('session_end');
    this.flush();
  }

  // ==================== STORAGE ====================

  private async loadUserProperties(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('@user_properties');
      if (stored) {
        this.userProperties = JSON.parse(stored);
      }
    } catch (error) {
      console.error('[Analytics] Failed to load user properties:', error);
    }
  }

  private async saveUserProperties(): Promise<void> {
    try {
      await AsyncStorage.setItem('@user_properties', JSON.stringify(this.userProperties));
    } catch (error) {
      console.error('[Analytics] Failed to save user properties:', error);
    }
  }

  // ==================== FLUSHING ====================

  private startAutoFlush(): void {
    this.flushInterval = setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.flush();
      }
    }, 30000); // Flush every 30 seconds
  }

  private async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // Store locally for now (can be sent to analytics service later)
      const stored = await AsyncStorage.getItem('@analytics_events');
      const existingEvents = stored ? JSON.parse(stored) : [];
      const allEvents = [...existingEvents, ...events];
      
      // Keep only last 1000 events
      const recentEvents = allEvents.slice(-1000);
      await AsyncStorage.setItem('@analytics_events', JSON.stringify(recentEvents));

      if (__DEV__) {
        console.log(`[Analytics] Flushed ${events.length} events`);
      }
    } catch (error) {
      console.error('[Analytics] Failed to flush events:', error);
      // Put events back in queue
      this.eventQueue.unshift(...events);
    }
  }

  // ==================== CLEANUP ====================

  dispose(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flush();
  }
}

// ==================== SINGLETON ====================

export const analytics = new AnalyticsEngine();

// ==================== REACT HOOKS ====================

export function useAnalytics() {
  return {
    track: analytics.track.bind(analytics),
    trackScreenView: analytics.trackScreenView.bind(analytics),
    trackConversation: analytics.trackConversation.bind(analytics),
    trackSubscription: analytics.trackSubscription.bind(analytics),
    trackPurchase: analytics.trackPurchase.bind(analytics),
    trackFeatureUsed: analytics.trackFeatureUsed.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
    trackPerformance: analytics.trackPerformance.bind(analytics),
    setUserProperties: analytics.setUserProperties.bind(analytics),
    setUserId: analytics.setUserId.bind(analytics),
  };
}

// ==================== EXPORTS ====================

declare const __DEV__: boolean;
