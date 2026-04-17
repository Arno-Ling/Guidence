/**
 * 智游伴侣 - 会话临时记忆
 * 存储当前对话的临时上下文，节省token成本
 */
import * as fs from 'fs';
import * as path from 'path';
export class SessionMemoryStore {
    dataDir;
    sessions = new Map();
    constructor(dataDir = './data/sessions') {
        this.dataDir = dataDir;
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }
    }
    getFilePath(sessionId) {
        return path.join(this.dataDir, `${sessionId}_memory.json`);
    }
    /**
     * 获取或创建会话记忆
     */
    getOrCreate(sessionId, userId) {
        // 先从内存缓存获取
        if (this.sessions.has(sessionId)) {
            return this.sessions.get(sessionId);
        }
        // 尝试从文件加载
        const filePath = this.getFilePath(sessionId);
        if (fs.existsSync(filePath)) {
            try {
                const data = fs.readFileSync(filePath, 'utf-8');
                const memory = JSON.parse(data);
                // 恢复Map类型
                memory.cachedSearchResults = new Map(Object.entries(memory.cachedSearchResults || {}));
                this.sessions.set(sessionId, memory);
                return memory;
            }
            catch (error) {
                console.error(`Failed to load session ${sessionId}:`, error);
            }
        }
        // 创建新的
        const memory = {
            sessionId,
            userId,
            mentionedPlaces: [],
            mentionedDates: [],
            decisions: [],
            cachedSearchResults: new Map(),
            temporaryOverrides: {},
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        this.sessions.set(sessionId, memory);
        return memory;
    }
    /**
     * 更新当前目标
     */
    setGoal(sessionId, userId, goal) {
        const memory = this.getOrCreate(sessionId, userId);
        memory.currentGoal = goal;
        memory.updatedAt = Date.now();
    }
    /**
     * 添加提及的地点
     */
    addMentionedPlace(sessionId, userId, place) {
        const memory = this.getOrCreate(sessionId, userId);
        if (!memory.mentionedPlaces.includes(place)) {
            memory.mentionedPlaces.push(place);
            // 保持最近10个
            if (memory.mentionedPlaces.length > 10) {
                memory.mentionedPlaces.shift();
            }
            memory.updatedAt = Date.now();
        }
    }
    /**
     * 添加提及的日期
     */
    addMentionedDate(sessionId, userId, date) {
        const memory = this.getOrCreate(sessionId, userId);
        if (!memory.mentionedDates.includes(date)) {
            memory.mentionedDates.push(date);
            if (memory.mentionedDates.length > 5) {
                memory.mentionedDates.shift();
            }
            memory.updatedAt = Date.now();
        }
    }
    /**
     * 记录决策
     */
    addDecision(sessionId, userId, type, choice) {
        const memory = this.getOrCreate(sessionId, userId);
        memory.decisions.push({
            type,
            choice,
            timestamp: Date.now()
        });
        memory.updatedAt = Date.now();
    }
    /**
     * 缓存搜索结果
     */
    cacheSearchResult(sessionId, userId, key, data, ttl = 300000) {
        const memory = this.getOrCreate(sessionId, userId);
        memory.cachedSearchResults.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        });
        memory.updatedAt = Date.now();
    }
    /**
     * 获取缓存的搜索结果
     */
    getCachedResult(sessionId, userId, key) {
        const memory = this.getOrCreate(sessionId, userId);
        const cached = memory.cachedSearchResults.get(key);
        if (!cached)
            return null;
        // 检查是否过期
        if (Date.now() - cached.timestamp > cached.ttl) {
            memory.cachedSearchResults.delete(key);
            return null;
        }
        return cached.data;
    }
    /**
     * 设置临时预算覆盖
     */
    setTemporaryBudget(sessionId, userId, min, max) {
        const memory = this.getOrCreate(sessionId, userId);
        memory.temporaryOverrides.budgetOverride = { min, max };
        memory.updatedAt = Date.now();
    }
    /**
     * 获取摘要（用于LLM提示词）
     */
    getSummary(sessionId, userId) {
        const memory = this.getOrCreate(sessionId, userId);
        const parts = [];
        if (memory.currentGoal) {
            parts.push(`当前目标: ${memory.currentGoal}`);
        }
        if (memory.mentionedPlaces.length > 0) {
            parts.push(`本次提到的地点: ${memory.mentionedPlaces.join(', ')}`);
        }
        if (memory.mentionedDates.length > 0) {
            parts.push(`本次提到的日期: ${memory.mentionedDates.join(', ')}`);
        }
        if (memory.mentionedPeople) {
            parts.push(`出行人数: ${memory.mentionedPeople}人`);
        }
        if (memory.decisions.length > 0) {
            const recentDecisions = memory.decisions.slice(-3);
            parts.push('最近决策:');
            recentDecisions.forEach(d => {
                parts.push(`  - ${d.type}: ${d.choice}`);
            });
        }
        if (memory.temporaryOverrides.budgetOverride) {
            const b = memory.temporaryOverrides.budgetOverride;
            parts.push(`本次临时预算: ${b.min}-${b.max}元`);
        }
        return parts.length > 0
            ? `当前会话信息:\n${parts.join('\n')}`
            : '';
    }
    /**
     * 保存到文件
     */
    save(sessionId) {
        const memory = this.sessions.get(sessionId);
        if (!memory)
            return;
        const filePath = this.getFilePath(sessionId);
        // 将Map转换为普通对象以便序列化
        const toSave = {
            ...memory,
            cachedSearchResults: Object.fromEntries(memory.cachedSearchResults)
        };
        fs.writeFileSync(filePath, JSON.stringify(toSave, null, 2), 'utf-8');
    }
    /**
     * 清除会话
     */
    clear(sessionId) {
        this.sessions.delete(sessionId);
        const filePath = this.getFilePath(sessionId);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
    /**
     * 保存所有会话
     */
    saveAll() {
        for (const sessionId of this.sessions.keys()) {
            this.save(sessionId);
        }
    }
}
//# sourceMappingURL=session-memory.js.map