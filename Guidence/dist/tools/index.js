/**
 * 智游伴侣 - 工具系统
 * 基于OpenClaw工具架构
 */
import { ok, err } from '../types/index.js';
import { BaseTool } from './base-tool.js';
// 导出 BaseTool
export { BaseTool } from './base-tool.js';
// ==================== 地图工具 ====================
export class MapTool extends BaseTool {
    name = 'map';
    description = '地图和POI搜索工具';
    parameters = [
        {
            name: 'action',
            type: 'string',
            description: '操作类型: search, geocode, reverse_geocode, traffic, route',
            required: true
        },
        {
            name: 'keyword',
            type: 'string',
            description: '搜索关键词',
            required: false
        },
        {
            name: 'origin',
            type: 'string',
            description: '起点坐标 (经度,纬度)',
            required: false
        },
        {
            name: 'destination',
            type: 'string',
            description: '终点坐标 (经度,纬度)',
            required: false
        },
        {
            name: 'location',
            type: 'object',
            description: '位置 {latitude, longitude}',
            required: false
        },
        {
            name: 'radius',
            type: 'number',
            description: '搜索半径（米）',
            required: false
        },
        {
            name: 'category',
            type: 'string',
            description: 'POI类别',
            required: false
        },
        {
            name: 'strategy',
            type: 'number',
            description: '路线策略: 0-速度优先 1-费用优先 2-距离优先',
            required: false
        }
    ];
    apiKey;
    securityCode;
    constructor(apiKey, securityCode) {
        super();
        this.apiKey = apiKey;
        this.securityCode = securityCode;
    }
    generateSignature(params) {
        if (!this.securityCode)
            return '';
        const crypto = require('crypto');
        const sortedKeys = Object.keys(params).sort();
        const queryString = sortedKeys
            .map(key => `${key}=${params[key]}`)
            .join('&');
        return crypto.createHash('md5').update(queryString + this.securityCode).digest('hex');
    }
    async execute(params) {
        const validation = this.validateParams(params);
        if (!validation.success) {
            return validation;
        }
        const action = params.action;
        try {
            switch (action) {
                case 'search':
                    return await this.handleSearch(params);
                case 'geocode':
                    return await this.handleGeocode(params);
                case 'reverse_geocode':
                    return await this.handleReverseGeocode(params);
                case 'traffic':
                    return await this.handleTraffic(params);
                case 'route':
                    return await this.handleRoute(params);
                default:
                    return err(new Error(`Unknown action: ${action}`));
            }
        }
        catch (error) {
            return err(error instanceof Error ? error : new Error(String(error)));
        }
    }
    async handleSearch(params) {
        if (!this.apiKey) {
            return err(new Error('AMAP_API_KEY not configured'));
        }
        const keyword = params.keyword || '景点';
        const city = params.city || '杭州';
        const pageSize = params.pageSize || 10;
        const requestParams = {
            key: this.apiKey,
            keywords: keyword,
            region: city,
            page_size: String(pageSize),
            page_num: '1'
        };
        // Add signature if security code is configured
        const sig = this.generateSignature(requestParams);
        if (sig) {
            requestParams.sig = sig;
        }
        const url = new URL('https://restapi.amap.com/v5/place/text');
        Object.entries(requestParams).forEach(([k, v]) => {
            url.searchParams.set(k, v);
        });
        console.log(`[MapTool] Searching POI: ${keyword} in ${city}`);
        try {
            const response = await fetch(url.toString());
            const data = await response.json();
            if (data.status !== '1') {
                return err(new Error(`Amap API error: ${data.info || 'Unknown error'}`));
            }
            const pois = (data.pois || []).map((poi) => ({
                id: poi.id,
                name: poi.name,
                address: poi.address,
                category: poi.type,
                location: {
                    latitude: parseFloat(poi.location?.split(',')[1] || '0'),
                    longitude: parseFloat(poi.location?.split(',')[0] || '0')
                },
                city: poi.cityname,
                distance: poi.distance
            }));
            return ok({
                success: true,
                count: pois.length,
                pois
            });
        }
        catch (error) {
            return err(error instanceof Error ? error : new Error(String(error)));
        }
    }
    async handleGeocode(params) {
        // TODO: Implement actual API call
        console.log('[MapTool] Geocoding address');
        return ok({
            success: true,
            location: { latitude: 30.2592, longitude: 120.1494 }
        });
    }
    async handleReverseGeocode(params) {
        // TODO: Implement actual API call
        console.log('[MapTool] Reverse geocoding');
        return ok({
            success: true,
            address: '浙江省杭州市西湖区'
        });
    }
    async handleTraffic(params) {
        // TODO: Implement actual API call
        console.log('[MapTool] Getting traffic info');
        return ok({
            success: true,
            distanceKm: 10.5,
            durationMinutes: 25,
            trafficCondition: 'smooth'
        });
    }
    async handleRoute(params) {
        // TODO: Implement actual API call
        console.log('[MapTool] Getting route info');
        return ok({
            success: true,
            distanceKm: 15.2,
            durationMinutes: 35,
            route: [
                { latitude: 30.2592, longitude: 120.1494 },
                { latitude: 30.2600, longitude: 120.1500 }
            ]
        });
    }
}
// ==================== 天气工具 ====================
export class WeatherTool extends BaseTool {
    name = 'weather';
    description = '天气查询工具';
    parameters = [
        {
            name: 'action',
            type: 'string',
            description: '操作类型: current, forecast, alerts',
            required: true
        },
        {
            name: 'location',
            type: 'object',
            description: '位置 {latitude, longitude}',
            required: true
        },
        {
            name: 'days',
            type: 'number',
            description: '预报天数',
            required: false
        }
    ];
    apiKey;
    constructor(apiKey) {
        super();
        this.apiKey = apiKey;
    }
    async execute(params) {
        const validation = this.validateParams(params);
        if (!validation.success) {
            return validation;
        }
        const action = params.action;
        try {
            switch (action) {
                case 'current':
                    return await this.handleCurrent(params);
                case 'forecast':
                    return await this.handleForecast(params);
                case 'alerts':
                    return await this.handleAlerts(params);
                default:
                    return err(new Error(`Unknown action: ${action}`));
            }
        }
        catch (error) {
            return err(error instanceof Error ? error : new Error(String(error)));
        }
    }
    async handleCurrent(params) {
        // TODO: Implement actual API call
        console.log('[WeatherTool] Getting current weather');
        return ok({
            success: true,
            weather: {
                temperature: 22,
                weather: '晴',
                humidity: 65,
                windSpeed: 12
            }
        });
    }
    async handleForecast(params) {
        // TODO: Implement actual API call
        console.log('[WeatherTool] Getting weather forecast');
        return ok({
            success: true,
            forecast: [
                { date: '2024-05-01', weather: '晴', tempMax: 25, tempMin: 15 },
                { date: '2024-05-02', weather: '多云', tempMax: 23, tempMin: 14 },
                { date: '2024-05-03', weather: '小雨', tempMax: 20, tempMin: 12 }
            ]
        });
    }
    async handleAlerts(params) {
        // TODO: Implement actual API call
        console.log('[WeatherTool] Getting weather alerts');
        return ok({
            success: true,
            alerts: []
        });
    }
}
// ==================== 预订工具 ====================
export class BookingTool extends BaseTool {
    name = 'booking';
    description = '预订工具（酒店、门票等）';
    parameters = [
        {
            name: 'action',
            type: 'string',
            description: '操作类型: search, book, cancel',
            required: true
        },
        {
            name: 'type',
            type: 'string',
            description: '预订类型: hotel, ticket, restaurant',
            required: true
        },
        {
            name: 'location',
            type: 'object',
            description: '位置',
            required: false
        },
        {
            name: 'date',
            type: 'string',
            description: '日期',
            required: false
        }
    ];
    async execute(params) {
        const validation = this.validateParams(params);
        if (!validation.success) {
            return validation;
        }
        const action = params.action;
        const type = params.type;
        try {
            switch (action) {
                case 'search':
                    return await this.handleSearch(type, params);
                case 'book':
                    return await this.handleBook(type, params);
                case 'cancel':
                    return await this.handleCancel(type, params);
                default:
                    return err(new Error(`Unknown action: ${action}`));
            }
        }
        catch (error) {
            return err(error instanceof Error ? error : new Error(String(error)));
        }
    }
    async handleSearch(type, params) {
        // TODO: Implement actual booking search
        console.log(`[BookingTool] Searching ${type}`);
        return ok({
            success: true,
            results: [
                {
                    id: '1',
                    name: `示例${type}`,
                    price: 299,
                    rating: 4.5
                }
            ]
        });
    }
    async handleBook(type, params) {
        // TODO: Implement actual booking
        console.log(`[BookingTool] Booking ${type}`);
        return ok({
            success: true,
            bookingId: 'booking_123',
            message: '预订成功'
        });
    }
    async handleCancel(type, params) {
        // TODO: Implement actual cancellation
        console.log(`[BookingTool] Cancelling ${type}`);
        return ok({
            success: true,
            message: '取消成功'
        });
    }
}
// ==================== 工具注册表 ====================
export class ToolRegistry {
    tools = new Map();
    register(tool) {
        this.tools.set(tool.name, tool);
        console.log(`[ToolRegistry] Registered tool: ${tool.name}`);
    }
    get(name) {
        return this.tools.get(name);
    }
    list() {
        return Array.from(this.tools.values()).map(tool => tool.config);
    }
    async execute(toolName, params) {
        const tool = this.tools.get(toolName);
        if (!tool) {
            return err(new Error(`Tool not found: ${toolName}`));
        }
        return tool.execute(params);
    }
}
// 导出浏览器自动化工具
export { BrowserAutomationTool } from './browser-tool.js';
//# sourceMappingURL=index.js.map