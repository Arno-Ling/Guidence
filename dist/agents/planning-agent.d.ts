/**
 * 智游伴侣 - 行程规划智能体
 * 负责行程生成、优化和重规划
 */
import { BaseAgent } from '../core/gateway.js';
import type { AgentMessage, AgentConfig, Result } from '../types/index.js';
interface PlanningAgentConfig extends AgentConfig {
    optimizationAlgorithm: 'greedy' | 'simulated_annealing' | 'genetic';
    maxPoisPerDay: number;
    minRestHours: number;
    maxDrivingHoursPerDay: number;
    enableCache: boolean;
}
export declare class PlanningAgent extends BaseAgent {
    private optimizer;
    protected config: PlanningAgentConfig;
    constructor(config: PlanningAgentConfig);
    process(message: AgentMessage): Promise<Result<AgentMessage>>;
    private handleCreateItinerary;
    private handleOptimizeItinerary;
}
export {};
//# sourceMappingURL=planning-agent.d.ts.map