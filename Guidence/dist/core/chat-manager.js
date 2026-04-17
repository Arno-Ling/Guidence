/**
 * 智游伴侣 - 对话管理器
 * 支持多轮对话、上下文记忆、会话存储
 */
export class ChatManager {
    sessions = new Map();
    config;
    constructor(config) {
        this.config = {
            maxHistoryLength: config?.maxHistoryLength ?? 20,
            maxTokens: config?.maxTokens ?? 4000,
            systemPrompt: config?.systemPrompt ?? this.getDefaultSystemPrompt()
        };
    }
    getDefaultSystemPrompt() {
        return `你是智游伴侣，一个AI自驾旅行管家。
你的能力：
1. 理解用户的旅行需求
2. 搜索景点、酒店、餐厅等信息
3. 规划自驾行程
4. 提供天气、路况等实时信息

你的特点：
- 友好、专业、有耐心
- 会记住用户的偏好和历史对话
- 主动询问关键信息（出发地、目的地、时间、预算等）
- 提供实用的旅行建议

请用中文回复，保持对话自然流畅。`;
    }
    /**
     * 获取或创建会话
     */
    getOrCreateSession(sessionId) {
        if (!this.sessions.has(sessionId)) {
            this.sessions.set(sessionId, {
                id: sessionId,
                messages: [],
                context: {
                    userPreferences: {},
                    currentTrip: null,
                    mentionedPlaces: [],
                    mentionedDates: []
                },
                createdAt: Date.now(),
                lastActiveAt: Date.now()
            });
        }
        const session = this.sessions.get(sessionId);
        session.lastActiveAt = Date.now();
        return session;
    }
    /**
     * 添加用户消息
     */
    addUserMessage(sessionId, content) {
        const session = this.getOrCreateSession(sessionId);
        session.messages.push({
            role: 'user',
            content,
            timestamp: Date.now()
        });
        // 提取并更新上下文
        this.extractContext(session, content);
        // 裁剪历史
        this.trimHistory(session);
    }
    /**
     * 添加助手回复
     */
    addAssistantMessage(sessionId, content) {
        const session = this.getOrCreateSession(sessionId);
        session.messages.push({
            role: 'assistant',
            content,
            timestamp: Date.now()
        });
    }
    /**
     * 获取对话历史（用于LLM）
     */
    getMessagesForLLM(sessionId) {
        const session = this.getOrCreateSession(sessionId);
        // 构建消息列表：系统提示 + 历史对话
        const messages = [
            { role: 'system', content: this.config.systemPrompt },
            ...session.messages
        ];
        return messages;
    }
    /**
     * 获取会话摘要（用于长期记忆）
     */
    getSessionSummary(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return '';
        const parts = [];
        if (session.context.userPreferences.budget) {
            parts.push(`预算: ${session.context.userPreferences.budget}`);
        }
        if (session.context.userPreferences.travelStyle) {
            parts.push(`旅行风格: ${session.context.userPreferences.travelStyle}`);
        }
        if (session.context.mentionedPlaces.length > 0) {
            parts.push(`提过的地方: ${session.context.mentionedPlaces.join(', ')}`);
        }
        if (session.context.currentTrip) {
            parts.push(`当前行程: ${session.context.currentTrip}`);
        }
        return parts.join('\n');
    }
    /**
     * 从用户消息中提取上下文信息
     */
    extractContext(session, content) {
        const ctx = session.context;
        // 提取地点
        const placePatterns = [
            /(?:去|到|在|游|玩)([\u4e00-\u9fa5]{2,}(?:市|省|区|县|镇|景区|公园|山|湖|岛))/g,
            /([\u4e00-\u9fa5]{2,})(?:旅游|旅行|自驾|出发|目的地)/g
        ];
        for (const pattern of placePatterns) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const place = match[1];
                if (!ctx.mentionedPlaces.includes(place)) {
                    ctx.mentionedPlaces.push(place);
                    // 保持最近10个
                    if (ctx.mentionedPlaces.length > 10) {
                        ctx.mentionedPlaces.shift();
                    }
                }
            }
        }
        // 提取预算
        const budgetMatch = content.match(/预算.{0,5}(\d+)(?:元|块|千|k|K|万)/);
        if (budgetMatch) {
            ctx.userPreferences.budget = budgetMatch[0];
        }
        // 提取旅行风格
        if (content.includes('自驾') || content.includes('开车')) {
            ctx.userPreferences.travelStyle = '自驾游';
        }
        if (content.includes('跟团') || content.includes('报团')) {
            ctx.userPreferences.travelStyle = '跟团游';
        }
        if (content.includes('自由行') || content.includes('背包')) {
            ctx.userPreferences.travelStyle = '自由行';
        }
        // 提取日期
        const datePatterns = [
            /(\d{1,2})月(\d{1,2})[日号]/g,
            /(?:下|这|那)(?:周|星期)([一二三四五六日天])/g
        ];
        for (const pattern of datePatterns) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                if (!ctx.mentionedDates.includes(match[0])) {
                    ctx.mentionedDates.push(match[0]);
                    if (ctx.mentionedDates.length > 5) {
                        ctx.mentionedDates.shift();
                    }
                }
            }
        }
    }
    /**
     * 裁剪历史，保持在限制内
     */
    trimHistory(session) {
        // 按消息数量裁剪
        if (session.messages.length > this.config.maxHistoryLength) {
            // 保留最近的消息
            const keepCount = this.config.maxHistoryLength;
            session.messages = session.messages.slice(-keepCount);
        }
    }
    /**
     * 清除会话
     */
    clearSession(sessionId) {
        this.sessions.delete(sessionId);
    }
    /**
     * 获取所有会话ID
     */
    getSessionIds() {
        return Array.from(this.sessions.keys());
    }
    /**
     * 获取会话数量
     */
    getSessionCount() {
        return this.sessions.size;
    }
}
//# sourceMappingURL=chat-manager.js.map