# 智游伴侣 - AI自驾旅行管家

> 基于OpenClaw架构的多智能体协同旅行规划系统

## 📋 项目简介

智游伴侣是一个基于多智能体协同的AI旅行规划系统，借鉴OpenClaw的成熟架构，为自驾游用户提供智能化的旅行规划服务。

### 核心特性

- **多智能体协同**：信息智能体、规划智能体、执行智能体、监控智能体协同工作
- **动态行程规划**：根据用户偏好和约束条件生成最优行程
- **实时信息采集**：POI搜索、天气查询、路况监控
- **自动化执行**：浏览器自动化、表单填写、页面导航
- **智能监控**：实时监控行程状态、天气变化、路况更新
- **可扩展架构**：基于插件系统，易于扩展新功能

## 🏗️ 架构设计

### 核心组件

```
travel-companion/
├── src/
│   ├── core/              # 核心模块
│   │   └── gateway.ts     # 网关（消息路由、任务调度）
│   ├── agents/            # 智能体
│   │   ├── information-agent.ts  # 信息采集智能体
│   │   ├── planning-agent.ts     # 行程规划智能体
│   │   ├── execution-agent.ts    # 执行智能体
│   │   └── monitoring-agent.ts   # 监控智能体
│   ├── tools/             # 工具系统
│   │   └── index.ts       # 地图、天气、预订工具
│   ├── types/             # 类型定义
│   │   └── index.ts       # 所有TypeScript类型
│   ├── config/            # 配置管理
│   │   └── index.ts       # 环境变量加载
│   └── index.ts           # 主入口
├── package.json
├── tsconfig.json
└── .env.example
```

### 与OpenClaw的关系

| 组件 | OpenClaw | 智游伴侣 |
|------|----------|----------|
| 网关 | 完整的消息路由、会话管理 | 简化版，专注旅行场景 |
| 智能体 | 通用AI智能体框架 | 旅行专用智能体 |
| 工具 | 通用工具系统 | 旅行专用工具（地图、天气等） |
| 插件 | 完整的插件系统 | 基于插件的扩展机制 |

## 🚀 快速开始

### 1. 安装依赖

```bash
cd travel-companion
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，填入API密钥
```

**必需的API密钥：**
- `AMAP_API_KEY`: 高德地图API密钥
- `OPENAI_API_KEY`: OpenAI API密钥（用于AI功能）

**可选的API密钥：**
- `QWEATHER_API_KEY`: 和风天气API密钥

### 3. 运行项目

```bash
# 开发模式
npm run dev

# 构建
npm run build

# 生产模式
npm start
```

## 🔧 配置说明

### 环境变量

| 变量名 | 必需 | 说明 | 默认值 |
|--------|------|------|--------|
| AMAP_API_KEY | 是 | 高德地图API密钥 | - |
| OPENAI_API_KEY | 是 | OpenAI API密钥 | - |
| QWEATHER_API_KEY | 否 | 和风天气API密钥 | - |
| DEBUG | 否 | 调试模式 | false |
| LOG_LEVEL | 否 | 日志级别 | info |
| ENABLE_CACHE | 否 | 启用缓存 | true |
| ENABLE_BROWSER_AUTOMATION | 否 | 启用浏览器自动化 | false |

## 📖 使用示例

### 基础使用

```typescript
import { TravelCompanion } from './src/index.js';

const app = new TravelCompanion();
await app.start();

// 发送消息
const response = await app.chat('我想去杭州旅游');
console.log(response);

// 获取状态
const status = app.getStatus();
console.log(status);

await app.stop();
```

### 使用工具

```typescript
import { ToolRegistry, MapTool, WeatherTool } from './src/tools/index.js';

const registry = new ToolRegistry();
registry.register(new MapTool('your_api_key'));
registry.register(new WeatherTool('your_api_key'));

// 搜索POI
const result = await registry.execute('map', {
  action: 'search',
  keyword: '西湖',
  location: { latitude: 30.2592, longitude: 120.1494 }
});
```

## 🧩 扩展开发

### 添加新的智能体

```typescript
import { BaseAgent } from './core/gateway.js';
import type { AgentMessage, Result } from './types/index.js';

export class MyAgent extends BaseAgent {
  constructor() {
    super({
      id: 'my_agent',
      name: '我的智能体',
      description: '自定义智能体',
      capabilities: [
        {
          name: 'my_capability',
          description: '我的能力'
        }
      ]
    });
  }

  async process(message: AgentMessage): Promise<Result<AgentMessage>> {
    // 处理逻辑
    return ok({
      id: message.id,
      conversationId: message.conversationId,
      timestamp: new Date(),
      sender: this.id,
      receiver: message.sender,
      content: { result: '处理完成' }
    });
  }
}
```

### 添加新的工具

```typescript
import { BaseTool } from './tools/index.js';
import type { ToolParameter, Result } from './types/index.js';

export class MyTool extends BaseTool {
  name = 'my_tool';
  description = '我的工具';
  parameters: ToolParameter[] = [
    {
      name: 'param1',
      type: 'string',
      description: '参数1',
      required: true
    }
  ];

  async execute(params: Record<string, unknown>): Promise<Result<unknown>> {
    // 执行逻辑
    return ok({ success: true });
  }
}
```

## 🔍 与OpenClaw的对比

### 保留的功能

- ✅ 多智能体架构
- ✅ 工具系统
- ✅ 会话管理
- ✅ 任务调度
- ✅ 事件系统

### 简化的功能

- ⚡ 移除了多通道支持（只保留Web）
- ⚡ 简化了插件系统
- ⚡ 移除了复杂的安全特性
- ⚡ 简化了配置系统

### 新增的功能

- 🆕 旅行专用智能体
- 🆕 地图/天气/预订工具
- 🆕 行程规划算法
- 🆕 POI搜索和评分系统

## 🛠️ 开发路线图

### Phase 1 (当前)
- [x] 基础架构
- [x] 信息智能体
- [x] 规划智能体
- [x] 地图工具
- [x] 天气工具

### Phase 2
- [x] 执行智能体
- [x] 监控智能体
- [ ] 浏览器自动化
- [ ] 预订集成

### Phase 3
- [ ] Web界面
- [ ] 移动应用
- [ ] 车机集成
- [ ] 多语言支持

## 📝 注意事项

1. **API密钥安全**：不要将API密钥提交到版本控制
2. **缓存配置**：生产环境建议启用Redis缓存
3. **错误处理**：所有工具调用都有错误处理
4. **扩展性**：基于OpenClaw架构，易于扩展

## 🤝 贡献

欢迎贡献代码！请遵循以下步骤：

1. Fork项目
2. 创建特性分支
3. 提交更改
4. 创建Pull Request

## 📄 许可证

MIT License

## 📞 联系方式

- 项目维护者: 凌裕杰
- 项目地址: [GitHub Repository]

---

**基于OpenClaw架构构建** 🚀
