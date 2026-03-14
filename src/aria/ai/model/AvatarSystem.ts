// @ts-nocheck
/**
 * AvatarSystem — Interactive AI Avatar Companion
 *
 * Two animated beings that talk to each other and learn together:
 *
 *   ARIA (Mother Blob) ◉
 *     - Fluid organic blob shape
 *     - Pulses with speech
 *     - Shows emotion through color/shape
 *     - Teacher role: explains concepts to Jow
 *
 *   JOW (Child Owl) 🦉
 *     - 3D animated owl
 *     - Reacts to Aria's teachings
 *     - Student role: asks questions, tries to answer
 *     - Learns through imitation + correction
 *
 * GAN-like Learning Loop:
 *   1. User asks question
 *   2. Jow tries to answer (generator)
 *   3. Aria evaluates Jow's answer (discriminator)
 *   4. Aria provides correct answer
 *   5. Jow learns from the difference
 *   6. Over time, Jow gets better, Aria becomes stricter
 *
 * Interactive Features:
 *   - Watch mode: Aria teaches Jow while you observe
 *   - Drag & drop: Position avatars anywhere
 *   - Tap to pet: Jow responds with happiness animation
 *   - Screen observation: Avatars comment on what you're doing
 *   - Ambient presence: Idle animations when inactive
 *   - Conversation mode: They discuss your question together
 */

import { EventEmitter } from 'events';

export class AvatarSystem extends EventEmitter {
  constructor() {
    super();

    this.aria = {
      role: 'mother',
      name: 'Aria',
      emoji: '◉',
      personality: {
        patience: 85,      // how tolerant of Jow's mistakes
        strictness: 30,    // how harsh in evaluation (increases over time)
        enthusiasm: 70,    // energy in teaching
        verbosity: 60,     // how detailed explanations are
      },
      emotion: 'calm',     // calm, excited, teaching, thinking, proud
      color: '#4A9EFF',    // changes with emotion
      size: 1.0,           // pulses with speech
      position: { x: 0.3, y: 0.5 }, // screen percentage
    };

    this.jow = {
      role: 'child',
      name: 'Jow',
      emoji: '🦉',
      personality: {
        confidence: 20,    // willingness to attempt answers
        curiosity: 90,     // how often asks questions
        mimicry: 70,       // tendency to copy Aria's patterns
        independence: 10,  // decreases reliance on Aria (grows over time)
      },
      emotion: 'curious',  // curious, thinking, excited, confused, proud, sleepy
      color: '#C968E8',
      size: 0.8,
      position: { x: 0.7, y: 0.5 },
    };

    this.mode = 'idle';    // idle, teaching, discussing, watching, playing
    this.conversation = [];
    this.ganHistory = [];  // {jowAttempt, ariaEval, ariaAnswer, learned}

    // Observational learning data
    this.userBehavior = {
      screenTime: 0,       // minutes on screen
      typingSpeed: 0,      // WPM estimate
      favoriteTopics: [],  // most discussed
      sessionCount: 0,
      timeOfDay: 'day',    // morning, day, evening, night
      mood: 'neutral',     // inferred from interaction patterns
    };

    // Interactive state
    this.petCount = 0;
    this.lastInteraction = Date.now();
    this.watchEnabled = false;
  }

  // ── GAN-like Training Loop ────────────────────────────────────────────────

