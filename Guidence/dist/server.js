/**
 * 智游伴侣 - Web服务器
 * 提供API给手机APP/网页调用
 */
import express from 'express';
import cors from 'cors';
import { SmartChatManager } from './core/smart-chat.js';
import { SoftwareAutomator } from './automation/software-automator.js';
import { loadConfig } from './config/index.js';
const app = express();
app.use(cors());
app.use(express.json());
// 初始化组件
const config = loadConfig();
const chatManager = new SmartChatManager({ dataDir: './data' });
const automator = new SoftwareAutomator();
// 会话存储
const sessions = new Map();
// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});
// 聊天接口
app.post('/api/chat', async (req, res) => {
    try {
        const { message, userId, sessionId } = req.body;
        if (!message || !userId || !sessionId) {
            return res.status(400).json({ success: false, error: '缺少必要参数' });
        }
        // 添加用户消息
        chatManager.addUserMessage(sessionId, userId, message);
        // 获取对话上下文
        const messages = chatManager.getMessagesForLLM(sessionId, userId);
        // 调用LLM
        const llmResponse = await fetch(`${config.openaiBaseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.openaiApiKey}`
            },
            body: JSON.stringify({
                model: config.openaiModel,
                messages: messages,
                max_tokens: 500
            })
        });
        const llmData = await llmResponse.json();
        const reply = llmData.choices?.[0]?.message?.content || '抱歉，我无法处理你的请求';
        // 添加助手回复
        chatManager.addAssistantMessage(sessionId, userId, reply);
        res.json({ success: true, reply });
    }
    catch (error) {
        console.error('聊天错误:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// 搜索景点
app.post('/api/search', async (req, res) => {
    try {
        const { keyword, source } = req.body;
        // 调用高德API搜索
        const response = await fetch(`https://restapi.amap.com/v5/place/text?key=${config.amapApiKey}&keywords=${encodeURIComponent(keyword)}&region=全国&page_size=10`);
        const data = await response.json();
        res.json({ success: true, data: data.pois || [] });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// 获取用户偏好
app.get('/api/preferences/:userId', (req, res) => {
    const prefs = chatManager.getUserPreferences(req.params.userId);
    res.json({ success: true, data: prefs });
});
// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚗 智游伴侣 - AI自驾旅行管家                              ║
║                                                            ║
║   服务器已启动: http://0.0.0.0:${PORT}                      ║
║                                                            ║
║   请确保手机和电脑在同一网络下                               ║
║   在手机浏览器访问: http://你的电脑IP:${PORT}               ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});
//# sourceMappingURL=server.js.map