/**
 * 智游伴侣 - 核心网关
 * 基于OpenClaw Gateway架构
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import type {
  AgentMessage,
  AgentConfig,
  AgentState,
  AgentCapability,
  Session,
  Task,
  TaskStatus,
  TravelCompanionConfig,
  Event,
  EventHandler,
  Result
} from '../types/index.js';
import { ok, err } from '../types/index.js';

// ==================== 智能体基类 ====================

export abstract class BaseAgent extends EventEmitter {
  protected config: AgentConfig;
  protected state: AgentState = 'idle';
  protected logger: Console;

  constructor(config: AgentConfig) {
    super();
    this.config = config;
    this.logger = console;
  }

  get id(): string {
    return this.config.id;
  }

  get name(): string {
    return this.config.name;
  }

  get currentState(): AgentState {
    return this.state;
  }

  get capabilities(): AgentCapability[] {
    return this.config.capabilities;
  }

  abstract process(message: AgentMessage): Promise<Result<AgentMessage>>;

  async start(): Promise<void> {
    this.state = 'idle';
    this.logger.info(`[Agent:${this.name}] Started`);
  }

  async stop(): Promise<void> {
    this.state = 'stopped';
    this.logger.info(`[Agent:${this.name}] Stopped`);
  }

  protected setState(state: AgentState): void {
    const oldState = this.state;
    this.state = state;
    this.emit('stateChanged', { oldState, newState: state });
  }
}

// ==================== 网关类 ====================

export class Gateway extends EventEmitter {
  private config: TravelCompanionConfig;
  private agents: Map<string, BaseAgent> = new Map();
  private sessions: Map<string, Session> = new Map();
  private tasks: Map<string, Task> = new Map();
  private taskQueue: string[] = [];
  private isRunning = false;
  private processingInterval?: NodeJS.Timeout;

  constructor(config: TravelCompanionConfig) {
    super();
    this.config = config;
  }

  // ==================== 生命周期 ====================

  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Gateway is already running');
    }

    this.isRunning = true;
    this.startTaskProcessing();
    this.emit('started');
    console.log('[Gateway] Started');
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }

    // Stop all agents
    for (const agent of Array.from(this.agents.values())) {
      await agent.stop();
    }

    this.emit('stopped');
    console.log('[Gateway] Stopped');
  }

  // ==================== 智能体管理 ====================

  registerAgent(agent: BaseAgent): void {
    if (this.agents.has(agent.id)) {
      throw new Error(`Agent ${agent.id} already registered`);
    }

    this.agents.set(agent.id, agent);
    agent.start();
    this.emit('agentRegistered', { agentId: agent.id });
    console.log(`[Gateway] Agent registered: ${agent.name}`);
  }

  unregisterAgent(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.stop();
      this.agents.delete(agentId);
      this.emit('agentUnregistered', { agentId });
      console.log(`[Gateway] Agent unregistered: ${agent.name}`);
    }
  }

  getAgent(agentId: string): BaseAgent | undefined {
    return this.agents.get(agentId);
  }

  getAgentsByCapability(capability: string): BaseAgent[] {
    return Array.from(this.agents.values()).filter(agent =>
      agent.capabilities.some(cap => cap.name === capability)
    );
  }

  // ==================== 会话管理 ====================

  createSession(userId?: string): Session {
    const session: Session = {
      id: uuidv4(),
      userId,
      createdAt: new Date(),
      lastActiveAt: new Date(),
      context: {},
      messages: []
    };

    this.sessions.set(session.id, session);
    this.emit('sessionCreated', { sessionId: session.id });
    return session;
  }

  getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  updateSession(sessionId: string, updates: Partial<Session>): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      Object.assign(session, updates, { lastActiveAt: new Date() });
      this.sessions.set(sessionId, session);
    }
  }

  // ==================== 任务管理 ====================

  async createTask(
    title: string,
    input: Record<string, unknown>,
    options: {
      conversationId?: string;
      priority?: 'low' | 'normal' | 'high' | 'urgent';
      requiresApproval?: boolean;
      approvalType?: Task['approvalType'];
    } = {}
  ): Promise<Task> {
    const task: Task = {
      id: uuidv4(),
      conversationId: options.conversationId || uuidv4(),
      title,
      status: 'pending',
      priority: options.priority || 'normal',
      input,
      assignedAgents: [],
      requiresApproval: options.requiresApproval || false,
      approvalType: options.approvalType,
      createdAt: new Date()
    };

    this.tasks.set(task.id, task);
    this.taskQueue.push(task.id);
    this.emit('taskCreated', { taskId: task.id });
    
    return task;
  }

  getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  approveTask(taskId: string, approver: string): boolean {
    const task = this.tasks.get(taskId);
    if (task && task.status === 'waiting_approval') {
      task.status = 'pending';
      this.taskQueue.push(taskId);
      this.emit('taskApproved', { taskId, approver });
      return true;
    }
    return false;
  }

  rejectTask(taskId: string, approver: string, reason: string): boolean {
    const task = this.tasks.get(taskId);
    if (task && task.status === 'waiting_approval') {
      task.status = 'failed';
      task.error = `Rejected by ${approver}: ${reason}`;
      this.emit('taskRejected', { taskId, approver, reason });
      return true;
    }
    return false;
  }

  // ==================== 消息处理 ====================

  async processUserMessage(
    userInput: string,
    userId?: string,
    sessionId?: string,
    context?: Record<string, unknown>
  ): Promise<Result<{ response: string; sessionId: string }>> {
    try {
      // Get or create session
      let session: Session;
      if (sessionId) {
        const existing = this.getSession(sessionId);
        if (!existing) {
          return err(new Error('Session not found'));
        }
        session = existing;
      } else {
        session = this.createSession(userId);
      }

      // Add user message to session
      session.messages.push({
        role: 'user',
        content: userInput,
        timestamp: new Date()
      });

      // Create task
      const task = await this.createTask(
        `User: ${userInput.substring(0, 50)}...`,
        { userInput, context },
        { conversationId: session.id }
      );

      // Wait for task completion
      const result = await this.waitForTask(task.id);

      if (!result.success) {
        return err((result as { success: false; error: Error }).error);
      }

      // Get response
      const response = result.data.output?.response as string || 'Task completed';

      // Add assistant response to session
      session.messages.push({
        role: 'assistant',
        content: response,
        timestamp: new Date()
      });

      this.updateSession(session.id, session);

      return ok({ response, sessionId: session.id });

    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  // ==================== 内部方法 ====================

  private startTaskProcessing(): void {
    this.processingInterval = setInterval(() => {
      this.processNextTask();
    }, 100);
  }

  private async processNextTask(): Promise<void> {
    if (this.taskQueue.length === 0) {
      return;
    }

    const taskId = this.taskQueue.shift();
    if (!taskId) {
      return;
    }

    const task = this.tasks.get(taskId);
    if (!task || task.status !== 'pending') {
      return;
    }

    task.status = 'processing';
    task.startedAt = new Date();

    try {
      // Find appropriate agent
      const agent = this.findAgentForTask(task);
      if (!agent) {
        throw new Error('No agent available for task');
      }

      // Assign agent to task
      task.assignedAgents.push(agent.id);

      // Process with agent
      const message: AgentMessage = {
        id: uuidv4(),
        conversationId: task.conversationId,
        timestamp: new Date(),
        sender: 'gateway',
        receiver: agent.id,
        content: task.input
      };

      const result = await agent.process(message);

      if (result.success) {
        task.status = 'completed';
        task.output = result.data.content;
      } else {
        task.status = 'failed';
        task.error = (result as { success: false; error: Error }).error.message;
      }

    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : String(error);
    }

    task.completedAt = new Date();
    this.emit('taskCompleted', { taskId: task.id, status: task.status });
  }

  private findAgentForTask(task: Task): BaseAgent | undefined {
    // Simple implementation: return first available agent
    // In a real implementation, this would use task analysis to find the best agent
    for (const agent of Array.from(this.agents.values())) {
      if (agent.currentState === 'idle') {
        return agent;
      }
    }
    return undefined;
  }

  private async waitForTask(
    taskId: string,
    timeout: number = 60000
  ): Promise<Result<Task>> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const task = this.tasks.get(taskId);
      
      if (!task) {
        return err(new Error('Task not found'));
      }

      if (task.status === 'completed') {
        return ok(task);
      }

      if (task.status === 'failed') {
        return err(new Error(task.error || 'Task failed'));
      }

      if (task.status === 'waiting_approval') {
        return err(new Error('Task requires approval'));
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return err(new Error('Task timeout'));
  }

  // ==================== 状态查询 ====================

  getStatus(): {
    isRunning: boolean;
    agentsCount: number;
    activeSessions: number;
    pendingTasks: number;
    processingTasks: number;
  } {
    const pendingTasks = Array.from(this.tasks.values())
      .filter(t => t.status === 'pending').length;
    const processingTasks = Array.from(this.tasks.values())
      .filter(t => t.status === 'processing').length;

    return {
      isRunning: this.isRunning,
      agentsCount: this.agents.size,
      activeSessions: this.sessions.size,
      pendingTasks,
      processingTasks
    };
  }
}