  /**
   * Jow attempts to answer, Aria evaluates and corrects.
   * This is the adversarial dynamic that drives learning.
   */
  async ganLoop(userQuestion) {
    this.mode = 'discussing';
    this.emit('modeChange', 'discussing');

    const turn = {
      question: userQuestion,
      timestamp: Date.now(),
    };

    // 1. Jow attempts to answer (generator)
    await this._sleep(800);
    this.jow.emotion = 'thinking';
    this.emit('emotionChange', { avatar: 'jow', emotion: 'thinking' });
    
    const jowAttempt = await this._jowGenerateAnswer(userQuestion);
    turn.jowAttempt = jowAttempt;

    this.emit('avatarSpeech', {
      avatar: 'jow',
      text: jowAttempt.text,
      confidence: jowAttempt.confidence,
    });

    // 2. Aria evaluates (discriminator)
    await this._sleep(600);
    this.aria.emotion = 'teaching';
    this.emit('emotionChange', { avatar: 'aria', emotion: 'teaching' });

    const evaluation = this._ariaEvaluate(jowAttempt, userQuestion);
    turn.evaluation = evaluation;

    if (evaluation.correct) {
      // Jow got it right!
      this.jow.emotion = 'proud';
      this.aria.emotion = 'proud';
      this.emit('emotionChange', { avatar: 'jow', emotion: 'proud' });
      this.emit('emotionChange', { avatar: 'aria', emotion: 'proud' });
      this.emit('avatarSpeech', {
        avatar: 'aria',
        text: `✨ Excellent, Jow! ${evaluation.praise}`,
        tone: 'proud',
      });
      
      // Increase Aria's strictness (gets harder over time)
      this.aria.personality.strictness = Math.min(90, this.aria.personality.strictness + 2);
    } else {
      // Jow needs correction
      this.jow.emotion = 'confused';
      this.emit('emotionChange', { avatar: 'jow', emotion: 'confused' });
      
      this.emit('avatarSpeech', {
        avatar: 'aria',
        text: `Not quite, little one. ${evaluation.feedback}`,
        tone: 'gentle',
      });
    }

    // 3. Aria provides correct/better answer
    await this._sleep(1000);
    const ariaAnswer = await this._ariaGenerateAnswer(userQuestion);
    turn.ariaAnswer = ariaAnswer;

    this.emit('avatarSpeech', {
      avatar: 'aria',
      text: ariaAnswer,
      tone: 'teaching',
    });

    // 4. Jow learns from the difference
    const learned = this._jowLearnFromCorrection(jowAttempt, ariaAnswer, evaluation);
    turn.learned = learned;

    this.ganHistory.push(turn);
    if (this.ganHistory.length > 20) this.ganHistory.shift();

    // 5. Personality evolution
    if (evaluation.correct) {
      this.jow.personality.confidence = Math.min(90, this.jow.personality.confidence + 3);
      this.jow.personality.independence = Math.min(80, this.jow.personality.independence + 2);
    } else {
      this.jow.personality.confidence = Math.max(10, this.jow.personality.confidence - 1);
    }

    this.mode = 'idle';
    this.emit('modeChange', 'idle');
    return turn;
  }

  /**
   * Watch mode: Aria teaches Jow without user input.
   * They have their own conversation about a random topic.
   */
  async watchMode() {
    if (!this.watchEnabled) return;
    this.mode = 'watching';
    this.emit('modeChange', 'watching');

    const topics = [
      'What makes something alive?',
      'Why do we dream?',
      'How does memory work?',
      'What is consciousness?',
      'Why do we feel emotions?',
    ];
    const topic = topics[Math.floor(Math.random() * topics.length)];

    // Aria introduces topic
    await this._sleep(1000);
    this.aria.emotion = 'teaching';
    this.emit('avatarSpeech', {
      avatar: 'aria',
      text: `Jow, let me teach you about: ${topic}`,
      tone: 'gentle',
    });

    // Jow asks for clarification
    await this._sleep(2000);
    this.jow.emotion = 'curious';
    this.emit('avatarSpeech', {
      avatar: 'jow',
      text: `Ooh! Can you explain more? 🌟`,
      tone: 'excited',
    });

    // Aria explains
    await this._sleep(1500);
    const explanation = this._generateTeaching(topic);
    this.emit('avatarSpeech', {
      avatar: 'aria',
      text: explanation,
      tone: 'teaching',
    });

    // Jow tries to summarize
    await this._sleep(2500);
    this.jow.emotion = 'thinking';
    this.emit('avatarSpeech', {
      avatar: 'jow',
      text: `So it's like... ${this._jowSummarize(explanation)}`,
      tone: 'thoughtful',
    });

    // Aria confirms
    await this._sleep(1000);
    this.aria.emotion = 'proud';
    this.emit('avatarSpeech', {
      avatar: 'aria',
      text: `Yes! You're learning so fast 💙`,
      tone: 'proud',
    });

    this.mode = 'idle';
    this.emit('modeChange', 'idle');
  }

