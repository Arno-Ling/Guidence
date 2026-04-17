/**
 * 智游伴侣 - 执行智能体
 * 负责浏览器自动化、API调用、导航触发等执行任务
 */
import { BaseAgent } from '../core/gateway.js';
import type { AgentMessage, AgentConfig, Result } from '../types/index.js';
interface ExecutionAgentConfig extends AgentConfig {
    enableBrowserAutomation: boolean;
    browserHeadless: boolean;
    browserTimeout: number;
}
export declare class ExecutionAgent extends BaseAgent {
    protected config: ExecutionAgentConfig;
    constructor(config: ExecutionAgentConfig);
    start(): Promise<void>;
    process(message: AgentMessage): Promise<Result<AgentMessage>>;
    private handleBrowseWeb;
    private handleFillForm;
    private handleClickElement;
    private handleNavigateTo;
    private handleExtractContent;
}
export {};
//# sourceMappingURL=execution-agent.d.ts.map