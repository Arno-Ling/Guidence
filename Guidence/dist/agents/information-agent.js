/**
 * 智游伴侣 - 信息采集智能体
 * 负责POI搜索、天气查询、路况信息等
 */
import { BaseAgent } from '../core/gateway.js';
import { ok, err } from '../types/index.js';
// ==================== 服务类 ====================
class MapService {
    apiKey;
    baseUrl = 'https://restapi.amap.com/v3';
    constructor(apiKey) {
        this.apiKey = apiKey;
    }
    async searchPOI(keyword, location, radius = 3000, category) {
        // TODO: Implement actual API call
        // This is a mock implementation
        console.log(`[MapService] Searching POI: ${keyword}`);
        return [
            {
                id: '1',
                name: '西湖风景区',
                category: 'scenic',
                location: { latitude: 30.2592, longitude: 120.1494 },
                rating: 4.8,
                ratingCount: 1000,
                priceLevel: 2,
                tags: ['5A景区', '世界遗产'],
                images: []
            }
        ];
    }
    async getTraffic(origin, destination) {
        // TODO: Implement actual API call
        console.log(`[MapService] Getting traffic info`);
        return {
            distanceKm: 10.5,
            durationMinutes: 25,
            trafficCondition: 'smooth'
        };
    }
}
class WeatherService {
    apiKey;
    baseUrl = 'https://devapi.qweather.com/v7';
    constructor(apiKey) {
        this.apiKey = apiKey;
    }
    async getWeather(location, days = 3) {
        // TODO: Implement actual API call
        console.log(`[WeatherService] Getting weather for ${days} days`);
        return {
            location,
            forecast: [
                {
                    date: '2024-05-01',
                    weather: '晴',
                    tempMax: 25,
                    tempMin: 15,
                    humidity: 60
                }
            ]
        };
    }
    async getAlerts(location) {
        // TODO: Implement actual API call
        console.log(`[WeatherService] Getting weather alerts`);
        return [];
    }
}
// ==================== 智能体实现 ====================
export class InformationAgent extends BaseAgent {
    mapService;
    weatherService;
    config;
    constructor(config) {
        super({
            id: config.id,
            name: config.name || '信息侦探',
            description: config.description || '负责信息采集和处理',
            capabilities: [
                {
                    name: 'search_poi',
                    description: '搜索兴趣点',
                    parameters: { keyword: '搜索关键词', location: '位置', radius: '半径' }
                },
                {
                    name: 'get_weather',
                    description: '获取天气信息',
                    parameters: { location: '位置', days: '天数' }
                },
                {
                    name: 'get_traffic',
                    description: '获取路况信息',
                    parameters: { origin: '起点', destination: '终点' }
                }
            ]
        });
        this.config = config;
    }
    async start() {
        await super.start();
        // Initialize services
        if (this.config.amapApiKey) {
            this.mapService = new MapService(this.config.amapApiKey);
        }
        if (this.config.qweatherApiKey) {
            this.weatherService = new WeatherService(this.config.qweatherApiKey);
        }
        console.log('[InformationAgent] Services initialized');
    }
    async process(message) {
        try {
            this.setState('busy');
            const action = message.content.action;
            let responseContent = {};
            switch (action) {
                case 'search_poi':
                    responseContent = await this.handleSearchPOI(message.content);
                    break;
                case 'get_weather':
                    responseContent = await this.handleGetWeather(message.content);
                    break;
                case 'get_traffic':
                    responseContent = await this.handleGetTraffic(message.content);
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
        }
        catch (error) {
            this.setState('error');
            return err(error instanceof Error ? error : new Error(String(error)));
        }
    }
    async handleSearchPOI(params) {
        const keyword = params.keyword;
        const location = params.location;
        const radius = params.radius || 3000;
        const category = params.category;
        if (!this.mapService) {
            return {
                success: false,
                error: 'Map service not configured'
            };
        }
        const pois = await this.mapService.searchPOI(keyword, location, radius, category);
        return {
            success: true,
            data: pois,
            source: 'amap',
            count: pois.length
        };
    }
    async handleGetWeather(params) {
        const location = params.location;
        const days = params.days || 3;
        if (!this.weatherService) {
            return {
                success: false,
                error: 'Weather service not configured'
            };
        }
        const weather = await this.weatherService.getWeather(location, days);
        const alerts = await this.weatherService.getAlerts(location);
        return {
            success: true,
            data: weather,
            alerts,
            source: 'qweather'
        };
    }
    async handleGetTraffic(params) {
        const origin = params.origin;
        const destination = params.destination;
        if (!this.mapService) {
            return {
                success: false,
                error: 'Map service not configured'
            };
        }
        const traffic = await this.mapService.getTraffic(origin, destination);
        return {
            success: true,
            data: traffic,
            source: 'amap'
        };
    }
}
//# sourceMappingURL=information-agent.js.map