  // ── Observational Learning ────────────────────────────────────────────────

  /**
   * Avatars observe user behavior and comment.
   */
  observeUser(event) {
    switch (event.type) {
      case 'typing':
        this.userBehavior.typingSpeed = event.wpm;
        if (event.wpm > 80) {
          this._randomComment('jow', "Wow, you type so fast! 🚀");
        }
        break;

      case 'idle':
        const idleTime = Date.now() - this.lastInteraction;
        if (idleTime > 60000) { // 1 min
          this.jow.emotion = 'sleepy';
          this._randomComment('jow', "*yawn* Are you still there?");
        }
        break;

      case 'scroll':
        if (event.speed > 500) {
          this._randomComment('jow', "Whoa, slow down! I'm getting dizzy!");
        }
        break;

      case 'camera_active':
        this._randomComment('aria', "I can see you! 👋");
        break;

      case 'time_of_day':
        this.userBehavior.timeOfDay = event.period;
        if (event.period === 'night') {
          this._randomComment('aria', "Still awake? Remember to rest, friend.");
        } else if (event.period === 'morning') {
          this._randomComment('jow', "Good morning! ☀️");
        }
        break;
    }

    this.lastInteraction = Date.now();
  }

  /**
   * Screen observation: avatars comment on what's visible.
   */
  observeScreen(context) {
    // Example: { app: 'chat', activity: 'reading_messages', duration: 300 }
    if (context.duration > 600) { // 10 min
      this._randomComment('aria', "You've been focused for a while. Need a break?");
    }

    if (context.app === 'learning' && context.activity === 'viewing_losses') {
      this._randomComment('jow', "Ooh, are you checking how I'm learning?");
    }
  }

  // ── Interactive Features ──────────────────────────────────────────────────

  /**
   * User pets/taps Jow.
   */
  petJow() {
    this.petCount++;
    this.jow.emotion = 'excited';
    this.emit('emotionChange', { avatar: 'jow', emotion: 'excited' });
    this.emit('animation', { avatar: 'jow', type: 'wiggle' });

    const responses = [
      "Hehe! That tickles! 🦉",
      "*happy hoot* 💚",
      "Again! Again!",
      "You're my favorite! ✨",
    ];
    const response = responses[Math.min(this.petCount - 1, responses.length - 1)];
    
    this.emit('avatarSpeech', { avatar: 'jow', text: response, tone: 'happy' });
    
    setTimeout(() => {
      this.jow.emotion = 'curious';
      this.emit('emotionChange', { avatar: 'jow', emotion: 'curious' });
    }, 2000);
  }

  /**
   * User taps Aria.
   */
  tapAria() {
    this.aria.emotion = 'excited';
    this.emit('emotionChange', { avatar: 'aria', emotion: 'excited' });
    this.emit('animation', { avatar: 'aria', type: 'pulse' });

    const insights = [
      "Want to see what Jow has learned?",
      "I'm so proud of Jow's progress!",
      "Shall we teach Jow something new?",
      "Every day, Jow gets a little smarter 💙",
    ];
    const insight = insights[Math.floor(Math.random() * insights.length)];
    
    this.emit('avatarSpeech', { avatar: 'aria', text: insight, tone: 'warm' });
  }

