/**
 * 智游伴侣 - 配置管理
 */

import { config } from 'dotenv';
import type { TravelCompanionConfig } from '../types/index.js';

// Load environment variables
config();

export function loadConfig(): TravelCompanionConfig {
  return {
    appName: process.env.APP_NAME || '智游伴侣',
    version: process.env.APP_VERSION || '1.0.0',
    debug: process.env.DEBUG === 'true',
    logLevel: (process.env.LOG_LEVEL as TravelCompanionConfig['logLevel']) || 'info',

    // API Keys
    amapApiKey: process.env.AMAP_API_KEY,
    amapSecurityCode: process.env.AMAP_SECURITY_CODE,
    qweatherApiKey: process.env.QWEATHER_API_KEY,
    openaiApiKey: process.env.OPENAI_API_KEY,
    openaiBaseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    openaiModel: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',

    // Database
    databaseUrl: process.env.DATABASE_URL,

    // Cache
    redisUrl: process.env.REDIS_URL,
    enableCache: process.env.ENABLE_CACHE !== 'false',

    // Browser
    browserHeadless: process.env.BROWSER_HEADLESS !== 'false',
    browserTimeout: parseInt(process.env.BROWSER_TIMEOUT || '30000'),
    enableBrowserAutomation: process.env.ENABLE_BROWSER_AUTOMATION === 'true',

    // Features
    enableRealTimeMonitoring: process.env.ENABLE_REAL_TIME_MONITORING !== 'false',
    enableLlm: process.env.ENABLE_LLM !== 'false'
  };
}

export function validateConfig(config: TravelCompanionConfig): void {
  const errors: string[] = [];

  // Check required API keys
  if (!config.amapApiKey) {
    errors.push('AMAP_API_KEY is required');
  }

  if (config.enableLlm && !config.openaiApiKey) {
    errors.push('OPENAI_API_KEY is required when LLM is enabled');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.join('\n')}`);
  }
}

export function printConfigSummary(config: TravelCompanionConfig): void {
  console.log('\n' + '='.repeat(50));
  console.log(`App Name: ${config.appName}`);
  console.log(`Version: ${config.version}`);
  console.log(`Debug: ${config.debug}`);
  console.log(`Log Level: ${config.logLevel}`);
  console.log('-'.repeat(50));
  console.log(`Map API: ${config.amapApiKey ? 'Configured' : 'Not configured'}`);
  console.log(`Weather API: ${config.qweatherApiKey ? 'Configured' : 'Not configured'}`);
  console.log(`LLM API: ${config.openaiApiKey ? 'Configured' : 'Not configured'}`);
  console.log('-'.repeat(50));
  console.log(`Cache: ${config.enableCache ? 'Enabled' : 'Disabled'}`);
  console.log(`Browser Automation: ${config.enableBrowserAutomation ? 'Enabled' : 'Disabled'}`);
  console.log(`Real-time Monitoring: ${config.enableRealTimeMonitoring ? 'Enabled' : 'Disabled'}`);
  console.log('='.repeat(50) + '\n');
}
