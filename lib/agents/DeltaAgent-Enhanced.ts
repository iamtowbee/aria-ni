// src/agents/DeltaAgent-Enhanced.js
/**
 * Enhanced DeltaAgent with Event Bus
 * 
 * Now emits events when emotion changes, allowing other agents
 * to react automatically.
 */

import { AgentEvents } from '../core/events/AgentBus';

export class DeltaAgentEnhanced {
  constructor(config = {}) {
    this.bus = config.bus; // Event bus
    this.smoothingFactor = config.smoothingFactor || 0.4;
    this.currentEmotion = { id: 'neutral', label: 'Neutral', intensity: 0 };
    this.emotionHistory = [];
    this.maxHistory = 10;

    // Emotion definitions (same as before)
    this.emotions = {
      neutral: { id: 'neutral', label: 'Neutral', keywords: [], color: '#888888' },
      happy: {
        id: 'happy',
        label: 'Happy',
        keywords: ['happy', 'joy', 'excited', 'great', 'wonderful', 'awesome', 'love'],
        color: '#FFD700',
      },
      sad: {
        id: 'sad',
        label: 'Sad',
        keywords: ['sad', 'depressed', 'down', 'unhappy', 'disappointed'],
        color: '#4169E1',
      },
      angry: {
        id: 'angry',
        label: 'Angry',
        keywords: ['angry', 'mad', 'furious', 'annoyed', 'frustrated'],
        color: '#DC143C',
      },
      anxious: {
        id: 'anxious',
        label: 'Anxious',
        keywords: ['anxious', 'worried', 'nervous', 'stressed', 'concerned'],
        color: '#9370DB',
      },
      excited: {
        id: 'excited',
        label: 'Excited',
        keywords: ['excited', 'thrilled', 'eager', 'pumped'],
        color: '#FF69B4',
      },
      tired: {
        id: 'tired',
        label: 'Tired',
        keywords: ['tired', 'exhausted', 'sleepy', 'fatigued'],
        color: '#696969',
      },
      curious: {
        id: 'curious',
        label: 'Curious',
        keywords: ['curious', 'interested', 'wonder', 'wondering'],
        color: '#20B2AA',
      },
      confused: {
        id: 'confused',
        label: 'Confused',
        keywords: ['confused', 'puzzled', 'unsure', 'lost'],
        color: '#DDA0DD',
      },
      grateful: {
        id: 'grateful',
        label: 'Grateful',
        keywords: ['grateful', 'thankful', 'appreciate', 'thanks'],
        color: '#90EE90',
      },
    };
  }

  analyse(text) {
    if (!text) {
      return {
        emotion: this.currentEmotion,
        intensity: 0,
        recommendation: 'Continue conversation naturally',
      };
    }

    const normalized = text.toLowerCase();
    const emotionScores = {};

    // Score each emotion
    Object.entries(this.emotions).forEach(([id, emotion]) => {
      let score = 0;
      emotion.keywords?.forEach(keyword => {
        if (normalized.includes(keyword)) {
          score += 1;
        }
      });
      emotionScores[id] = score;
    });

    // Find dominant emotion
    let dominantEmotion = 'neutral';
    let maxScore = 0;

    Object.entries(emotionScores).forEach(([id, score]) => {
      if (score > maxScore) {
        maxScore = score;
        dominantEmotion = id;
      }
    });

    // Calculate intensity (0-1)
    const intensity = Math.min(maxScore / 3, 1.0);

    // Apply smoothing with previous emotion
    const smoothedIntensity =
      this.smoothingFactor * this.currentEmotion.intensity +
      (1 - this.smoothingFactor) * intensity;

    // Update current emotion
    const newEmotion = {
      ...this.emotions[dominantEmotion],
      intensity: smoothedIntensity,
    };

    // Check if emotion changed significantly
    const emotionChanged = 
      this.currentEmotion.id !== newEmotion.id ||
      Math.abs(this.currentEmotion.intensity - newEmotion.intensity) > 0.3;

    if (emotionChanged && this.bus) {
      // Emit emotion change event
      this.bus.emit(AgentEvents.EMOTION_CHANGED, {
        emotion: newEmotion.id,
        intensity: newEmotion.intensity,
        previous: this.currentEmotion.id,
        color: newEmotion.color,
      });

      // If high intensity, emit special event
      if (newEmotion.intensity > 0.7) {
        this.bus.emit(AgentEvents.EMOTION_INTENSITY_HIGH, {
          emotion: newEmotion.id,
          intensity: newEmotion.intensity,
        });
      }
    }

    this.currentEmotion = newEmotion;

    // Add to history
    this.emotionHistory.push({
      emotion: newEmotion.id,
      intensity: smoothedIntensity,
      timestamp: Date.now(),
    });

    if (this.emotionHistory.length > this.maxHistory) {
      this.emotionHistory.shift();
    }

    // Generate recommendation
    const recommendation = this._getRecommendation(newEmotion);

    return {
      emotion: newEmotion,
      intensity: smoothedIntensity,
      recommendation,
    };
  }

  _getRecommendation(emotion) {
    const recommendations = {
      happy: 'Maintain positive energy',
      sad: 'Show empathy and support',
      angry: 'Stay calm and understanding',
      anxious: 'Be reassuring and patient',
      excited: 'Match their enthusiasm',
      tired: 'Keep responses brief and clear',
      curious: 'Provide detailed explanations',
      confused: 'Clarify and simplify',
      grateful: 'Accept thanks warmly',
      neutral: 'Continue conversation naturally',
    };

    return recommendations[emotion.id] || recommendations.neutral;
  }

  getCoreContext() {
    return {
      currentEmotion: this.currentEmotion.id,
      intensity: this.currentEmotion.intensity,
      recommendation: this._getRecommendation(this.currentEmotion),
      recentHistory: this.emotionHistory.slice(-3),
    };
  }

  reset() {
    this.currentEmotion = { id: 'neutral', label: 'Neutral', intensity: 0 };
    this.emotionHistory = [];
  }

  getEmotionHistory() {
    return [...this.emotionHistory];
  }

  getEmotionById(id) {
    return this.emotions[id] || this.emotions.neutral;
  }
}
