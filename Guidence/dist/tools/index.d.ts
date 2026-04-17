/**
 * 智游伴侣 - 工具系统
 * 基于OpenClaw工具架构
 */
import type { ToolConfig, ToolParameter, Result } from '../types/index.js';
import { BaseTool } from './base-tool.js';
export { BaseTool } from './base-tool.js';
export declare class MapTool extends BaseTool {
    name: string;
    description: string;
    parameters: ToolParameter[];
    private apiKey?;
    private securityCode?;
    constructor(apiKey?: string, securityCode?: string);
    private generateSignature;
    execute(params: Record<string, unknown>): Promise<Result<unknown>>;
    private handleSearch;
    private handleGeocode;
    private handleReverseGeocode;
    private handleTraffic;
    private handleRoute;
}
export declare class WeatherTool extends BaseTool {
    name: string;
    description: string;
    parameters: ToolParameter[];
    private apiKey?;
    constructor(apiKey?: string);
    execute(params: Record<string, unknown>): Promise<Result<unknown>>;
    private handleCurrent;
    private handleForecast;
    private handleAlerts;
}
export declare class BookingTool extends BaseTool {
    name: string;
    description: string;
    parameters: ToolParameter[];
    execute(params: Record<string, unknown>): Promise<Result<unknown>>;
    private handleSearch;
    private handleBook;
    private handleCancel;
}
export declare class ToolRegistry {
    private tools;
    register(tool: BaseTool): void;
    get(name: string): BaseTool | undefined;
    list(): ToolConfig[];
    execute(toolName: string, params: Record<string, unknown>): Promise<Result<unknown>>;
}
export { BrowserAutomationTool } from './browser-tool.js';
//# sourceMappingURL=index.d.ts.map