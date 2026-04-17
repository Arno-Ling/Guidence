/**
 * 智游伴侣 - 会话临时记忆
 * 存储当前对话的临时上下文，节省token成本
 */

import * as fs from 'fs';
import * as path from 'path';

export interface SessionMemory {
  sessionId: string;
  userId: string;
  
  // 当前对话目标
  currentGoal?: string;  // 如："规划杭州三日游"
  
  // 当前提及的信息
  mentionedPlaces: string[];      // 提到的地点
  mentionedDates: string[];       // 提到的日期
  mentionedPeople?: number;       // 出行人数
  
  // 临时决策记录
  decisions: Array<{
    type: string;           // 如：选择酒店、选择路线
    choice: string;         // 做出的选择
    timestamp: number;
  }>;
  
  // 搜索结果缓存（避免重复调用API）
  cachedSearchResults: Map<string, {
    data: unknown;
    timestamp: number;
    ttl: number;  // 过期时间（毫秒）
  }>;
  
  // 临时偏好（本次对话中的临时更改）
  temporaryOverrides: {
    budgetOverride?: { min: number; max: number };
    destinationOverride?: string[];
    other?: Record<string, unknown>;
  };
  
  // 元数据
  createdAt: number;
  updatedAt: number;
}

export class SessionMemoryStore {
  private dataDir: string;
  private sessions: Map<string, SessionMemory> = new Map();

  constructor(dataDir: string = './data/sessions') {
    this.dataDir = dataDir;
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  private getFilePath(sessionId: string): string {
    return path.join(this.dataDir, `${sessionId}_memory.json`);
  }

  /**
   * 获取或创建会话记忆
   */
  getOrCreate(sessionId: string, userId: string): SessionMemory {
    // 先从内存缓存获取
    if (this.sessions.has(sessionId)) {
      return this.sessions.get(sessionId)!;
    }

    // 尝试从文件加载
    const filePath = this.getFilePath(sessionId);
    if (fs.existsSync(filePath)) {
      try {
        const data = fs.readFileSync(filePath, 'utf-8');
        const memory = JSON.parse(data) as SessionMemory;
        // 恢复Map类型
        memory.cachedSearchResults = new Map(Object.entries(memory.cachedSearchResults || {}));
        this.sessions.set(sessionId, memory);
        return memory;
      } catch (error) {
        console.error(`Failed to load session ${sessionId}:`, error);
      }
    }

    // 创建新的
    const memory: SessionMemory = {
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
  setGoal(sessionId: string, userId: string, goal: string): void {
    const memory = this.getOrCreate(sessionId, userId);
    memory.currentGoal = goal;
    memory.updatedAt = Date.now();
  }

  /**
   * 添加提及的地点
   */
  addMentionedPlace(sessionId: string, userId: string, place: string): void {
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
  addMentionedDate(sessionId: string, userId: string, date: string): void {
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
  addDecision(sessionId: string, userId: string, type: string, choice: string): void {
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
  cacheSearchResult(sessionId: string, userId: string, key: string, data: unknown, ttl: number = 300000): void {
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
  getCachedResult(sessionId: string, userId: string, key: string): unknown | null {
    const memory = this.getOrCreate(sessionId, userId);
    const cached = memory.cachedSearchResults.get(key);
    
    if (!cached) return null;
    
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
  setTemporaryBudget(sessionId: string, userId: string, min: number, max: number): void {
    const memory = this.getOrCreate(sessionId, userId);
    memory.temporaryOverrides.budgetOverride = { min, max };
    memory.updatedAt = Date.now();
  }

  /**
   * 获取摘要（用于LLM提示词）
   */
  getSummary(sessionId: string, userId: string): string {
    const memory = this.getOrCreate(sessionId, userId);
    const parts: string[] = [];

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
  save(sessionId: string): void {
    const memory = this.sessions.get(sessionId);
    if (!memory) return;

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
  clear(sessionId: string): void {
    this.sessions.delete(sessionId);
    const filePath = this.getFilePath(sessionId);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  /**
   * 保存所有会话
   */
  saveAll(): void {
    for (const sessionId of this.sessions.keys()) {
      this.save(sessionId);
    }
  }
}
