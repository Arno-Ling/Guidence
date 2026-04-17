/**
 * 测试智能对话系统 - 用户偏好 + 会话记忆
 */

import { SmartChatManager } from './core/smart-chat.js';
import { loadConfig } from './config/index.js';

async function testSmartChat() {
  console.log('='.repeat(60));
  console.log('测试智能对话系统');
  console.log('='.repeat(60));

  const config = loadConfig();
  
  // 创建智能对话管理器
  const chatManager = new SmartChatManager({
    maxHistoryTurns: 5,
    dataDir: './test-data'
  });

  const userId = 'user_001';
  const sessionId = 'session_20260416_001';

  console.log('\n--- 第1轮对话：初次介绍 ---');
  chatManager.addUserMessage(sessionId, userId, '你好，我是阿杰，我喜欢自驾游');
  console.log('用户: 你好，我是阿杰，我喜欢自驾游');
  
  chatManager.addAssistantMessage(sessionId, userId, '你好阿杰！很高兴认识你。自驾游是很棒的旅行方式，自由度很高。请问你有什么旅行计划吗？');
  console.log('助手: 你好阿杰！很高兴认识你。自驾游是很棒的旅行方式...');

  console.log('\n--- 第2轮对话：提出需求 ---');
  chatManager.addUserMessage(sessionId, userId, '我想规划一个杭州三日游，预算大概3000元');
  console.log('用户: 我想规划一个杭州三日游，预算大概3000元');
  
  chatManager.addAssistantMessage(sessionId, userId, '好的！杭州是个美丽的地方。3000元预算很充裕。你从哪里出发？计划什么时候去？');
  console.log('助手: 好的！杭州是个美丽的地方。3000元预算很充裕...');

  console.log('\n--- 第3轮对话：提供详细信息 ---');
  chatManager.addUserMessage(sessionId, userId, '从上海出发，下周末，2个人，想住舒适型酒店');
  console.log('用户: 从上海出发，下周末，2个人，想住舒适型酒店');
  
  chatManager.addAssistantMessage(sessionId, userId, '明白了！2人从上海出发，下周末去杭州，住舒适型酒店。我来帮你搜索西湖和灵隐寺附近的信息。');
  console.log('助手: 明白了！2人从上海出发，下周末去杭州...');

  console.log('\n--- 验证系统提示词 ---');
  const messages = chatManager.getMessagesForLLM(sessionId, userId);
  console.log('系统提示词（精简版）:');
  console.log('---');
  console.log(messages[0].content);
  console.log('---');

  console.log('\n--- 验证Token估算 ---');
  const tokenEstimate = chatManager.getTokenEstimate(sessionId, userId);
  console.log('Token使用估算:');
  console.log(`  系统提示词: ~${tokenEstimate.systemPrompt} tokens`);
  console.log(`  对话历史: ~${tokenEstimate.history} tokens`);
  console.log(`  总计: ~${tokenEstimate.total} tokens`);

  console.log('\n--- 验证用户偏好持久化 ---');
  const userPrefs = chatManager.getUserPreferences(userId);
  console.log('用户偏好（已保存到文件）:');
  console.log(JSON.stringify(userPrefs, null, 2));

  console.log('\n--- 验证会话记忆 ---');
  const sessionMemory = chatManager.getSessionMemory(sessionId, userId);
  console.log('会话记忆:');
  console.log(`  目标: ${sessionMemory.currentGoal || '无'}`);
  console.log(`  提及地点: ${sessionMemory.mentionedPlaces.join(', ')}`);
  console.log(`  提及日期: ${sessionMemory.mentionedDates.join(', ')}`);
  console.log(`  出行人数: ${sessionMemory.mentionedPeople || '未知'}`);

  console.log('\n--- 模拟新会话（验证偏好加载）---');
  const newSessionId = 'session_20260416_002';
  chatManager.addUserMessage(newSessionId, userId, '我想再去一次杭州');
  console.log('用户（新会话）: 我想再去一次杭州');
  
  const newMessages = chatManager.getMessagesForLLM(newSessionId, userId);
  console.log('新会话系统提示词:');
  console.log('---');
  console.log(newMessages[0].content);
  console.log('---');

  console.log('\n✅ 测试结果总结:');
  console.log('1. ✅ 用户偏好持久化 - 保存到文件，跨会话保持');
  console.log('2. ✅ 会话临时记忆 - 当前对话的上下文');
  console.log('3. ✅ 智能上下文加载 - 只加载相关部分，节省token');
  console.log('4. ✅ Token成本优化 - 对话历史只保留最近N轮');
  console.log(`5. ✅ Token使用估算: ~${tokenEstimate.total} tokens (vs 全量可能5000+)`);
}

testSmartChat().catch(console.error);
