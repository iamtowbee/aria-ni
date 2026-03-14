// src/features/collaboration/ConversationSharing.ts
/**
 * Conversation Sharing System
 * 
 * Share conversations with others:
 * - Generate shareable links
 * - QR code sharing
 * - Collaborative conversations
 * - Permission management
 * - Real-time collaboration
 * - Comment threads
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

export interface SharedConversation {
  id: string;
  title: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
  }>;
  owner: string;
  permissions: ConversationPermissions;
  shareLink: string;
  qrCode?: string;
  createdAt: number;
  expiresAt?: number;
}

export interface ConversationPermissions {
  view: boolean;
  comment: boolean;
  fork: boolean; // Create own copy
  edit: boolean;
  public: boolean;
}

export interface CollaborativeSession {
  conversationId: string;
  participants: Participant[];
  activeAgent?: string;
  turnTaking: 'free' | 'sequential' | 'moderated';
  maxParticipants: number;
}

export interface Participant {
  id: string;
  name: string;
  role: 'owner' | 'collaborator' | 'viewer';
  joinedAt: number;
  isActive: boolean;
}

/**
 * ConversationSharing
 * 
 * Enable sharing and collaboration on conversations
 */
export class ConversationSharing {
  private sharedConversations: Map<string, SharedConversation> = new Map();
  private activeSessions: Map<string, CollaborativeSession> = new Map();
  private readonly STORAGE_KEY = 'shared_conversations';
  private readonly BASE_SHARE_URL = 'https://aria-nova.app/shared/';

