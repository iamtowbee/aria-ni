// src/agents/CreativityAgent.js
// Creative task agent using local LlamaModel

const CREATIVE_MODES = {
  STORY: { id: 'story', label: 'Story', maxTokens: 600, temp: 0.85 },
  POEM: { id: 'poem', label: 'Poem', maxTokens: 300, temp: 0.9 },
  BRAINSTORM: { id: 'brainstorm', label: 'Brainstorm', maxTokens: 400, temp: 0.8 },
  DIALOGUE: { id: 'dialogue', label: 'Dialogue', maxTokens: 500, temp: 0.8 },
  DESCRIPTION: { id: 'description', label: 'Description', maxTokens: 300, temp: 0.75 },
};

export class CreativityAgent {
  constructor(config = {}) {
    this.model = config.sharedModel || null;
    this.persona = config.persona || 'Nova';
    this.style = config.style || 'vivid, imaginative, and engaging';
    this._sessions = new Map();
  }

  async generate(prompt, mode = 'STORY', options = {}) {
    if (!this.model || !this.model.isLoaded) {
      throw new Error('[CreativityAgent] Model not loaded');
    }

    const modeConfig = CREATIVE_MODES[mode.toUpperCase()] || CREATIVE_MODES.STORY;
    const sessionId = options.sessionId || null;

    // Build system prompt
    const systemPrompt = `You are ${this.persona}'s creativity engine.
Style: ${this.style}
Mode: ${modeConfig.label}

Be original, creative, and engaging. ${this._getModeInstructions(mode)}`;

    // Build user prompt
    let userPrompt = this._wrapPrompt(prompt, mode);

    // Add session history if continuing
    if (sessionId && this._sessions.has(sessionId)) {
      const history = this._sessions.get(sessionId).slice(-2);
      const contextText = history.map(h => `Previous: ${h.prompt}\nResponse: ${h.response}`).join('\n\n');
      userPrompt = `${contextText}\n\nNow: ${userPrompt}`;
    }

    try {
      const result = await this.model.generate(userPrompt, {
        systemPrompt,
        maxTokens: modeConfig.maxTokens,
        temperature: modeConfig.temp,
      });

      // Update session
      if (sessionId) {
        this._updateSession(sessionId, prompt, result.text);
      }

      return {
        text: result.text,
        mode: modeConfig.label,
        tokensGenerated: result.tokensGenerated,
      };
    } catch (err) {
      console.error('[CreativityAgent] Generation error:', err);
      throw err;
    }
  }

  async brainstorm(topic, count = 5) {
    const prompt = `Generate ${count} creative, distinct ideas about: "${topic}".
List them clearly, one per line.`;

    const result = await this.generate(prompt, 'BRAINSTORM');
    
    // Parse into array
    const ideas = result.text
      .split('\n')
      .map(line => line.replace(/^\d+[.)]\s*/, '').trim())
      .filter(line => line.length > 0);

    return ideas.slice(0, count);
  }

  _wrapPrompt(prompt, mode) {
    const wrappers = {
      STORY: `Write a short, engaging story about: "${prompt}"`,
      POEM: `Write a creative poem about: "${prompt}"`,
      BRAINSTORM: prompt,
      DIALOGUE: `Write a dialogue scene where: "${prompt}"`,
      DESCRIPTION: `Write a vivid, detailed description of: "${prompt}"`,
    };
    return wrappers[mode.toUpperCase()] || prompt;
  }

  _getModeInstructions(mode) {
    const instructions = {
      STORY: 'Create a complete narrative with beginning, middle, and end.',
      POEM: 'Focus on imagery, emotion, and rhythm.',
      BRAINSTORM: 'Generate diverse, actionable ideas.',
      DIALOGUE: 'Make the conversation natural and character-driven.',
      DESCRIPTION: 'Use sensory details and vivid language.',
    };
    return instructions[mode.toUpperCase()] || '';
  }

  _updateSession(sessionId, prompt, response) {
    if (!this._sessions.has(sessionId)) {
      this._sessions.set(sessionId, []);
    }
    const history = this._sessions.get(sessionId);
    history.push({ prompt, response, ts: Date.now() });
    if (history.length > 10) history.shift();
  }

  clearSession(sessionId) {
    this._sessions.delete(sessionId);
  }
}
