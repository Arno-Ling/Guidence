/**
 * 智游伴侣 - 主入口
 * 基于OpenClaw架构的旅行AI系统
 */
import { Gateway } from './core/gateway.js';
import { ToolRegistry } from './tools/index.js';
declare class TravelCompanion {
    private config;
    private gateway;
    private toolRegistry;
    private isRunning;
    constructor();
    start(): Promise<void>;
    stop(): Promise<void>;
    private registerTools;
    private registerAgents;
    chat(userInput: string, userId?: string): Promise<{
        success: boolean;
        response: string;
        sessionId: string;
    }>;
    getStatus(): ReturnType<Gateway['getStatus']>;
    getTools(): ReturnType<ToolRegistry['list']>;
}
export { TravelCompanion };
//# sourceMappingURL=index.d.ts.map