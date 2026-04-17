/**
 * 智游伴侣 - 会话临时记忆
 * 存储当前对话的临时上下文，节省token成本
 */
export interface SessionMemory {
    sessionId: string;
    userId: string;
    currentGoal?: string;
    mentionedPlaces: string[];
    mentionedDates: string[];
    mentionedPeople?: number;
    decisions: Array<{
        type: string;
        choice: string;
        timestamp: number;
    }>;
    cachedSearchResults: Map<string, {
        data: unknown;
        timestamp: number;
        ttl: number;
    }>;
    temporaryOverrides: {
        budgetOverride?: {
            min: number;
            max: number;
        };
        destinationOverride?: string[];
        other?: Record<string, unknown>;
    };
    createdAt: number;
    updatedAt: number;
}
export declare class SessionMemoryStore {
    private dataDir;
    private sessions;
    constructor(dataDir?: string);
    private getFilePath;
    /**
     * 获取或创建会话记忆
     */
    getOrCreate(sessionId: string, userId: string): SessionMemory;
    /**
     * 更新当前目标
     */
    setGoal(sessionId: string, userId: string, goal: string): void;
    /**
     * 添加提及的地点
     */
    addMentionedPlace(sessionId: string, userId: string, place: string): void;
    /**
     * 添加提及的日期
     */
    addMentionedDate(sessionId: string, userId: string, date: string): void;
    /**
     * 记录决策
     */
    addDecision(sessionId: string, userId: string, type: string, choice: string): void;
    /**
     * 缓存搜索结果
     */
    cacheSearchResult(sessionId: string, userId: string, key: string, data: unknown, ttl?: number): void;
    /**
     * 获取缓存的搜索结果
     */
    getCachedResult(sessionId: string, userId: string, key: string): unknown | null;
    /**
     * 设置临时预算覆盖
     */
    setTemporaryBudget(sessionId: string, userId: string, min: number, max: number): void;
    /**
     * 获取摘要（用于LLM提示词）
     */
    getSummary(sessionId: string, userId: string): string;
    /**
     * 保存到文件
     */
    save(sessionId: string): void;
    /**
     * 清除会话
     */
    clear(sessionId: string): void;
    /**
     * 保存所有会话
     */
    saveAll(): void;
}
//# sourceMappingURL=session-memory.d.ts.map