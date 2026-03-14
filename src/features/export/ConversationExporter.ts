// src/features/export/ConversationExporter.ts
/**
 * Export Conversations to Various Formats
 */

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// ==================== TYPES ====================

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  title?: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export type ExportFormat = 'txt' | 'json' | 'md' | 'html' | 'pdf';

// ==================== EXPORTERS ====================

class ConversationExporter {
  // ==================== TEXT EXPORT ====================

  exportToText(conversation: Conversation): string {
    const title = conversation.title || 'Conversation';
    const date = new Date(conversation.createdAt).toLocaleString();
    
    let text = `${title}\n`;
    text += `Date: ${date}\n`;
    text += `${'='.repeat(50)}\n\n`;
    
    conversation.messages.forEach((msg) => {
      const time = new Date(msg.timestamp).toLocaleTimeString();
      const role = msg.role === 'user' ? 'You' : 'Aria-Nova';
      text += `[${time}] ${role}:\n${msg.content}\n\n`;
    });
    
    return text;
  }

  // ==================== JSON EXPORT ====================

  exportToJSON(conversation: Conversation): string {
    return JSON.stringify(conversation, null, 2);
  }

  // ==================== MARKDOWN EXPORT ====================

  exportToMarkdown(conversation: Conversation): string {
    const title = conversation.title || 'Conversation';
    const date = new Date(conversation.createdAt).toLocaleDateString();
    
    let md = `# ${title}\n\n`;
    md += `**Date:** ${date}\n\n`;
    md += `---\n\n`;
    
    conversation.messages.forEach((msg) => {
      const time = new Date(msg.timestamp).toLocaleTimeString();
      const role = msg.role === 'user' ? '**You**' : '**Aria-Nova**';
      md += `### ${role} (${time})\n\n`;
      md += `${msg.content}\n\n`;
      md += `---\n\n`;
    });
    
    return md;
  }

  // ==================== HTML EXPORT ====================

  exportToHTML(conversation: Conversation): string {
    const title = conversation.title || 'Conversation';
    const date = new Date(conversation.createdAt).toLocaleString();
    
    let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .header {
            background: #6C63FF;
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .message {
            background: white;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 10px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .user { border-left: 4px solid #34C759; }
        .assistant { border-left: 4px solid #6C63FF; }
        .role {
            font-weight: bold;
            margin-bottom: 5px;
        }
        .time {
            color: #888;
            font-size: 12px;
        }
        .content {
            margin-top: 10px;
            line-height: 1.6;
            white-space: pre-wrap;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${title}</h1>
        <p>${date}</p>
    </div>
`;
    
    conversation.messages.forEach((msg) => {
      const time = new Date(msg.timestamp).toLocaleTimeString();
      const role = msg.role === 'user' ? 'You' : 'Aria-Nova';
      const className = msg.role;
      
      html += `
    <div class="message ${className}">
        <div class="role">${role} <span class="time">${time}</span></div>
        <div class="content">${this.escapeHTML(msg.content)}</div>
    </div>
`;
    });
    
    html += `
</body>
</html>
`;
    
    return html;
  }

  // ==================== FILE SAVING ====================

  async saveToFile(
    conversation: Conversation,
    format: ExportFormat
  ): Promise<string> {
    let content: string;
    let extension: string;
    let mimeType: string;
    
    switch (format) {
      case 'txt':
        content = this.exportToText(conversation);
        extension = 'txt';
        mimeType = 'text/plain';
        break;
      case 'json':
        content = this.exportToJSON(conversation);
        extension = 'json';
        mimeType = 'application/json';
        break;
      case 'md':
        content = this.exportToMarkdown(conversation);
        extension = 'md';
        mimeType = 'text/markdown';
        break;
      case 'html':
        content = this.exportToHTML(conversation);
        extension = 'html';
        mimeType = 'text/html';
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
    
    const filename = `conversation_${conversation.id}_${Date.now()}.${extension}`;
    const fileUri = `${FileSystem.documentDirectory}${filename}`;
    
    await FileSystem.writeAsStringAsync(fileUri, content, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    
    return fileUri;
  }

  // ==================== SHARING ====================

  async exportAndShare(
    conversation: Conversation,
    format: ExportFormat
  ): Promise<void> {
    try {
      const fileUri = await this.saveToFile(conversation, format);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: this.getMimeType(format),
          dialogTitle: 'Export Conversation',
        });
      } else {
        console.log('Sharing is not available. File saved to:', fileUri);
      }
    } catch (error) {
      console.error('[ConversationExporter] Export failed:', error);
      throw error;
    }
  }

  // ==================== BATCH EXPORT ====================

  async exportMultiple(
    conversations: Conversation[],
    format: ExportFormat
  ): Promise<string[]> {
    const fileUris: string[] = [];
    
    for (const conversation of conversations) {
      try {
        const uri = await this.saveToFile(conversation, format);
        fileUris.push(uri);
      } catch (error) {
        console.error(`Failed to export conversation ${conversation.id}:`, error);
      }
    }
    
    return fileUris;
  }

  // ==================== HELPERS ====================

  private escapeHTML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private getMimeType(format: ExportFormat): string {
    const mimeTypes = {
      txt: 'text/plain',
      json: 'application/json',
      md: 'text/markdown',
      html: 'text/html',
      pdf: 'application/pdf',
    };
    return mimeTypes[format] || 'text/plain';
  }
}

// ==================== SINGLETON ====================

export const conversationExporter = new ConversationExporter();

// ==================== REACT HOOKS ====================

export function useConversationExport() {
  return {
    exportToText: conversationExporter.exportToText.bind(conversationExporter),
    exportToJSON: conversationExporter.exportToJSON.bind(conversationExporter),
    exportToMarkdown: conversationExporter.exportToMarkdown.bind(conversationExporter),
    exportToHTML: conversationExporter.exportToHTML.bind(conversationExporter),
    exportAndShare: conversationExporter.exportAndShare.bind(conversationExporter),
    exportMultiple: conversationExporter.exportMultiple.bind(conversationExporter),
  };
}
