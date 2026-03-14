// src/services/MultiModalProcessor.js
/**
 * Multi-Modal Message Processor
 * 
 * Handles messages with multiple input types:
 * - Text + Image: "What's in this photo?"
 * - Voice + Text: Voice transcription + follow-up text
 * - Image + Voice: Take photo, ask about it
 * 
 * Coordinates between agents to process all modalities
 */

export class MultiModalProcessor {
  constructor(ecosystem) {
    this.ecosystem = ecosystem;
  }

  /**
   * Process multi-modal message
   * 
   * @param {Object} message - { text, attachments: [{ type, ...data }] }
   * @returns {Object} Response with combined results
   */
  async process(message, options = {}) {
    const { text, attachments } = message;
    
    // If no attachments, process as regular text
    if (!attachments || attachments.length === 0) {
      return this.ecosystem.processText(text, options);
    }

    console.log(`[MultiModal] Processing message with ${attachments.length} attachments`);

    // Build context from all attachments
    const attachmentContext = [];

    // Process each attachment
    for (const attachment of attachments) {
      if (attachment.type === 'image') {
        const imageResult = await this._processImage(attachment, text);
        attachmentContext.push(imageResult);
      } else if (attachment.type === 'voice') {
        const voiceResult = await this._processVoice(attachment);
        attachmentContext.push(voiceResult);
      }
    }

    // Combine all context
    const combinedContext = this._combineContext(attachmentContext);

    // Build enriched prompt
    const enrichedPrompt = this._buildPrompt(text, combinedContext);

    // Process with full context
    const response = await this.ecosystem.processText(enrichedPrompt, {
      ...options,
      multiModal: true,
      attachments,
    });

    return {
      ...response,
      multiModal: true,
      attachmentContext,
    };
  }

  /**
   * Process image attachment
   */
  async _processImage(attachment, userText) {
    try {
      console.log('[MultiModal] Processing image...');
      
      // Use AlphaAgent for vision
      const analysis = await this.ecosystem.alpha.analyzeImage(
        attachment.uri,
        userText || 'Describe this image'
      );

      return {
        type: 'image',
        description: analysis.description,
        confidence: analysis.confidence,
      };
    } catch (err) {
      console.error('[MultiModal] Image processing error:', err);
      return {
        type: 'image',
        error: 'Could not analyze image',
      };
    }
  }

  /**
   * Process voice attachment
   */
  async _processVoice(attachment) {
    // Voice is already transcribed
    return {
      type: 'voice',
      text: attachment.text,
      duration: attachment.duration,
    };
  }

  /**
   * Combine context from all attachments
   */
  _combineContext(attachmentContext) {
    const parts = [];

    attachmentContext.forEach(ctx => {
      if (ctx.type === 'image' && ctx.description) {
        parts.push(`[Image context: ${ctx.description}]`);
      } else if (ctx.type === 'voice' && ctx.text) {
        parts.push(`[Voice note: "${ctx.text}"]`);
      }
    });

    return parts.join('\n');
  }

  /**
   * Build enriched prompt with all context
   */
  _buildPrompt(text, context) {
    if (!context) return text;

    return `${context}\n\nUser's question: ${text}`;
  }

  /**
   * Get processing statistics
   */
  getStats() {
    return {
      // Could track:
      // - Images processed
      // - Voice notes transcribed
      // - Multi-modal messages handled
    };
  }
}

/**
 * Usage Example:
 * 
 * const processor = new MultiModalProcessor(ecosystem);
 * 
 * const message = {
 *   text: "What's in this photo?",
 *   attachments: [
 *     { type: 'image', uri: 'file://...', base64: '...' }
 *   ]
 * };
 * 
 * const response = await processor.process(message);
 * // Response combines image analysis with text answer
 */
