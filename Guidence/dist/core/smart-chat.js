/**
 * 智游伴侣 - 智能对话管理器
 * 集成用户偏好和会话记忆，优化token使用
 */
import { UserPreferencesStore } from './user-preferences.js';
import { SessionMemoryStore } from './session-memory.js';
export class SmartChatManager {
    userPrefs;
    sessionMemory;
    config;
    // 内存中保留的对话历史（不持久化，节省空间）
    conversationHistory = new Map();
    constructor(config) {
        this.config = {
            maxHistoryTurns: config?.maxHistoryTurns ?? 5, // 只保留最近5轮
            systemPromptTemplate: config?.systemPromptTemplate ?? this.getDefaultTemplate(),
            dataDir: config?.dataDir ?? './data'
        };
        this.userPrefs = new UserPreferencesStore(`${this.config.dataDir}/users`);
        this.sessionMemory = new SessionMemoryStore(`${this.config.dataDir}/sessions`);
    }
    getDefaultTemplate() {
        return `你是智游伴侣，一个AI自驾旅行管家。

{user_preferences}

{session_context}

你的能力：
1. 理解用户的旅行需求
2. 搜索景点、酒店、餐厅等信息
3. 规划自驾行程
4. 提供天气、路况等实时信息

对话原则：
- 友好、专业、有耐心
- 主动询问缺失的关键信息
- 根据用户偏好提供建议
- 记住用户之前提到的信息

请用中文回复，保持自然流畅。`;
    }
    /**
     * 构建系统提示词（动态加载上下文）
     */
    buildSystemPrompt(userId, sessionId) {
        // 加载用户长期偏好（精简版）
        const userPrefsSummary = this.userPrefs.getSummary(userId);
        // 加载会话临时记忆
        const sessionSummary = this.sessionMemory.getSummary(sessionId, userId);
        return this.config.systemPromptTemplate
            .replace('{user_preferences}', userPrefsSummary)
            .replace('{session_context}', sessionSummary || '新对话开始');
    }
    /**
     * 获取完整的对话消息（用于LLM）
     */
    getMessagesForLLM(sessionId, userId) {
        // 构建系统提示词（包含用户偏好和会话上下文）
        const systemPrompt = this.buildSystemPrompt(userId, sessionId);
        // 获取对话历史
        const history = this.conversationHistory.get(sessionId) || [];
        // 只保留最近N轮对话
        const recentHistory = history.slice(-(this.config.maxHistoryTurns * 2));
        return [
            { role: 'system', content: systemPrompt },
            ...recentHistory
        ];
    }
    /**
     * 添加用户消息
     */
    addUserMessage(sessionId, userId, content) {
        // 添加到对话历史
        if (!this.conversationHistory.has(sessionId)) {
            this.conversationHistory.set(sessionId, []);
        }
        this.conversationHistory.get(sessionId).push({
            role: 'user',
            content,
            timestamp: Date.now()
        });
        // 提取并更新会话记忆
        this.extractAndUpdateMemory(sessionId, userId, content);
    }
    /**
     * 添加助手回复
     */
    addAssistantMessage(sessionId, userId, content) {
        if (!this.conversationHistory.has(sessionId)) {
            this.conversationHistory.set(sessionId, []);
        }
        this.conversationHistory.get(sessionId).push({
            role: 'assistant',
            content,
            timestamp: Date.now()
        });
        // 保存会话记忆到文件
        this.sessionMemory.save(sessionId);
    }
    /**
     * 从用户消息中提取信息并更新记忆
     */
    extractAndUpdateMemory(sessionId, userId, content) {
        // 提取地点
        const placePatterns = [
            /(?:去|到|在|游|玩|看|参观)([\u4e00-\u9fa5]{2,}(?:市|省|区|县|镇|景区|公园|山|湖|岛|寺|庙|塔|园|城|宫|殿))/g,
            /([\u4e00-\u9fa5]{2,})(?:旅游|旅行|自驾|出发|目的地|看看|玩玩)/g,
            /(?:想|要|计划)(?:去|到)([\u4e00-\u9fa5]{2,})/g
        ];
        for (const pattern of placePatterns) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const place = match[1];
                if (place.length >= 2 && place.length <= 10) {
                    this.sessionMemory.addMentionedPlace(sessionId, userId, place);
                }
            }
        }
        // 提取日期
        const datePatterns = [
            /(\d{1,2})月(\d{1,2})[日号]/g,
            /(?:下|这|那)(?:周|星期)([一二三四五六日天])/g,
            /(?:明天|后天|大后天|周末|下周)/g,
            /(\d+)(?:天|日|晚)/g
        ];
        for (const pattern of datePatterns) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                this.sessionMemory.addMentionedDate(sessionId, userId, match[0]);
            }
        }
        // 提取人数
        const peopleMatch = content.match(/(\d+)\s*(?:人|个人|位|口)/);
        if (peopleMatch) {
            const memory = this.sessionMemory.getOrCreate(sessionId, userId);
            memory.mentionedPeople = parseInt(peopleMatch[1]);
        }
        // 提取预算并保存到用户偏好
        const budgetMatch = content.match(/预算.{0,5}(\d+)(?:元|块)/);
        if (budgetMatch) {
            const budget = parseInt(budgetMatch[1]);
            this.userPrefs.updateField(userId, 'budgetRange', {
                min: Math.floor(budget * 0.8),
                max: Math.ceil(budget * 1.2),
                unit: 'per_trip'
            });
        }
        // 提取旅行风格
        if (content.includes('自驾') || content.includes('开车')) {
            this.userPrefs.updateField(userId, 'travelStyle', '自驾游');
        }
        // 提取住宿偏好
        const hotelPatterns = [
            { pattern: /(?:快捷|经济|便宜)/, value: '经济型' },
            { pattern: /(?:舒适|中档|三星)/, value: '舒适型' },
            { pattern: /(?:高档|四星|品质)/, value: '高档型' },
            { pattern: /(?:豪华|五星|奢侈)/, value: '豪华型' }
        ];
        for (const { pattern, value } of hotelPatterns) {
            if (pattern.test(content)) {
                this.userPrefs.updateField(userId, 'hotelPreference', value);
                break;
            }
        }
        // 提取目标
        const goalPatterns = [
            /(?:帮我|想|要|计划)(.{2,20}(?:游|旅行|自驾|行程|规划))/,
            /规划(.{2,20})/
        ];
        for (const pattern of goalPatterns) {
            const match = content.match(pattern);
            if (match) {
                this.sessionMemory.setGoal(sessionId, userId, match[1]);
                break;
            }
        }
    }
    /**
     * 获取当前token使用估算
     */
    getTokenEstimate(sessionId, userId) {
        const messages = this.getMessagesForLLM(sessionId, userId);
        // 粗略估算：1个中文字符 ≈ 1.5 token
        const estimateTokens = (text) => Math.ceil(text.length * 1.5);
        const systemTokens = estimateTokens(messages[0].content);
        const historyTokens = messages.slice(1).reduce((sum, m) => sum + estimateTokens(m.content), 0);
        return {
            systemPrompt: systemTokens,
            history: historyTokens,
            total: systemTokens + historyTokens
        };
    }
    /**
     * 更新用户长期偏好
     */
    updateUserPreferences(userId, preferences) {
        this.userPrefs.save(userId, preferences);
    }
    /**
     * 获取用户偏好
     */
    getUserPreferences(userId) {
        return this.userPrefs.load(userId);
    }
    /**
     * 获取会话记忆
     */
    getSessionMemory(sessionId, userId) {
        return this.sessionMemory.getOrCreate(sessionId, userId);
    }
    /**
     * 清除会话
     */
    clearSession(sessionId) {
        this.conversationHistory.delete(sessionId);
        this.sessionMemory.clear(sessionId);
    }
    /**
     * 获取统计信息
     */
    getStats() {
        return {
            activeSessions: this.conversationHistory.size,
            totalUsers: 0 // 需要遍历文件系统获取
        };
    }
}
//# sourceMappingURL=smart-chat.js.map