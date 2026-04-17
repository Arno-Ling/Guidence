/**
 * 智游伴侣 - 信息采集智能体
 * 负责POI搜索、天气查询、路况信息等
 */
import { BaseAgent } from '../core/gateway.js';
import type { AgentMessage, AgentConfig, Result } from '../types/index.js';
interface InformationAgentConfig extends AgentConfig {
    amapApiKey?: string;
    qweatherApiKey?: string;
    enableCache: boolean;
    cacheTimeout: number;
}
export declare class InformationAgent extends BaseAgent {
    private mapService?;
    private weatherService?;
    protected config: InformationAgentConfig;
    constructor(config: InformationAgentConfig);
    start(): Promise<void>;
    process(message: AgentMessage): Promise<Result<AgentMessage>>;
    private handleSearchPOI;
    private handleGetWeather;
    private handleGetTraffic;
}
export {};
//# sourceMappingURL=information-agent.d.ts.map