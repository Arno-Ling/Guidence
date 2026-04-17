/**
 * 智游伴侣 - 监控智能体
 * 负责实时监控天气、路况、行程状态等
 */

import { BaseAgent } from '../core/gateway.js';
import type {
  AgentMessage,
  AgentConfig,
  Location,
  Result
} from '../types/index.js';
import { ok, err } from '../types/index.js';

// ==================== 配置 ====================

interface MonitoringAgentConfig extends AgentConfig {
  enableRealTimeMonitoring: boolean;
  monitoringInterval: number; // 监控间隔（秒）
  alertThresholds: {
    weatherSeverity: 'low' | 'medium' | 'high';
    trafficDelayMinutes: number;
    budgetOverrunPercent: number;
  };
}

// ==================== 智能体实现 ====================

export class MonitoringAgent extends BaseAgent {
  protected config: MonitoringAgentConfig;
  private monitoringInterval?: NodeJS.Timeout;
  private monitoredTrips: Map<string, {
    tripId: string;
    userId: string;
    locations: Location[];
    startDate: Date;
    endDate: Date;
    lastCheck: Date;
  }> = new Map();

  constructor(config: MonitoringAgentConfig) {
    super({
      id: config.id,
      name: config.name || '监控助手',
      description: config.description || '负责实时监控旅行相关状态',
      capabilities: [
        {
          name: 'start_monitoring',
          description: '开始监控行程',
          parameters: { tripId: '行程ID', userId: '用户ID', locations: '监控位置列表' }
        },
        {
          name: 'stop_monitoring',
          description: '停止监控行程',
          parameters: { tripId: '行程ID' }
        },
        {
          name: 'get_alerts',
          description: '获取警报信息',
          parameters: { tripId: '行程ID', severity: '严重程度' }
        },
        {
          name: 'check_weather',
          description: '检查天气状况',
          parameters: { location: '位置', tripId: '行程ID' }
        },
        {
          name: 'check_traffic',
          description: '检查路况信息',
          parameters: { origin: '起点', destination: '终点', tripId: '行程ID' }
        },
        {
          name: 'get_monitoring_status',
          description: '获取监控状态',
          parameters: { tripId: '行程ID' }
        }
      ]
    });

    this.config = config;
  }

  async start(): Promise<void> {
    await super.start();
    
    if (this.config.enableRealTimeMonitoring) {
      this.startMonitoringLoop();
    }
    
    console.log('[MonitoringAgent] 监控智能体已启动');
  }

  async stop(): Promise<void> {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    await super.stop();
    console.log('[MonitoringAgent] 监控智能体已停止');
  }

