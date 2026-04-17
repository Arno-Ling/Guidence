/**
 * 智游伴侣 - 主入口
 * 基于OpenClaw架构的旅行AI系统
 */

import { Gateway } from './core/gateway.js';
import { InformationAgent } from './agents/information-agent.js';
import { PlanningAgent } from './agents/planning-agent.js';
import { ExecutionAgent } from './agents/execution-agent.js';
import { MonitoringAgent } from './agents/monitoring-agent.js';
import { ToolRegistry, MapTool, WeatherTool, BookingTool, BrowserAutomationTool } from './tools/index.js';
import { loadConfig, validateConfig, printConfigSummary } from './config/index.js';
import type { TravelCompanionConfig } from './types/index.js';

// ==================== 主应用类 ====================

class TravelCompanion {
  private config: TravelCompanionConfig;
  private gateway: Gateway;
  private toolRegistry: ToolRegistry;
  private isRunning = false;

  constructor() {
    this.config = loadConfig();
    this.gateway = new Gateway(this.config);
    this.toolRegistry = new ToolRegistry();
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Travel Companion is already running');
    }

    console.log('='.repeat(60));
    console.log('智游伴侣 - 旅行AI系统启动中...');
    console.log('='.repeat(60));

    try {
      // Validate configuration
      validateConfig(this.config);
      printConfigSummary(this.config);

      // Register tools
      this.registerTools();

      // Register agents
      await this.registerAgents();

      // Start gateway
      await this.gateway.start();

      this.isRunning = true;
      console.log('✅ 系统启动完成');
      console.log('='.repeat(60));

    } catch (error) {
      console.error('❌ 系统启动失败:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    console.log('='.repeat(60));
    console.log('智游伴侣 - 系统关闭中...');

    await this.gateway.stop();
    this.isRunning = false;

    console.log('✅ 系统已关闭');
    console.log('='.repeat(60));
  }

  private registerTools(): void {
    console.log('注册工具...');

    // Register map tool
    const mapTool = new MapTool(this.config.amapApiKey);
    this.toolRegistry.register(mapTool);

    // Register weather tool
    const weatherTool = new WeatherTool(this.config.qweatherApiKey);
    this.toolRegistry.register(weatherTool);

    // Register booking tool
    const bookingTool = new BookingTool();
    this.toolRegistry.register(bookingTool);

    // Register browser automation tool
    const browserTool = new BrowserAutomationTool(
      this.config.browserHeadless,
      this.config.browserTimeout
    );
    this.toolRegistry.register(browserTool);

    console.log(`✅ 已注册 ${this.toolRegistry.list().length} 个工具`);
  }

  private async registerAgents(): Promise<void> {
    console.log('注册智能体...');

    // Register information agent
    const infoAgent = new InformationAgent({
      id: 'information_agent',
      name: '信息侦探',
      description: '负责信息采集和处理',
      capabilities: [
        {
          name: 'search_poi',
          description: '搜索兴趣点'
        },
        {
          name: 'get_weather',
          description: '获取天气信息'
        },
        {
          name: 'get_traffic',
          description: '获取路况信息'
        }
      ],
      amapApiKey: this.config.amapApiKey,
      qweatherApiKey: this.config.qweatherApiKey,
      enableCache: this.config.enableCache,
      cacheTimeout: 3600
    });
    this.gateway.registerAgent(infoAgent);

    // Register planning agent
    const planningAgent = new PlanningAgent({
      id: 'planning_agent',
      name: '策略规划',
      description: '负责行程规划和优化',
      capabilities: [
        {
          name: 'generate_itinerary',
          description: '生成行程规划'
        },
        {
          name: 'optimize_itinerary',
          description: '优化行程规划'
        },
        {
          name: 'replan_itinerary',
          description: '重新规划行程'
        }
      ],
      optimizationAlgorithm: 'greedy',
      maxPoisPerDay: 6,
      minRestHours: 8,
      maxDrivingHoursPerDay: 4,
      enableCache: this.config.enableCache
    });
    this.gateway.registerAgent(planningAgent);

    // Register execution agent
    const executionAgent = new ExecutionAgent({
      id: 'execution_agent',
      name: '执行助手',
      description: '负责执行各种自动化任务',
      capabilities: [
        {
          name: 'browse_web',
          description: '浏览网页获取信息'
        },
        {
          name: 'fill_form',
          description: '填写表单'
        },
        {
          name: 'click_element',
          description: '点击页面元素'
        },
        {
          name: 'navigate_to',
          description: '导航到指定页面'
        },
        {
          name: 'extract_content',
          description: '提取页面内容'
        }
      ],
      enableBrowserAutomation: this.config.enableBrowserAutomation,
      browserHeadless: this.config.browserHeadless,
      browserTimeout: this.config.browserTimeout
    });
    this.gateway.registerAgent(executionAgent);

    // Register monitoring agent
    const monitoringAgent = new MonitoringAgent({
      id: 'monitoring_agent',
      name: '监控助手',
      description: '负责实时监控旅行相关状态',
      capabilities: [
        {
          name: 'start_monitoring',
          description: '开始监控行程'
        },
        {
          name: 'stop_monitoring',
          description: '停止监控行程'
        },
        {
          name: 'get_alerts',
          description: '获取警报信息'
        },
        {
          name: 'check_weather',
          description: '检查天气状况'
        },
        {
          name: 'check_traffic',
          description: '检查路况信息'
        },
        {
          name: 'get_monitoring_status',
          description: '获取监控状态'
        }
      ],
      enableRealTimeMonitoring: this.config.enableRealTimeMonitoring,
      monitoringInterval: 300, // 5分钟检查一次
      alertThresholds: {
        weatherSeverity: 'medium',
        trafficDelayMinutes: 30,
        budgetOverrunPercent: 20
      }
    });
    this.gateway.registerAgent(monitoringAgent);

    console.log(`✅ 已注册 4 个智能体`);
  }

  // ==================== 公共API ====================

  async chat(userInput: string, userId?: string): Promise<{
    success: boolean;
    response: string;
    sessionId: string;
  }> {
    if (!this.isRunning) {
      throw new Error('System is not running');
    }

    const result = await this.gateway.processUserMessage(userInput, userId);

    if (result.success) {
      return {
        success: true,
        response: result.data.response,
        sessionId: result.data.sessionId
      };
    } else {
      return {
        success: false,
        response: (result as { success: false; error: Error }).error.message,
        sessionId: ''
      };
    }
  }

  getStatus(): ReturnType<Gateway['getStatus']> {
    return this.gateway.getStatus();
  }

  getTools(): ReturnType<ToolRegistry['list']> {
    return this.toolRegistry.list();
  }
}

// ==================== CLI入口 ====================

async function main(): Promise<void> {
  const app = new TravelCompanion();

  // Handle graceful shutdown
  const shutdown = async () => {
    console.log('\n接收到关闭信号...');
    await app.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  try {
    await app.start();

    // Test the system
    console.log('\n测试系统...');
    const result = await app.chat('我想去杭州旅游，帮我规划一下');
    console.log('测试结果:', result);

    // Print status
    console.log('\n系统状态:', app.getStatus());
    console.log('可用工具:', app.getTools().map(t => t.name));

    // Keep running
    console.log('\n系统运行中，按 Ctrl+C 退出...');
    await new Promise(() => {}); // Keep alive

  } catch (error) {
    console.error('❌ 错误:', error);
    process.exit(1);
  }
}

// ==================== 导出 ====================

export { TravelCompanion };

// Run if main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
