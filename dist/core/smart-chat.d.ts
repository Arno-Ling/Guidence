/**
 * 智游伴侣 - 智能对话管理器
 * 集成用户偏好和会话记忆，优化token使用
 */
import type { Message } from '../types/index.js';
export interface SmartChatConfig {
    maxHistoryTurns: number;
    systemPromptTemplate: string;
    dataDir: string;
}
export declare class SmartChatManager {
    private userPrefs;
    private sessionMemory;
    private config;
    private conversationHistory;
    constructor(config?: Partial<SmartChatConfig>);
    private getDefaultTemplate;
    /**
     * 构建系统提示词（动态加载上下文）
     */
    private buildSystemPrompt;
    /**
     * 获取完整的对话消息（用于LLM）
     */
    getMessagesForLLM(sessionId: string, userId: string): Message[];
    /**
     * 添加用户消息
     */
    addUserMessage(sessionId: string, userId: string, content: string): void;
    /**
     * 添加助手回复
     */
    addAssistantMessage(sessionId: string, userId: string, content: string): void;
    /**
     * 从用户消息中提取信息并更新记忆
     */
    private extractAndUpdateMemory;
    /**
     * 获取当前token使用估算
     */
    getTokenEstimate(sessionId: string, userId: string): {
        systemPrompt: number;
        history: number;
        total: number;
    };
    /**
     * 更新用户长期偏好
     */
    updateUserPreferences(userId: string, preferences: Partial<import('./user-preferences.js').UserPreferences>): void;
    /**
     * 获取用户偏好
     */
    getUserPreferences(userId: string): import("./user-preferences.js").UserPreferences;
    /**
     * 获取会话记忆
     */
    getSessionMemory(sessionId: string, userId: string): import("./session-memory.js").SessionMemory;
    /**
     * 清除会话
     */
    clearSession(sessionId: string): void;
    /**
     * 获取统计信息
     */
    getStats(): {
        activeSessions: number;
        totalUsers: number;
    };
}
//# sourceMappingURL=smart-chat.d.ts.map