  async process(message: AgentMessage): Promise<Result<AgentMessage>> {
    try {
      this.setState('busy');

      const action = message.content.action as string;
      let responseContent: Record<string, unknown> = {};

      switch (action) {
        case 'start_monitoring':
          responseContent = await this.handleStartMonitoring(message.content);
          break;

        case 'stop_monitoring':
          responseContent = await this.handleStopMonitoring(message.content);
          break;

        case 'get_alerts':
          responseContent = await this.handleGetAlerts(message.content);
          break;

        case 'check_weather':
          responseContent = await this.handleCheckWeather(message.content);
          break;

        case 'check_traffic':
          responseContent = await this.handleCheckTraffic(message.content);
          break;

        case 'get_monitoring_status':
          responseContent = await this.handleGetMonitoringStatus(message.content);
          break;

        default:
          throw new Error(`Unknown action: ${action}`);
      }

      this.setState('idle');

      return ok({
        id: message.id,
        conversationId: message.conversationId,
        timestamp: new Date(),
        sender: this.id,
        receiver: message.sender,
        content: responseContent
      });

    } catch (error) {
      this.setState('error');
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  private startMonitoringLoop(): void {
    this.monitoringInterval = setInterval(async () => {
      await this.checkAllMonitoredTrips();
    }, this.config.monitoringInterval * 1000);
  }

  private async checkAllMonitoredTrips(): Promise<void> {
    const now = new Date();
    
    for (const [tripId, trip] of Array.from(this.monitoredTrips)) {
      try {
        // 检查是否在监控时间范围内
        if (now >= trip.startDate && now <= trip.endDate) {
          await this.checkTripStatus(tripId, trip);
        }
        
        // 更新最后检查时间
        trip.lastCheck = now;
        
      } catch (error) {
        console.error(`[MonitoringAgent] 监控行程 ${tripId} 时出错:`, error);
      }
    }
  }

  private async checkTripStatus(tripId: string, trip: any): Promise<void> {
    console.log(`[MonitoringAgent] 检查行程 ${tripId} 状态`);
    
    // TODO: 实现实际的监控逻辑
    // 1. 检查天气
    // 2. 检查路况
    // 3. 检查预算
    // 4. 生成警报
  }

  private async handleStartMonitoring(content: Record<string, unknown>): Promise<Record<string, unknown>> {
    const tripId = content.tripId as string;
    const userId = content.userId as string;
    const locations = content.locations as Location[];
    const startDate = new Date(content.startDate as string);
    const endDate = new Date(content.endDate as string);

    console.log(`[MonitoringAgent] 开始监控行程: ${tripId}`);

    this.monitoredTrips.set(tripId, {
      tripId,
      userId,
      locations,
      startDate,
      endDate,
      lastCheck: new Date()
    });

    return {
      success: true,
      action: 'start_monitoring',
      tripId,
      message: `行程 ${tripId} 开始监控`,
      monitoringInterval: this.config.monitoringInterval,
      alertThresholds: this.config.alertThresholds
    };
  }

  private async handleStopMonitoring(content: Record<string, unknown>): Promise<Record<string, unknown>> {
    const tripId = content.tripId as string;

    console.log(`[MonitoringAgent] 停止监控行程: ${tripId}`);

    this.monitoredTrips.delete(tripId);

    return {
      success: true,
      action: 'stop_monitoring',
      tripId,
      message: `行程 ${tripId} 已停止监控`
    };
  }

  private async handleGetAlerts(content: Record<string, unknown>): Promise<Record<string, unknown>> {
    const tripId = content.tripId as string;
    const severity = content.severity as string || 'all';

    console.log(`[MonitoringAgent] 获取警报: ${tripId}, 严重程度: ${severity}`);

    // TODO: 实现实际的警报获取逻辑

    return {
      success: true,
      action: 'get_alerts',
      tripId,
      severity,
      alerts: [
        {
          id: 'alert_1',
          type: 'weather',
          severity: 'medium',
          message: '预计下午有雨，建议调整户外活动计划',
          timestamp: new Date().toISOString(),
          location: '西湖风景区'
        }
      ],
      count: 1
    };
  }

  private async handleCheckWeather(content: Record<string, unknown>): Promise<Record<string, unknown>> {
    const location = content.location as Location;
    const tripId = content.tripId as string;

    console.log(`[MonitoringAgent] 检查天气: ${location.city || location.address}`);

    // TODO: 实现实际的天气检查逻辑

    return {
      success: true,
      action: 'check_weather',
      tripId,
      location,
      weather: {
        temperature: 22,
        condition: '晴',
        humidity: 65,
        windSpeed: 12,
        forecast: [
          { time: '14:00', temperature: 24, condition: '多云' },
          { time: '16:00', temperature: 23, condition: '晴' }
        ]
      },
      alert: null
    };
  }

  private async handleCheckTraffic(content: Record<string, unknown>): Promise<Record<string, unknown>> {
    const origin = content.origin as Location;
    const destination = content.destination as Location;
    const tripId = content.tripId as string;

    console.log(`[MonitoringAgent] 检查路况: ${origin.address} -> ${destination.address}`);

    // TODO: 实现实际的路况检查逻辑

    return {
      success: true,
      action: 'check_traffic',
      tripId,
      origin,
      destination,
      traffic: {
        distanceKm: 15.5,
        durationMinutes: 35,
        condition: 'smooth',
        incidents: [],
        alternativeRoutes: []
      },
      alert: null
    };
  }

  private async handleGetMonitoringStatus(content: Record<string, unknown>): Promise<Record<string, unknown>> {
    const tripId = content.tripId as string;

    console.log(`[MonitoringAgent] 获取监控状态: ${tripId}`);

    const trip = this.monitoredTrips.get(tripId);

    if (!trip) {
      return {
        success: false,
        action: 'get_monitoring_status',
        tripId,
        error: '行程未在监控中'
      };
    }

    return {
      success: true,
      action: 'get_monitoring_status',
      tripId,
      status: 'monitoring',
      lastCheck: trip.lastCheck.toISOString(),
      startDate: trip.startDate.toISOString(),
      endDate: trip.endDate.toISOString(),
      locationsCount: trip.locations.length,
      monitoringInterval: this.config.monitoringInterval
    };
  }
}