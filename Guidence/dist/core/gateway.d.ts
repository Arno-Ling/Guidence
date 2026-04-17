/**
 * 智游伴侣 - 核心网关
 * 基于OpenClaw Gateway架构
 */
import { EventEmitter } from 'events';
import type { AgentMessage, AgentConfig, AgentState, AgentCapability, Session, Task, TravelCompanionConfig, Result } from '../types/index.js';
export declare abstract class BaseAgent extends EventEmitter {
    protected config: AgentConfig;
    protected state: AgentState;
    protected logger: Console;
    constructor(config: AgentConfig);
    get id(): string;
    get name(): string;
    get currentState(): AgentState;
    get capabilities(): AgentCapability[];
    abstract process(message: AgentMessage): Promise<Result<AgentMessage>>;
    start(): Promise<void>;
    stop(): Promise<void>;
    protected setState(state: AgentState): void;
}
export declare class Gateway extends EventEmitter {
    private config;
    private agents;
    private sessions;
    private tasks;
    private taskQueue;
    private isRunning;
    private processingInterval?;
    constructor(config: TravelCompanionConfig);
    start(): Promise<void>;
    stop(): Promise<void>;
    registerAgent(agent: BaseAgent): void;
    unregisterAgent(agentId: string): void;
    getAgent(agentId: string): BaseAgent | undefined;
    getAgentsByCapability(capability: string): BaseAgent[];
    createSession(userId?: string): Session;
    getSession(sessionId: string): Session | undefined;
    updateSession(sessionId: string, updates: Partial<Session>): void;
    createTask(title: string, input: Record<string, unknown>, options?: {
        conversationId?: string;
        priority?: 'low' | 'normal' | 'high' | 'urgent';
        requiresApproval?: boolean;
        approvalType?: Task['approvalType'];
    }): Promise<Task>;
    getTask(taskId: string): Task | undefined;
    approveTask(taskId: string, approver: string): boolean;
    rejectTask(taskId: string, approver: string, reason: string): boolean;
    processUserMessage(userInput: string, userId?: string, sessionId?: string, context?: Record<string, unknown>): Promise<Result<{
        response: string;
        sessionId: string;
    }>>;
    private startTaskProcessing;
    private processNextTask;
    private findAgentForTask;
    private waitForTask;
    getStatus(): {
        isRunning: boolean;
        agentsCount: number;
        activeSessions: number;
        pendingTasks: number;
        processingTasks: number;
    };
}
//# sourceMappingURL=gateway.d.ts.map