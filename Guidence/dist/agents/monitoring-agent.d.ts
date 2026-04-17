/**
 * 智游伴侣 - 监控智能体
 * 负责实时监控天气、路况、行程状态等
 */
import { BaseAgent } from '../core/gateway.js';
import type { AgentMessage, AgentConfig, Result } from '../types/index.js';
interface MonitoringAgentConfig extends AgentConfig {
    enableRealTimeMonitoring: boolean;
    monitoringInterval: number;
    alertThresholds: {
        weatherSeverity: 'low' | 'medium' | 'high';
        trafficDelayMinutes: number;
        budgetOverrunPercent: number;
    };
}
export declare class MonitoringAgent extends BaseAgent {
    protected config: MonitoringAgentConfig;
    private monitoringInterval?;
    private monitoredTrips;
    constructor(config: MonitoringAgentConfig);
    start(): Promise<void>;
    stop(): Promise<void>;
    process(message: AgentMessage): Promise<Result<AgentMessage>>;
    private startMonitoringLoop;
    private checkAllMonitoredTrips;
    private checkTripStatus;
    private handleStartMonitoring;
    private handleStopMonitoring;
    private handleGetAlerts;
    private handleCheckWeather;
    private handleCheckTraffic;
    private handleGetMonitoringStatus;
}
export {};
//# sourceMappingURL=monitoring-agent.d.ts.map