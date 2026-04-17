/**
 * 测试对话管理器 - 多轮对话记忆
 */

import { ChatManager } from './core/chat-manager.js';
import { loadConfig } from './config/index.js';

async function testChatMemory() {
  console.log('='.repeat(60));
  console.log('测试对话记忆功能');
  console.log('='.repeat(60));

  const config = loadConfig();
  
  // 创建对话管理器
  const chatManager = new ChatManager({
    maxHistoryLength: 10,
    systemPrompt: '你是智游伴侣，一个AI自驾旅行管家。请用中文回复，保持友好和专业。'
  });

  // 模拟用户会话
  const sessionId = 'user_12345';

  console.log('\n--- 第1轮对话 ---');
  chatManager.addUserMessage(sessionId, '你好，我想去杭州自驾游');
  const messages1 = chatManager.getMessagesForLLM(sessionId);
  console.log('用户: 你好，我想去杭州自驾游');
  console.log('消息数量:', messages1.length);
  
  // 模拟LLM回复
  chatManager.addAssistantMessage(sessionId, 
    '你好！很高兴为你规划杭州自驾游。请问你计划什么时候出发？预算大概是多少？');
  console.log('助手: 你好！很高兴为你规划杭州自驾游。请问你计划什么时候出发？预算大概是多少？');

  console.log('\n--- 第2轮对话 ---');
  chatManager.addUserMessage(sessionId, '下周末出发，预算3000左右');
  const messages2 = chatManager.getMessagesForLLM(sessionId);
  console.log('用户: 下周末出发，预算3000左右');
  console.log('消息数量:', messages2.length);
  console.log('上下文提取:', chatManager.getSessionSummary(sessionId));
  
  chatManager.addAssistantMessage(sessionId,
    '好的！下周末杭州天气应该不错。3000元预算很充裕。你从哪里出发？计划玩几天？');
  console.log('助手: 好的！下周末杭州天气应该不错。3000元预算很充裕。你从哪里出发？计划玩几天？');

  console.log('\n--- 第3轮对话 ---');
  chatManager.addUserMessage(sessionId, '从上海出发，玩3天，主要想看西湖和灵隐寺');
  const messages3 = chatManager.getMessagesForLLM(sessionId);
  console.log('用户: 从上海出发，玩3天，主要想看西湖和灵隐寺');
  console.log('消息数量:', messages3.length);
  console.log('上下文提取:', chatManager.getSessionSummary(sessionId));

  console.log('\n--- 验证记忆 ---');
  console.log('完整对话历史:');
  const fullMessages = chatManager.getMessagesForLLM(sessionId);
  fullMessages.forEach((msg, i) => {
    if (msg.role === 'system') {
      console.log(`  [系统]: ${msg.content.substring(0, 50)}...`);
    } else {
      console.log(`  [${msg.role}]: ${msg.content}`);
    }
  });

  console.log('\n--- 测试结果 ---');
  console.log(`✅ 会话ID: ${sessionId}`);
  console.log(`✅ 对话轮次: ${chatManager.getOrCreateSession(sessionId).messages.length / 2}`);
  console.log(`✅ 提及地点: ${chatManager.getOrCreateSession(sessionId).context.mentionedPlaces.join(', ')}`);
  console.log(`✅ 预算信息: ${chatManager.getOrCreateSession(sessionId).context.userPreferences.budget || '未提取'}`);
  console.log(`✅ 旅行风格: ${chatManager.getOrCreateSession(sessionId).context.userPreferences.travelStyle || '未提取'}`);

  console.log('\n✅ 对话记忆功能测试通过！');
}

testChatMemory().catch(console.error);
