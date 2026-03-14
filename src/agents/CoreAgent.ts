// src/agents/CoreAgent.js
// Central reasoning agent using injected model provider

export class CoreAgent {
  constructor(config = {}) {
    // Use shared model (injected via dependency injection)
    if (!config.sharedModel) {
      throw new Error('[CoreAgent] sharedModel is required (dependency injection)');
    }
    this.model = config.sharedModel;

    this.personality = config.personality || {
      name: 'Nova',
      traits: ['helpful', 'curious', 'empathetic'],
      tone: 'friendly',
    };

    this.conversationHistory = [];
    this.maxHistoryLength = config.maxHistoryLength || 6;
    this.isReady = false;
  }

  async load(onProgress = null) {
    if (!this.isReady) {
      await this.model.load(onProgress);
      this.isReady = true;
    }
  }

  async reason(input) {
    if (!this.isReady) {
      throw new Error('[CoreAgent] Not ready. Call load() first.');
    }

    const { text, context, emotionContext, onStream } = input;

    // Build system prompt with personality and emotion
    const systemPrompt = this._buildSystemPrompt(emotionContext);

    // Build user prompt with memory context
    let userPrompt = text;
    if (context?.memories?.length > 0) {
      const memContext = context.memories
        .slice(0, 3)
        .map(m => `- ${m.content}`)
        .join('\n');
      userPrompt = `Context from memory:\n${memContext}\n\nUser: ${text}`;
    }

    try {
      let result;

      if (onStream) {
        // Streaming generation
        let fullText = '';
        result = await this.model.generateStream(
          userPrompt,
          { systemPrompt, maxTokens: 512 },
          (token, full) => {
            fullText = full;
            onStream(token, full);
          }
        );
        result.text = fullText;
      } else {
        // Blocking generation
        result = await this.model.generate(userPrompt, { systemPrompt });
      }

      // Update history
      this._updateHistory(text, result.text);

      return {
        text: result.text,
        usage: {
          outputTokens: result.tokensGenerated || 0,
        },
        tier: 'device',
        latency: result.latency,
      };
    } catch (err) {
      console.error('[CoreAgent] Reasoning error:', err);
      return {
        text: "I'm having trouble thinking right now. Please try again.",
        error: err.message,
      };
    }
  }

  _buildSystemPrompt(emotionContext) {
    const { name, traits, tone } = this.personality;

    let prompt = `You are ${name}, a helpful AI assistant.
Your traits: ${traits.join(', ')}.
Your tone: ${tone}.

You are part of a 7-agent system:
- CoreAgent (you): Reasoning and conversation
- AlphaAgent: Vision and image understanding
- BetaAgent: Voice and speech
- GammaAgent: Long-term memory
- DeltaAgent: Emotional intelligence
- CreativityAgent: Creative tasks
- InterfaceAgent: UI and avatar control

Keep responses concise and natural. Avoid being overly formal.`;

    if (emotionContext) {
      prompt += `\n\nUser's current emotion: ${emotionContext.currentEmotion}
Adapt your tone to be: ${emotionContext.recommendation}`;
    }

    return prompt;
  }

  _updateHistory(userText, assistantText) {
    this.conversationHistory.push({
      user: userText,
      assistant: assistantText,
      timestamp: Date.now(),
    });

    if (this.conversationHistory.length > this.maxHistoryLength) {
      this.conversationHistory.shift();
    }
  }

  clearHistory() {
    this.conversationHistory = [];
  }

  getModelInfo() {
    return this.model.getInfo();
  }
}
