import { BaseDirectory, exists, readTextFile, writeTextFile, mkdir, readDir } from '@tauri-apps/plugin-fs';
import { join, appDataDir } from '@tauri-apps/api/path';
import { ChatMessage } from '@/features/ai-chat/types';

export interface ConversationSession {
  id: string;
  pdfPath: string;
  messages: ChatMessage[];
  createdAt: Date;
  lastUpdated: Date;
}

export interface ConversationMetadata {
  id: string;
  pdfPath: string;
  pdfName: string;
  createdAt: string;
  lastUpdated: string;
  messageCount: number;
  preview?: string; // First message preview
}

class ConversationHistoryService {
  private readonly CONVERSATION_HISTORY_DIR = 'conversation-history';
  private readonly METADATA_FILE = 'conversation-metadata.json';
  private directoryInitialized = false;
  private currentSessionId: string | null = null;

  private async getAppDataPath(): Promise<string> {
    return await appDataDir();
  }

  private async getConversationHistoryPath(): Promise<string> {
    const appData = await this.getAppDataPath();
    return join(appData, this.CONVERSATION_HISTORY_DIR);
  }

  private async ensureDirectoryExists(): Promise<void> {
    if (this.directoryInitialized) return;

    try {
      const appDataPath = await this.getAppDataPath();
      const conversationHistoryPath = await this.getConversationHistoryPath();

      // Create app data directory if it doesn't exist
      if (!(await exists(appDataPath))) {
        await mkdir(appDataPath, { recursive: true });
      }

      // Create conversation history subdirectory if it doesn't exist
      if (!(await exists(conversationHistoryPath))) {
        await mkdir(conversationHistoryPath, { recursive: true });
      }

      this.directoryInitialized = true;
    } catch (error) {
      console.error('Error creating directories:', error);
      throw error;
    }
  }

