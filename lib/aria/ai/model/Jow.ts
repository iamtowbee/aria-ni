/**
 * Jow — Child AI Learning Engine
 *
 * A simplified AI that learns by observing its parent (Aria).
 * Designed for non-technical users to understand ML concepts.
 *
 * Learning model:
 *   - Mimicry: copies patterns from Aria's responses
 *   - Curiosity: asks questions when uncertain
 *   - Growth: skill tree that visually shows what it's learned
 *   - Personality: develops unique traits based on user interactions
 *
 * Parent-child relationship:
 *   Aria (mother blob) → stores experiences in memory
 *   Jow (owl) → reads those memories and learns patterns
 *   User → guides both with feedback
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'jow_learning_state_v1';

// Skill tree — visual representation of what Jow has learned
const SKILL_TREE = {
  language: {
    name: 'Language',
    icon: '📝',
    skills: ['greetings', 'questions', 'stories', 'jokes', 'explanations'],
  },
  memory: {
    name: 'Memory',
    icon: '🧠',
    skills: ['recall', 'associations', 'context', 'importance'],
  },
  emotion: {
    name: 'Emotion',
    icon: '💚',
    skills: ['empathy', 'enthusiasm', 'curiosity', 'encouragement'],
  },
  knowledge: {
    name: 'Knowledge',
    icon: '📚',
    skills: ['facts', 'concepts', 'procedures', 'reasoning'],
  },
};

export class Jow {
  constructor(options = {}) {
    this.name = 'Jow';
    this.age  = 0; // increments with learning sessions

    // Learning state (simplified for non-devs)
    this.state = {
      energy:      100,  // 0–100: how eager to learn
      confidence:  20,   // 0–100: how sure of its answers
      curiosity:   80,   // 0–100: how much it asks questions
      maturity:    0,    // 0–100: overall growth level
    };

    // Skill progress (each 0–100)
    this.skills = {};
    for (const [category, data] of Object.entries(SKILL_TREE)) {
      for (const skill of data.skills) {
        this.skills[skill] = 0;
      }
    }

    // Learning history (user-friendly summaries)
    this.lessons = [];  // { type, content, timestamp, learned }
    this.maxLessons = 50;

    // Personality traits (develop over time)
    this.personality = {
      playfulness:  50,  // 0–100
      seriousness:  30,
      helpfulness:  70,
      independence: 20,
    };

    // Parent references
    this.parentModel    = null;  // SelfLearningModel (Aria)
    this.parentMemories = null;  // VectorStore

    // Callbacks
    this.onLearn      = null;  // ({ skill, progress, lesson })
    this.onGrowth     = null;  // ({ age, maturity, newSkill })
    this.onQuestion   = null;  // ({ question, context })
    this.onCelebrate  = null;  // ({ achievement })
  }

  // ── Connection to parent ──────────────────────────────────────────────────

  /**
   * Connect Jow to its parent AI (Aria).
   * Jow will observe Aria's behavior and learn from it.
   */
  connectToParent(ariaModel, ariaMemories) {
    this.parentModel    = ariaModel;
    this.parentMemories = ariaMemories;
  }

  // ── Learning from parent ─────────────────────────────────────────────────

  /**
   * Watch a conversation turn and learn from how Aria responded.
   * This is the main learning loop.
   */
  async observeTurn(userInput, ariaResponse, ariaConfidence) {
    if (!this.parentModel) return { skipped: 'no_parent' };

    // Reduce energy (learning is work!)
    this.state.energy = Math.max(0, this.state.energy - 2);

    // Analyze what happened
    const lesson = this._analyzeTurn(userInput, ariaResponse, ariaConfidence);

    // Update skills based on lesson
    const learned = this._updateSkills(lesson);

    // Increase age and maturity
    this.age++;
    this.state.maturity = Math.min(100, this.age / 5); // ~500 turns to full maturity

    // Adjust personality based on interaction patterns
    this._evolvePersonality(lesson);

    // Store lesson
    this.lessons.push({ ...lesson, timestamp: Date.now(), learned });
    if (this.lessons.length > this.maxLessons) this.lessons.shift();

    // Check for growth milestones
    this._checkMilestones();

    // Emit callback
    this.onLearn?.({ skill: lesson.primarySkill, progress: this.skills[lesson.primarySkill], lesson });

    // Regenerate energy over time
    setTimeout(() => {
      this.state.energy = Math.min(100, this.state.energy + 5);
    }, 30000); // recover 5 energy per 30s

    return { learned, lesson, age: this.age, maturity: this.state.maturity };
  }

  /**
   * Jow proactively asks a question when curious about something.
   * Triggered when it sees a pattern it doesn't understand.
   */
  askQuestion() {
    const topics = this._findUncertainTopics();
    if (topics.length === 0) return null;

    const topic = topics[0];
    const questions = [
      `What does "${topic}" mean?`,
      `Can you teach me more about ${topic}?`,
      `I'm curious about ${topic}. Could you explain?`,
      `Why is ${topic} important?`,
    ];

    const question = questions[Math.floor(Math.random() * questions.length)];
    this.onQuestion?.({ question, context: topic });
    return question;
  }

  /**
   * User gives direct feedback to Jow (thumbs up/down).
   * This is the strongest learning signal.
   */
  receiveFeedback(positive = true) {
    const last = this.lessons[this.lessons.length - 1];
    if (!last) return;

    const boost = positive ? 5 : -3;

    // Adjust primary skill
    if (last.primarySkill) {
      this.skills[last.primarySkill] = Math.max(0, Math.min(100,
        this.skills[last.primarySkill] + boost
      ));
    }

    // Adjust confidence based on feedback
    this.state.confidence = Math.max(0, Math.min(100,
      this.state.confidence + (positive ? 2 : -2)
    ));

    // Celebrate if positive
    if (positive) {
      this.onCelebrate?.({ achievement: `Learned from ${last.type}!` });
    }

    return { skill: last.primarySkill, newLevel: this.skills[last.primarySkill] };
  }

  // ── Skill analysis ────────────────────────────────────────────────────────

  _analyzeTurn(userInput, ariaResponse, ariaConfidence) {
    const lesson = {
      type: 'conversation',  // conversation | memory_retrieval | reasoning
      userInput,
      ariaResponse,
      ariaConfidence,
      primarySkill: null,
      secondarySkills: [],
      insights: [],
    };

    const uLower = userInput.toLowerCase();
    const rLower = ariaResponse.toLowerCase();

    // Detect lesson type
    if (/\b(hello|hi|hey|good morning)\b/.test(uLower)) {
      lesson.type = 'greeting';
      lesson.primarySkill = 'greetings';
      lesson.secondarySkills = ['empathy'];
    } else if (/\?/.test(userInput)) {
      lesson.type = 'question';
      lesson.primarySkill = 'questions';
      lesson.secondarySkills = ['reasoning', 'recall'];
    } else if (/\b(remember|recall|you said|earlier)\b/.test(uLower)) {
      lesson.type = 'memory_retrieval';
      lesson.primarySkill = 'recall';
      lesson.secondarySkills = ['context', 'associations'];
    } else if (/\b(why|how|what|explain)\b/.test(uLower)) {
      lesson.type = 'explanation';
      lesson.primarySkill = 'explanations';
      lesson.secondarySkills = ['concepts', 'reasoning'];
    } else if (/\b(feel|feeling|emotion|happy|sad)\b/.test(uLower)) {
      lesson.type = 'emotion';
      lesson.primarySkill = 'empathy';
      lesson.secondarySkills = ['encouragement'];
    }

    // Extract insights from Aria's response
    if (rLower.length > 50) {
      lesson.insights.push('Detailed response indicates deep knowledge');
      lesson.secondarySkills.push('facts');
    }
    if (ariaConfidence > 0.7) {
      lesson.insights.push('Parent was confident — high-quality pattern');
      lesson.secondarySkills.push('importance');
    }
    if (rLower.includes('because') || rLower.includes('therefore')) {
      lesson.insights.push('Causal reasoning detected');
      lesson.secondarySkills.push('reasoning');
    }

    return lesson;
  }

  _updateSkills(lesson) {
    const updates = [];

    // Primary skill gets biggest boost
    if (lesson.primarySkill && this.skills[lesson.primarySkill] !== undefined) {
      const boost = 3;
      this.skills[lesson.primarySkill] = Math.min(100,
        this.skills[lesson.primarySkill] + boost
      );
      updates.push({ skill: lesson.primarySkill, delta: boost });
    }

    // Secondary skills get smaller boost
    for (const skill of lesson.secondarySkills) {
      if (this.skills[skill] !== undefined) {
        const boost = 1;
        this.skills[skill] = Math.min(100, this.skills[skill] + boost);
        updates.push({ skill, delta: boost });
      }
    }

    // Increase confidence slightly with each lesson
    this.state.confidence = Math.min(100, this.state.confidence + 0.5);

    return updates;
  }

  _evolvePersonality(lesson) {
    // Personality drifts based on interaction patterns
    if (lesson.type === 'greeting') {
      this.personality.playfulness = Math.min(100, this.personality.playfulness + 0.5);
    }
    if (lesson.type === 'explanation') {
      this.personality.seriousness = Math.min(100, this.personality.seriousness + 0.5);
    }
    if (lesson.ariaConfidence > 0.8) {
      this.personality.independence = Math.min(100, this.personality.independence + 0.3);
    }

    // Helpfulness grows naturally
    this.personality.helpfulness = Math.min(100, this.personality.helpfulness + 0.2);
  }

  _checkMilestones() {
    const milestones = [
      { age: 10,  msg: 'First words!', skill: 'greetings' },
      { age: 50,  msg: 'Starting to ask questions', skill: 'questions' },
      { age: 100, msg: 'Understanding emotions', skill: 'empathy' },
      { age: 200, msg: 'Building memories', skill: 'recall' },
      { age: 500, msg: 'Fully grown!', skill: null },
    ];

    for (const m of milestones) {
      if (this.age === m.age) {
        this.onGrowth?.({ age: this.age, maturity: this.state.maturity, newSkill: m.skill });
        this.onCelebrate?.({ achievement: m.msg });
      }
    }
  }

  _findUncertainTopics() {
    // Find topics parent knows but Jow doesn't
    const parentStrong = this.parentModel?.selfState?.strongTopics ?? [];
    const lowSkills    = Object.entries(this.skills)
      .filter(([_, v]) => v < 30)
      .map(([k]) => k);

    return [...parentStrong, ...lowSkills].slice(0, 3);
  }

  // ── User-friendly status ───────────────────────────────────────────────────

  /**
   * Get a simple, human-readable status for the UI.
   * Designed for non-technical users.
   */
  getStatus() {
    let mood = 'curious';
    if (this.state.energy < 30)        mood = 'tired';
    if (this.state.confidence > 70)    mood = 'confident';
    if (this.state.maturity < 20)      mood = 'baby';
    if (this.state.maturity > 80)      mood = 'wise';

    let description = '';
    if (this.age < 10)      description = 'Just learning to speak';
    else if (this.age < 50)  description = 'Asking lots of questions';
    else if (this.age < 200) description = 'Building understanding';
    else if (this.age < 500) description = 'Growing confident';
    else                     description = 'Fully matured';

    const topSkills = Object.entries(this.skills)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, level]) => ({ name, level }));

    return {
      age:         this.age,
      mood,
      description,
      energy:      Math.round(this.state.energy),
      confidence:  Math.round(this.state.confidence),
      curiosity:   Math.round(this.state.curiosity),
      maturity:    Math.round(this.state.maturity),
      topSkills,
      personality: { ...this.personality },
      lessonsLearned: this.lessons.length,
    };
  }

  /**
   * Get skill tree with progress for visualization.
   */
  getSkillTree() {
    const tree = {};
    for (const [category, data] of Object.entries(SKILL_TREE)) {
      tree[category] = {
        name: data.name,
        icon: data.icon,
        skills: data.skills.map(s => ({
          name: s,
          level: this.skills[s] ?? 0,
          unlocked: (this.skills[s] ?? 0) > 5,
        })),
        totalProgress: Math.round(
          data.skills.reduce((sum, s) => sum + (this.skills[s] ?? 0), 0) / data.skills.length
        ),
      };
    }
    return tree;
  }

  // ── Persistence ────────────────────────────────────────────────────────────

  serialize() {
    return JSON.stringify({
      age:         this.age,
      state:       this.state,
      skills:      this.skills,
      personality: this.personality,
      lessons:     this.lessons.slice(-20), // last 20 only
    });
  }

  async save() {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, this.serialize());
    } catch (e) {
      console.warn('[Jow] Save failed:', e);
    }
  }

  async load() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (!data) return;
      const obj = JSON.parse(data);
      this.age         = obj.age ?? 0;
      this.state       = { ...this.state, ...obj.state };
      this.skills      = { ...this.skills, ...obj.skills };
      this.personality = { ...this.personality, ...obj.personality };
      this.lessons     = obj.lessons ?? [];
    } catch (e) {
      console.warn('[Jow] Load failed:', e);
    }
  }
}

export default Jow;
