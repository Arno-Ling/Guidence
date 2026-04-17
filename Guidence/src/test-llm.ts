/**
 * 测试小米MIMO API
 */

import { loadConfig } from './config/index.js';

async function testLlmApi() {
  console.log('='.repeat(50));
  console.log('测试小米MIMO API');
  console.log('='.repeat(50));

  const config = loadConfig();
  
  console.log(`API Base URL: ${config.openaiBaseUrl}`);
  console.log(`Model: ${config.openaiModel}`);
  console.log(`API Key: ${config.openaiApiKey ? '已配置 ✅' : '未配置 ❌'}`);
  console.log('');

  if (!config.openaiApiKey) {
    console.error('❌ OPENAI_API_KEY 未配置');
    process.exit(1);
  }

  try {
    const response = await fetch(`${config.openaiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.openaiApiKey}`
      },
      body: JSON.stringify({
        model: config.openaiModel,
        messages: [
          { role: 'user', content: '你好，请用一句话介绍你自己' }
        ],
        max_tokens: 100
      })
    });

    const data = await response.json() as any;

    if (response.ok && data.choices) {
      console.log('✅ API调用成功！');
      console.log('');
      console.log('AI回复:');
      console.log(data.choices[0].message.content);
      console.log('');
      console.log('完整响应:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log('❌ API调用失败');
      console.log('错误信息:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ 请求异常:', error);
  }
}

testLlmApi();
