// @ts-nocheck
/**
 * MotherChildConversation — GAN-Style Adversarial Learning
 *
 * Aria (Generator Teacher) ↔ Jow (Student Learner)
 * User acts as discriminator/judge
 *
 * Learning dynamics:
 *  1. Aria poses a teaching question
 *  2. Jow attempts to answer based on learned skills
 *  3. Aria provides correction/praise
 *  4. User rates the exchange quality
 *  5. Both update weights based on user feedback
 *
 * This creates adversarial pressure:
 *  - Jow tries to generate answers that fool Aria (look human-quality)
 *  - Aria tries to teach better (maximize Jow's learning)
 *  - User feedback is ground truth
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'mother_child_conversations_v1';

// Teaching topics categorized by difficulty
const TEACHING_TOPICS = {
  beginner: [
    { q: 'What should you say when someone helps you?', expectedSkills: ['greetings', 'empathy'] },
    { q: 'How do you greet someone in the morning?', expectedSkills: ['greetings'] },
    { q: 'What does it mean to be kind?', expectedSkills: ['empathy', 'concepts'] },
  ],
  intermediate: [
    { q: 'Why is it important to listen before speaking?', expectedSkills: ['empathy', 'reasoning'] },
    { q: 'How can you tell if someone is sad?', expectedSkills: ['empathy', 'concepts'] },
    { q: 'What should you do when you make a mistake?', expectedSkills: ['reasoning', 'empathy'] },
  ],
  advanced: [
    { q: 'Explain the difference between sympathy and empathy.', expectedSkills: ['concepts', 'explanations', 'reasoning'] },
    { q: 'Why do people have different opinions on the same topic?', expectedSkills: ['reasoning', 'concepts'] },
    { q: 'How can you help someone without making them feel small?', expectedSkills: ['empathy', 'reasoning', 'encouragement'] },
  ],
};

export class MotherChildConversation {
  constructor(ariaModel, jow) {
    this.aria = ariaModel;  // SelfLearningModel
    this.jow = jow;         // Jow instance
    
    this.conversationHistory = [];
    this.maxHistory = 50;
    
    // Adversarial metrics
    this.stats = {
      totalConversations: 0,
      jowSuccessRate:    0,   // How often Jow's answer is rated good
      ariaTeachingScore: 0,   // How effective is Aria's teaching
      userSatisfaction:  0,   // Overall rating
      fooledAria:        0,   // Times Jow generated answer Aria couldn't distinguish from human
    };
    
    // Current conversation state
    this.currentTopic = null;
    this.currentDifficulty = 'beginner';
    this.turnCount = 0;
    this.maxTurns = 10;
    
    // Callbacks
    this.onTurn      = null;  // ({ speaker, text, analysis })
    this.onComplete  = null;  // ({ summary, stats })
    this.onJudgment  = null;  // ({ rating, improvements })
  }

  // ── Start a conversation session ────────────────────────────────────────────

  async startConversation() {
    // Select difficulty based on Jow's maturity
    this.currentDifficulty = this._selectDifficulty();
    
    // Pick a topic Jow hasn't mastered yet
    this.currentTopic = this._selectTopic();
    
    this.turnCount = 0;
    this.conversationHistory = [];
    
    // Aria opens with teaching question
    const openingQuestion = this.currentTopic.q;
    
    this.conversationHistory.push({
      speaker: 'aria',
      text: openingQuestion,
      timestamp: Date.now(),
    });
    
    this.onTurn?.({
      speaker: 'aria',
      text: openingQuestion,
      analysis: { type: 'teaching_question', difficulty: this.currentDifficulty },
    });
    
    return { question: openingQuestion, topic: this.currentTopic };
  }

  // ── Jow attempts to answer ─────────────────────────────────────────────────

  async jowResponds() {
    if (!this.currentTopic) throw new Error('No active conversation');
    
    const question = this.conversationHistory[this.conversationHistory.length - 1].text;
    
    // Jow generates response based on learned skills
    const response = await this._generateJowResponse(question, this.currentTopic);
    
    this.conversationHistory.push({
      speaker: 'jow',
      text: response.text,
      confidence: response.confidence,
      skillsUsed: response.skillsUsed,
      timestamp: Date.now(),
    });
    
    this.turnCount++;
    
    this.onTurn?.({
      speaker: 'jow',
      text: response.text,
      analysis: {
        confidence: response.confidence,
        skillsUsed: response.skillsUsed,
        quality: response.quality,
      },
    });
    
    return response;
  }

  // ── Aria evaluates and responds ────────────────────────────────────────────

  async ariaEvaluates(jowResponse) {
    const evaluation = this._evaluateJowAnswer(jowResponse);
    
    // Aria's feedback (praise or correction)
    let feedback = '';
    
    if (evaluation.correct) {
      feedback = evaluation.quality > 0.8
        ? 'Excellent! You really understand this.'
        : 'Good! But let me add something...';
    } else {
      feedback = evaluation.quality > 0.5
        ? 'You\'re on the right track. Consider this...'
        : 'Not quite. Let me explain...';
    }
    
    // Aria adds teaching content
    const teachingContent = this._generateTeachingContent(evaluation);
    const fullResponse = `${feedback} ${teachingContent}`;
    
    this.conversationHistory.push({
      speaker: 'aria',
      text: fullResponse,
      evaluation,
      timestamp: Date.now(),
    });
    
    this.turnCount++;
    
    // Check if Jow "fooled" Aria (answer quality > Aria's threshold)
    const fooledAria = evaluation.quality > 0.85 && !evaluation.correct;
    if (fooledAria) this.stats.fooledAria++;
    
    this.onTurn?.({
      speaker: 'aria',
      text: fullResponse,
      analysis: {
        evaluation,
        fooledAria,
        teaching: true,
      },
    });
    
    return { feedback: fullResponse, evaluation, fooledAria };
  }

  // ── User judges the exchange ───────────────────────────────────────────────

  async userJudges(rating) {
    // rating: { jowQuality: 1-5, ariaTeaching: 1-5, overall: 1-5 }
    
    const lastJowTurn = this.conversationHistory
      .filter(t => t.speaker === 'jow')
      .slice(-1)[0];
    
    const lastAriaTurn = this.conversationHistory
      .filter(t => t.speaker === 'aria')
      .slice(-1)[0];
    
    // Update adversarial metrics
    const jowSuccess = rating.jowQuality >= 4;
    const ariaSuccess = rating.ariaTeaching >= 4;
    
    // Running averages
    const alpha = 0.1;
    this.stats.jowSuccessRate = (1 - alpha) * this.stats.jowSuccessRate
                              + alpha * (jowSuccess ? 1 : 0);
    
    this.stats.ariaTeachingScore = (1 - alpha) * this.stats.ariaTeachingScore
                                  + alpha * (rating.ariaTeaching / 5);
    
    this.stats.userSatisfaction = (1 - alpha) * this.stats.userSatisfaction
                                + alpha * (rating.overall / 5);
    
    // Distribute reward to both AIs
    const jowReward = rating.jowQuality / 5;
    const ariaReward = rating.ariaTeaching / 5;
    
    // Update Jow's skills
    if (lastJowTurn && lastJowTurn.skillsUsed) {
      for (const skill of lastJowTurn.skillsUsed) {
        const boost = jowReward * 5;
        this.jow.skills[skill] = Math.min(100,
          (this.jow.skills[skill] ?? 0) + boost
        );
      }
    }
    
    // Update Aria's self-awareness (becomes better teacher)
    if (this.aria.selfState) {
      this.aria.selfState.confidence = Math.min(1,
        this.aria.selfState.confidence + ariaReward * 0.05
      );
    }
    
    this.stats.totalConversations++;
    
    // Save to storage
    await this._saveConversation({ rating, jowReward, ariaReward });
    
    this.onJudgment?.({ rating, improvements: {
      jowSkillsGained: lastJowTurn?.skillsUsed ?? [],
      ariaTeachingImproved: ariaSuccess,
    }});
    
    return {
      jowReward,
      ariaReward,
      stats: { ...this.stats },
    };
  }

  // ── End conversation ───────────────────────────────────────────────────────

  endConversation() {
    const summary = {
      turns: this.turnCount,
      jowGrowth: this._calculateJowGrowth(),
      ariaEffectiveness: this.stats.ariaTeachingScore,
      fooledAriaCount: this.stats.fooledAria,
      topic: this.currentTopic,
    };
    
    this.onComplete?.(summary);
    
    this.currentTopic = null;
    this.turnCount = 0;
    
    return summary;
  }

  // ── Internal methods ───────────────────────────────────────────────────────

  _selectDifficulty() {
    const maturity = this.jow.state.maturity ?? 0;
    if (maturity < 30) return 'beginner';
    if (maturity < 70) return 'intermediate';
    return 'advanced';
  }

  _selectTopic() {
    const topics = TEACHING_TOPICS[this.currentDifficulty];
    
    // Find topics where Jow's skills are weakest
    const scoredTopics = topics.map(t => {
      const avgSkill = t.expectedSkills
        .reduce((sum, s) => sum + (this.jow.skills[s] ?? 0), 0)
        / t.expectedSkills.length;
      return { ...t, skillGap: 100 - avgSkill };
    });
    
    // Pick topic with highest skill gap
    scoredTopics.sort((a, b) => b.skillGap - a.skillGap);
    return scoredTopics[0];
  }

  async _generateJowResponse(question, topic) {
    // Check Jow's relevant skills
    const skillLevels = topic.expectedSkills.map(s => this.jow.skills[s] ?? 0);
    const avgSkill = skillLevels.reduce((a, b) => a + b, 0) / skillLevels.length;
    
    // Response quality based on skill level
    const confidence = avgSkill / 100;
    
    // Generate response (simplified — real version would use actual model)
    const responses = {
      beginner: [
        { text: 'Thank you!', quality: 0.9 },
        { text: 'Good morning!', quality: 0.9 },
        { text: 'Being nice to others.', quality: 0.7 },
      ],
      intermediate: [
        { text: 'Because you might learn something important.', quality: 0.8 },
        { text: 'When they look down or quiet.', quality: 0.7 },
        { text: 'Apologize and try to fix it.', quality: 0.85 },
      ],
      advanced: [
        { text: 'Sympathy is feeling sorry, empathy is understanding their feelings.', quality: 0.9 },
        { text: 'Because everyone has different experiences.', quality: 0.8 },
        { text: 'Offer help in a way that respects them.', quality: 0.85 },
      ],
    };
    
    const pool = responses[this.currentDifficulty] ?? responses.beginner;
    const selected = pool[Math.floor(Math.random() * pool.length)];
    
    // Quality varies with skill
    const quality = selected.quality * (0.5 + confidence * 0.5);
    
    return {
      text: selected.text,
      confidence,
      quality,
      skillsUsed: topic.expectedSkills,
    };
  }

  _evaluateJowAnswer(response) {
    // Aria's evaluation logic
    const { quality, skillsUsed, confidence } = response;
    
    return {
      correct: quality > 0.7,
      quality,
      skillsUsed,
      confidence,
      needsWork: skillsUsed.filter(s => (this.jow.skills[s] ?? 0) < 50),
      strengths: skillsUsed.filter(s => (this.jow.skills[s] ?? 0) >= 70),
    };
  }

  _generateTeachingContent(evaluation) {
    if (evaluation.correct && evaluation.quality > 0.8) {
      return 'You\'ve really grasped this concept!';
    }
    
    if (evaluation.needsWork.length > 0) {
      const skill = evaluation.needsWork[0];
      return `Let's work more on ${skill}. ${this._getSkillTip(skill)}`;
    }
    
    return 'Keep practicing, you\'re getting better!';
  }

  _getSkillTip(skill) {
    const tips = {
      empathy: 'Try to imagine how the other person feels.',
      reasoning: 'Think about why things happen, not just what happens.',
      greetings: 'A warm greeting makes people feel welcome.',
      concepts: 'Break big ideas into smaller pieces.',
      explanations: 'Use examples to make ideas clear.',
    };
    return tips[skill] ?? 'Practice makes progress!';
  }

  _calculateJowGrowth() {
    const beforeSkills = this.conversationHistory[0]?.skillSnapshot ?? {};
    const currentSkills = this.jow.skills;
    
    let totalGrowth = 0;
    for (const skill of this.currentTopic?.expectedSkills ?? []) {
      const before = beforeSkills[skill] ?? 0;
      const after = currentSkills[skill] ?? 0;
      totalGrowth += (after - before);
    }
    
    return totalGrowth;
  }

  async _saveConversation(metadata) {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      const history = saved ? JSON.parse(saved) : [];
      
      history.push({
        conversation: this.conversationHistory,
        metadata,
        timestamp: Date.now(),
      });
      
      // Keep last 20 conversations
      const trimmed = history.slice(-20);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch (e) {
      console.warn('[MotherChild] Save failed:', e);
    }
  }

  async loadStats() {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      
      const history = JSON.parse(saved);
      // Recompute stats from history
      // ... (aggregate logic)
    } catch (e) {
      console.warn('[MotherChild] Load failed:', e);
    }
  }

  getStats() {
    return { ...this.stats };
  }
}

export default MotherChildConversation;
