/**
 * 智游伴侣 - 对话管理器
 * 支持多轮对话、上下文记忆、会话存储
 */
import type { Message, ConversationSession } from '../types/index.js';
export interface ChatManagerConfig {
    maxHistoryLength: number;
    maxTokens: number;
    systemPrompt: string;
}
export declare class ChatManager {
    private sessions;
    private config;
    constructor(config?: Partial<ChatManagerConfig>);
    private getDefaultSystemPrompt;
    /**
     * 获取或创建会话
     */
    getOrCreateSession(sessionId: string): ConversationSession;
    /**
     * 添加用户消息
     */
    addUserMessage(sessionId: string, content: string): void;
    /**
     * 添加助手回复
     */
    addAssistantMessage(sessionId: string, content: string): void;
    /**
     * 获取对话历史（用于LLM）
     */
    getMessagesForLLM(sessionId: string): Message[];
    /**
     * 获取会话摘要（用于长期记忆）
     */
    getSessionSummary(sessionId: string): string;
    /**
     * 从用户消息中提取上下文信息
     */
    private extractContext;
    /**
     * 裁剪历史，保持在限制内
     */
    private trimHistory;
    /**
     * 清除会话
     */
    clearSession(sessionId: string): void;
    /**
     * 获取所有会话ID
     */
    getSessionIds(): string[];
    /**
     * 获取会话数量
     */
    getSessionCount(): number;
}
//# sourceMappingURL=chat-manager.d.ts.map