  private generateSessionId(): string {
    return `conversation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getConversationFilePath(sessionId: string): Promise<string> {
    const conversationHistoryPath = await this.getConversationHistoryPath();
    return join(conversationHistoryPath, `${sessionId}.json`);
  }

  private async getMetadataFilePath(): Promise<string> {
    const appData = await this.getAppDataPath();
    return join(appData, this.METADATA_FILE);
  }

  async createNewSession(pdfPath: string): Promise<string> {
    await this.ensureDirectoryExists();

    const sessionId = this.generateSessionId();
    const session: ConversationSession = {
      id: sessionId,
      pdfPath,
      messages: [],
      createdAt: new Date(),
      lastUpdated: new Date()
    };

    const filePath = await this.getConversationFilePath(sessionId);
    await writeTextFile(filePath, JSON.stringify(session, null, 2));

    // Update metadata
    await this.updateMetadataForSession(session);

    this.currentSessionId = sessionId;
    return sessionId;
  }

  async getCurrentSession(pdfPath: string): Promise<ConversationSession | null> {
    // If we have a current session for this PDF, return it
    if (this.currentSessionId) {
      const session = await this.loadSession(this.currentSessionId);
      if (session && session.pdfPath === pdfPath) {
        return session;
      }
    }

    // Otherwise, get the most recent session for this PDF
    const sessions = await this.getSessionsForPdf(pdfPath);
    if (sessions.length > 0) {
      const mostRecent = sessions[0]; // Already sorted by lastUpdated
      this.currentSessionId = mostRecent.id;
      return mostRecent;
    }

    // No existing session, create a new one
    const sessionId = await this.createNewSession(pdfPath);
    return await this.loadSession(sessionId);
  }

  async startNewConversationSession(pdfPath: string): Promise<string> {
    // Always create a new session when explicitly requested
    const sessionId = await this.createNewSession(pdfPath);
    this.currentSessionId = sessionId;
    return sessionId;
  }

  async loadSession(sessionId: string): Promise<ConversationSession | null> {
    try {
      await this.ensureDirectoryExists();
      const filePath = await this.getConversationFilePath(sessionId);

      if (!(await exists(filePath))) {
        return null;
      }

      const content = await readTextFile(filePath);
      const session = JSON.parse(content) as ConversationSession;

      // Convert date strings back to Date objects
      session.createdAt = new Date(session.createdAt);
      session.lastUpdated = new Date(session.lastUpdated);
      session.messages = session.messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));

      return session;
    } catch (error) {
      console.error('Error loading session:', error);
      return null;
    }
  }

  async saveSession(session: ConversationSession): Promise<void> {
    try {
      await this.ensureDirectoryExists();
      const filePath = await this.getConversationFilePath(session.id);

      session.lastUpdated = new Date();

      // Convert to serializable format
      const serializable = {
        ...session,
        createdAt: session.createdAt.toISOString(),
        lastUpdated: session.lastUpdated.toISOString(),
        messages: session.messages.map(msg => ({
          ...msg,
          timestamp: msg.timestamp.toISOString()
        }))
      };

      await writeTextFile(filePath, JSON.stringify(serializable, null, 2));

      // Update metadata
      await this.updateMetadataForSession(session);

      // Dispatch event to notify that conversation has been updated
      const event = new CustomEvent('conversation-updated', {
        detail: {
          sessionId: session.id,
          pdfPath: session.pdfPath,
          messageCount: session.messages.length
        }
      });
      window.dispatchEvent(event);
    } catch (error) {
      console.error('Error saving session:', error);
      throw error;
    }
  }

  async getSessionsForPdf(pdfPath: string): Promise<ConversationSession[]> {
    try {
      await this.ensureDirectoryExists();
      const metadata = await this.loadMetadata();

      // Filter sessions for this PDF and sort by last updated
      const pdfSessions = metadata
        .filter(m => m.pdfPath === pdfPath)
        .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());

      // Load full sessions
      const sessions: ConversationSession[] = [];
      for (const meta of pdfSessions) {
        const session = await this.loadSession(meta.id);
        if (session) {
          sessions.push(session);
        }
      }

      return sessions;
    } catch (error) {
      console.error('Error getting sessions for PDF:', error);
      return [];
    }
  }

  async getAllSessions(): Promise<ConversationMetadata[]> {
    try {
      await this.ensureDirectoryExists();
      const metadata = await this.loadMetadata();

      // Sort by last updated (most recent first)
      return metadata.sort((a, b) =>
        new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
      );
    } catch (error) {
      console.error('Error getting all sessions:', error);
      return [];
    }
  }

  private async loadMetadata(): Promise<ConversationMetadata[]> {
    try {
      const filePath = await this.getMetadataFilePath();

      if (!(await exists(filePath))) {
        return [];
      }

      const content = await readTextFile(filePath);
      if (!content || content.trim() === '') {
        return [];
      }

      return JSON.parse(content) as ConversationMetadata[];
    } catch (error) {
      console.error('Error loading metadata:', error);
      return [];
    }
  }

  private async saveMetadata(metadata: ConversationMetadata[]): Promise<void> {
    try {
      const filePath = await this.getMetadataFilePath();
      await writeTextFile(filePath, JSON.stringify(metadata, null, 2));
    } catch (error) {
      console.error('Error saving metadata:', error);
      throw error;
    }
  }

  private async updateMetadataForSession(session: ConversationSession): Promise<void> {
    try {
      const metadata = await this.loadMetadata();
      const pdfName = session.pdfPath.split('/').pop() || 'Unknown PDF';

      // Find existing metadata entry or create new one
      const existingIndex = metadata.findIndex(m => m.id === session.id);

      const metadataEntry: ConversationMetadata = {
        id: session.id,
        pdfPath: session.pdfPath,
        pdfName,
        createdAt: session.createdAt.toISOString(),
        lastUpdated: session.lastUpdated.toISOString(),
        messageCount: session.messages.length,
        preview: session.messages.length > 0 ?
          session.messages[0].content.substring(0, 100) : undefined
      };

      if (existingIndex >= 0) {
        metadata[existingIndex] = metadataEntry;
      } else {
        metadata.push(metadataEntry);
      }

      await this.saveMetadata(metadata);
    } catch (error) {
      console.error('Error updating metadata:', error);
    }
  }


  async saveConversationForPdf(pdfPath: string, messages: ChatMessage[]): Promise<void> {
    let session = await this.getCurrentSession(pdfPath);

    if (!session) {
      const sessionId = await this.createNewSession(pdfPath);
      session = await this.loadSession(sessionId);
      if (!session) {
        throw new Error('Failed to create new session');
      }
    }

    session.messages = messages;
    await this.saveSession(session);
  }

  async getRecentConversations(limit: number = 50): Promise<ConversationMetadata[]> {
    const metadata = await this.getAllSessions();
    return metadata.slice(0, limit);
  }


}

export const conversationHistoryService = new ConversationHistoryService();

