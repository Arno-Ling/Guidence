/**
 * 智游伴侣 - 浏览器自动化工具
 * 使用Playwright实现浏览器自动化
 */
import { Page } from 'playwright';
import type { ToolParameter, Result } from '../types/index.js';
import { BaseTool } from './base-tool.js';
export declare class BrowserAutomationTool extends BaseTool {
    name: string;
    description: string;
    parameters: ToolParameter[];
    private browser?;
    private context?;
    private page?;
    private isHeadless;
    private defaultTimeout;
    constructor(headless?: boolean, timeout?: number);
    execute(params: Record<string, unknown>): Promise<Result<unknown>>;
    private ensureBrowser;
    private handleNavigate;
    private handleScreenshot;
    private handleExtract;
    private handleFillForm;
    private handleClick;
    private handleScroll;
    private handleWait;
    private handleClose;
    getPage(): Promise<Page | undefined>;
    close(): Promise<void>;
}
//# sourceMappingURL=browser-tool.d.ts.map