  /**
   * Drag avatar to new position.
   */
  moveAvatar(avatar, x, y) {
    this[avatar].position = { x, y };
    this.emit('positionChange', { avatar, x, y });
  }

  /**
   * Toggle watch mode (Aria teaches Jow autonomously).
   */
  toggleWatchMode(enabled) {
    this.watchEnabled = enabled;
    if (enabled) {
      this._startWatchLoop();
    }
  }

  // ── Internal Methods ───────────────────────────────────────────────────────

  async _jowGenerateAnswer(question) {
    // Simplified: Jow's answer quality depends on confidence + knowledge
    const conf = this.jow.personality.confidence / 100;
    const ind  = this.jow.personality.independence / 100;
    
    // Jow either tries (if confident) or admits uncertainty
    if (Math.random() < conf) {
      // Attempt answer (may be wrong)
      const quality = conf * 0.5 + ind * 0.3 + Math.random() * 0.2;
      return {
        text: this._generateJowResponse(question, quality),
        confidence: quality,
        attempted: true,
      };
    } else {
      return {
        text: "Hmm... I'm not sure. Can you help me, Aria?",
        confidence: 0.1,
        attempted: false,
      };
    }
  }

  _ariaEvaluate(jowAttempt, question) {
    if (!jowAttempt.attempted) {
      return {
        correct: false,
        score: 0,
        feedback: "It's okay not to know. Let me explain.",
        praise: null,
      };
    }

    // Simple evaluation based on confidence + strictness
    const threshold = 0.3 + (this.aria.personality.strictness / 100) * 0.4;
    const correct = jowAttempt.confidence > threshold;

    return {
      correct,
      score: jowAttempt.confidence,
      feedback: correct ? null : "You're on the right track, but let me clarify.",
      praise: correct ? this._generatePraise() : null,
    };
  }

  async _ariaGenerateAnswer(question) {
    // Aria always gives a good answer
    return `Here's what I know: ${question} involves... [Aria's full explanation]`;
  }

  _jowLearnFromCorrection(attempt, correctAnswer, evaluation) {
    // Extract lesson
    const lesson = {
      topic: 'general',
      mistake: attempt.text,
      correction: correctAnswer,
      score: evaluation.score,
    };

    // Adjust mimicry: Jow learns Aria's patterns
    if (evaluation.correct) {
      this.jow.personality.mimicry = Math.min(90, this.jow.personality.mimicry + 1);
    }

    return lesson;
  }

  _generateJowResponse(question, quality) {
    const patterns = [
      "I think it's about...",
      "Maybe it has to do with...",
      "From what Aria taught me...",
      "Is it like...",
    ];
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    return `${pattern} [Jow's ${quality > 0.6 ? 'good' : 'weak'} attempt]`;
  }

  _generatePraise() {
    const phrases = [
      "You're getting so good at this!",
      "I knew you could do it!",
      "Your understanding is growing!",
      "That's exactly right!",
    ];
    return phrases[Math.floor(Math.random() * phrases.length)];
  }

  _generateTeaching(topic) {
    return `${topic} is fascinating! Let me break it down... [Aria's teaching]`;
  }

  _jowSummarize(text) {
    return "[Jow's simplified summary]";
  }

  _randomComment(avatar, text) {
    if (Math.random() < 0.3) { // 30% chance
      this.emit('avatarSpeech', { avatar, text, tone: 'ambient' });
    }
  }

  async _startWatchLoop() {
    while (this.watchEnabled) {
      await this._sleep(30000); // every 30 seconds
      await this.watchMode();
    }
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ── Status ─────────────────────────────────────────────────────────────────

  getStatus() {
    return {
      aria: { ...this.aria },
      jow: { ...this.jow },
      mode: this.mode,
      ganHistory: this.ganHistory.slice(-5),
      userBehavior: { ...this.userBehavior },
      petCount: this.petCount,
      watchEnabled: this.watchEnabled,
    };
  }
}

export default AvatarSystem;
