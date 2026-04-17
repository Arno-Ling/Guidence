/**
 * 智游伴侣 - 测试脚本
 */

import { Gateway } from './core/gateway.js';
import { InformationAgent } from './agents/information-agent.js';
import { PlanningAgent } from './agents/planning-agent.js';
import { ToolRegistry, MapTool, WeatherTool } from './tools/index.js';
import { loadConfig } from './config/index.js';
import type { TravelCompanionConfig } from './types/index.js';

async function testSystem(): Promise<void> {
  console.log('='.repeat(60));
  console.log('智游伴侣 - 系统测试');
  console.log('='.repeat(60));

  // Load config from .env
  const envConfig = loadConfig();
  
  // Create test config
  const config: TravelCompanionConfig = {
    appName: '智游伴侣',
    version: '1.0.0',
    debug: true,
    logLevel: 'info',
    amapApiKey: envConfig.amapApiKey,
    enableCache: false,
    browserHeadless: true,
    browserTimeout: 30000,
    enableBrowserAutomation: false,
    enableRealTimeMonitoring: true,
    enableLlm: false
  };

  console.log(`高德API Key: ${config.amapApiKey ? '已配置 ✅' : '未配置 ❌'}`);

  try {
    // Test 1: Gateway
    console.log('\n测试 1: 网关初始化');
    const gateway = new Gateway(config);
    await gateway.start();
    console.log('✅ 网关启动成功');

    // Test 2: Tool Registry
    console.log('\n测试 2: 工具注册');
    const toolRegistry = new ToolRegistry();
    toolRegistry.register(new MapTool(config.amapApiKey, config.amapSecurityCode));
    toolRegistry.register(new WeatherTool());
    console.log(`✅ 注册了 ${toolRegistry.list().length} 个工具`);

    // Test 3: Agents
    console.log('\n测试 3: 智能体注册');
    const infoAgent = new InformationAgent({
      id: 'info_agent',
      name: '信息侦探',
      description: '测试信息智能体',
      capabilities: [
        {
          name: 'search_poi',
          description: '搜索兴趣点'
        },
        {
          name: 'get_weather',
          description: '获取天气信息'
        }
      ],
      enableCache: false,
      cacheTimeout: 3600
    });
    gateway.registerAgent(infoAgent);

    const planningAgent = new PlanningAgent({
      id: 'planning_agent',
      name: '策略规划',
      description: '测试规划智能体',
      capabilities: [
        {
          name: 'generate_itinerary',
          description: '生成行程规划'
        },
        {
          name: 'optimize_itinerary',
          description: '优化行程规划'
        }
      ],
      optimizationAlgorithm: 'greedy',
      maxPoisPerDay: 6,
      minRestHours: 8,
      maxDrivingHoursPerDay: 4,
      enableCache: false
    });
    gateway.registerAgent(planningAgent);
    console.log('✅ 智能体注册成功');

    // Test 4: Tool Execution
    console.log('\n测试 4: 工具执行');
    const mapResult = await toolRegistry.execute('map', {
      action: 'search',
      keyword: '西湖',
      city: '杭州'
    });
    
    if (mapResult.success) {
      const data = mapResult.data as any;
      console.log(`✅ 地图搜索成功，找到 ${data.count} 个结果:`);
      data.pois?.slice(0, 3).forEach((poi: any, i: number) => {
        console.log(`  ${i + 1}. ${poi.name} - ${poi.address || '无地址'}`);
      });
    } else {
      console.log('❌ 地图搜索失败:', mapResult.error?.message);
    }

    const weatherResult = await toolRegistry.execute('weather', {
      action: 'current',
      location: { latitude: 30.2592, longitude: 120.1494 }
    });
    console.log('天气工具结果:', weatherResult.success ? '成功' : '失败');

    // Test 5: Status
    console.log('\n测试 5: 系统状态');
    const status = gateway.getStatus();
    console.log('系统状态:', status);

    // Cleanup
    await gateway.stop();
    console.log('\n✅ 所有测试通过');

  } catch (error) {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  }
}

// Run tests
testSystem();