  /**
   * Share a conversation
   */
  async shareConversation(
    conversationId: string,
    title: string,
    messages: any[],
    permissions: ConversationPermissions,
    expiresIn?: number // milliseconds
  ): Promise<SharedConversation> {
    const shareId = this.generateShareId();
    const shareLink = `${this.BASE_SHARE_URL}${shareId}`;

    const sharedConv: SharedConversation = {
      id: shareId,
      title,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp || Date.now(),
      })),
      owner: 'current_user', // Would be actual user ID
      permissions,
      shareLink,
      createdAt: Date.now(),
      expiresAt: expiresIn ? Date.now() + expiresIn : undefined,
    };

    // Generate QR code if public
    if (permissions.public) {
      sharedConv.qrCode = await this.generateQRCode(shareLink);
    }

    this.sharedConversations.set(shareId, sharedConv);
    await this.saveSharedConversations();

    console.log(`[ConversationSharing] Shared: ${shareId}`);
    return sharedConv;
  }

  /**
   * Generate share ID
   */
  private generateShareId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Generate QR code for sharing
   */
  private async generateQRCode(data: string): Promise<string> {
    // In production, use a QR code library
    // For now, return placeholder
    return `qr_code_for_${data}`;
  }

  /**
   * Share via system share sheet
   */
  async shareViaSystem(conversationId: string): Promise<void> {
    const shared = this.sharedConversations.get(conversationId);
    if (!shared) {
      throw new Error('Conversation not shared');
    }

    try {
      await Sharing.shareAsync(shared.shareLink, {
        mimeType: 'text/plain',
        dialogTitle: `Share "${shared.title}"`,
      });
    } catch (error) {
      console.error('[ConversationSharing] System share failed:', error);
      throw error;
    }
  }

  /**
   * Export conversation as file
   */
  async exportAsFile(
    conversationId: string,
    format: 'txt' | 'json' | 'md' | 'pdf'
  ): Promise<string> {
    const shared = this.sharedConversations.get(conversationId);
    if (!shared) {
      throw new Error('Conversation not found');
    }

    const fileName = `${shared.title.replace(/[^a-z0-9]/gi, '_')}.${format}`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;

    let content = '';

    switch (format) {
      case 'txt':
        content = this.formatAsText(shared);
        break;
      case 'json':
        content = JSON.stringify(shared, null, 2);
        break;
      case 'md':
        content = this.formatAsMarkdown(shared);
        break;
      case 'pdf':
        // Would generate PDF in production
        content = this.formatAsText(shared);
        break;
    }

    await FileSystem.writeAsStringAsync(filePath, content);
    return filePath;
  }

  /**
   * Format conversation as text
   */
  private formatAsText(conversation: SharedConversation): string {
    const lines = [
      conversation.title,
      '='.repeat(conversation.title.length),
      '',
      ...conversation.messages.map(msg => {
        const role = msg.role === 'user' ? 'You' : 'Aria';
        const date = new Date(msg.timestamp).toLocaleString();
        return `[${date}] ${role}:\n${msg.content}\n`;
      }),
    ];

    return lines.join('\n');
  }

  /**
   * Format conversation as markdown
   */
  private formatAsMarkdown(conversation: SharedConversation): string {
    const lines = [
      `# ${conversation.title}`,
      '',
      `*Shared on ${new Date(conversation.createdAt).toLocaleString()}*`,
      '',
      ...conversation.messages.map(msg => {
        const role = msg.role === 'user' ? '**You**' : '*Aria*';
        return `### ${role}\n\n${msg.content}\n`;
      }),
    ];

    return lines.join('\n');
  }

  /**
   * Start collaborative session
   */
  async startCollaborativeSession(
    conversationId: string,
    turnTaking: CollaborativeSession['turnTaking'] = 'free',
    maxParticipants: number = 5
  ): Promise<CollaborativeSession> {
    const session: CollaborativeSession = {
      conversationId,
      participants: [
        {
          id: 'current_user',
          name: 'You',
          role: 'owner',
          joinedAt: Date.now(),
          isActive: true,
        },
      ],
      turnTaking,
      maxParticipants,
    };

    this.activeSessions.set(conversationId, session);
    console.log(`[ConversationSharing] Collaborative session started`);

    return session;
  }

  /**
   * Join collaborative session
   */
  async joinSession(
    conversationId: string,
    participantName: string
  ): Promise<void> {
    const session = this.activeSessions.get(conversationId);
    if (!session) {
      throw new Error('Session not found');
    }

    if (session.participants.length >= session.maxParticipants) {
      throw new Error('Session is full');
    }

    const participant: Participant = {
      id: `participant_${Date.now()}`,
      name: participantName,
      role: 'collaborator',
      joinedAt: Date.now(),
      isActive: true,
    };

    session.participants.push(participant);
    console.log(`[ConversationSharing] ${participantName} joined session`);
  }

  /**
   * Leave collaborative session
   */
  leaveSession(conversationId: string, participantId: string): void {
    const session = this.activeSessions.get(conversationId);
    if (!session) {
      return;
    }

    session.participants = session.participants.filter(
      p => p.id !== participantId
    );

    // End session if no participants left
    if (session.participants.length === 0) {
      this.activeSessions.delete(conversationId);
      console.log(`[ConversationSharing] Session ended (no participants)`);
    }
  }

  /**
   * Fork (copy) a shared conversation
   */
  async forkConversation(shareId: string): Promise<SharedConversation> {
    const original = this.sharedConversations.get(shareId);
    if (!original) {
      throw new Error('Conversation not found');
    }

    if (!original.permissions.fork) {
      throw new Error('Forking not allowed');
    }

    // Create a copy
    const forked = await this.shareConversation(
      `forked_${shareId}`,
      `Fork of ${original.title}`,
      original.messages,
      {
        view: true,
        comment: true,
        fork: true,
        edit: true,
        public: false,
      }
    );

    console.log(`[ConversationSharing] Forked: ${shareId} → ${forked.id}`);
    return forked;
  }

  /**
   * Revoke share
   */
  revokeShare(shareId: string): void {
    this.sharedConversations.delete(shareId);
    this.saveSharedConversations();
    console.log(`[ConversationSharing] Revoked: ${shareId}`);
  }

  /**
   * Get shared conversation
   */
  getSharedConversation(shareId: string): SharedConversation | undefined {
    return this.sharedConversations.get(shareId);
  }

  /**
   * List all shared conversations
   */
  getAllShared(): SharedConversation[] {
    return Array.from(this.sharedConversations.values());
  }

  /**
   * Check if conversation is expired
   */
  isExpired(shareId: string): boolean {
    const shared = this.sharedConversations.get(shareId);
    if (!shared || !shared.expiresAt) {
      return false;
    }

    return Date.now() > shared.expiresAt;
  }

  /**
   * Clean up expired shares
   */
  cleanupExpired(): number {
    let removed = 0;

    for (const [id, shared] of this.sharedConversations) {
      if (this.isExpired(id)) {
        this.sharedConversations.delete(id);
        removed++;
      }
    }

    if (removed > 0) {
      this.saveSharedConversations();
      console.log(`[ConversationSharing] Cleaned up ${removed} expired shares`);
    }

    return removed;
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalShared: number;
    public: number;
    collaborative: number;
    expired: number;
  } {
    let publicCount = 0;
    let expiredCount = 0;

    for (const [id, shared] of this.sharedConversations) {
      if (shared.permissions.public) publicCount++;
      if (this.isExpired(id)) expiredCount++;
    }

    return {
      totalShared: this.sharedConversations.size,
      public: publicCount,
      collaborative: this.activeSessions.size,
      expired: expiredCount,
    };
  }

  /**
   * Save shared conversations
   */
  private async saveSharedConversations(): Promise<void> {
    try {
      const data = Array.from(this.sharedConversations.entries());
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('[ConversationSharing] Save failed:', error);
    }
  }

  /**
   * Load shared conversations
   */
  async loadSharedConversations(): Promise<void> {
    try {
      const saved = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        this.sharedConversations = new Map(data);
      }
    } catch (error) {
      console.error('[ConversationSharing] Load failed:', error);
    }
  }
}

// Singleton instance
export const conversationSharing = new ConversationSharing();
