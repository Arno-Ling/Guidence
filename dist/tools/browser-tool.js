/**
 * 智游伴侣 - 浏览器自动化工具
 * 使用Playwright实现浏览器自动化
 */
import { chromium } from 'playwright';
import { ok, err } from '../types/index.js';
import { BaseTool } from './base-tool.js';
export class BrowserAutomationTool extends BaseTool {
    name = 'browser';
    description = '浏览器自动化工具，支持网页浏览、内容提取、表单填写等';
    parameters = [
        {
            name: 'action',
            type: 'string',
            description: '操作类型: navigate, screenshot, extract, fill_form, click, scroll, wait',
            required: true
        },
        {
            name: 'url',
            type: 'string',
            description: '目标网址',
            required: false
        },
        {
            name: 'selector',
            type: 'string',
            description: 'CSS选择器',
            required: false
        },
        {
            name: 'text',
            type: 'string',
            description: '要填写的文本',
            required: false
        },
        {
            name: 'timeout',
            type: 'number',
            description: '超时时间(毫秒)',
            required: false
        }
    ];
    browser;
    context;
    page;
    isHeadless;
    defaultTimeout;
    constructor(headless = true, timeout = 30000) {
        super();
        this.isHeadless = headless;
        this.defaultTimeout = timeout;
    }
    async execute(params) {
        const validation = this.validateParams(params);
        if (!validation.success) {
            return validation;
        }
        const action = params.action;
        try {
            switch (action) {
                case 'navigate':
                    return await this.handleNavigate(params);
                case 'screenshot':
                    return await this.handleScreenshot(params);
                case 'extract':
                    return await this.handleExtract(params);
                case 'fill_form':
                    return await this.handleFillForm(params);
                case 'click':
                    return await this.handleClick(params);
                case 'scroll':
                    return await this.handleScroll(params);
                case 'wait':
                    return await this.handleWait(params);
                case 'close':
                    return await this.handleClose(params);
                default:
                    return err(new Error(`Unknown action: ${action}`));
            }
        }
        catch (error) {
            return err(error instanceof Error ? error : new Error(String(error)));
        }
    }
    async ensureBrowser() {
        if (!this.browser) {
            this.browser = await chromium.launch({
                headless: this.isHeadless
            });
            this.context = await this.browser.newContext({
                viewport: { width: 1280, height: 720 },
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            });
            this.page = await this.context.newPage();
            this.page.setDefaultTimeout(this.defaultTimeout);
        }
    }
    async handleNavigate(params) {
        const url = params.url;
        if (!url) {
            return err(new Error('URL is required for navigate action'));
        }
        await this.ensureBrowser();
        console.log(`[BrowserTool] 导航到: ${url}`);
        try {
            const response = await this.page.goto(url, {
                waitUntil: 'domcontentloaded',
                timeout: this.defaultTimeout
            });
            // 等待页面加载完成
            await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
                // 忽略网络空闲超时
            });
            const title = await this.page.title();
            const currentUrl = this.page.url();
            return ok({
                success: true,
                action: 'navigate',
                url: currentUrl,
                title,
                status: response?.status() || 200,
                message: `成功导航到 ${url}`
            });
        }
        catch (error) {
            return err(new Error(`导航失败: ${error instanceof Error ? error.message : String(error)}`));
        }
    }
    async handleScreenshot(params) {
        await this.ensureBrowser();
        const selector = params.selector;
        const filename = `screenshot_${Date.now()}.png`;
        console.log(`[BrowserTool] 截图: ${selector || '全页面'}`);
        try {
            if (selector) {
                const element = await this.page.$(selector);
                if (element) {
                    await element.screenshot({ path: filename });
                }
                else {
                    return err(new Error(`Element not found: ${selector}`));
                }
            }
            else {
                await this.page.screenshot({ path: filename, fullPage: false });
            }
            return ok({
                success: true,
                action: 'screenshot',
                filename,
                message: '截图完成'
            });
        }
        catch (error) {
            return err(new Error(`截图失败: ${error instanceof Error ? error.message : String(error)}`));
        }
    }
    async handleExtract(params) {
        await this.ensureBrowser();
        const selector = params.selector;
        const extractType = params.extractType || 'text';
        console.log(`[BrowserTool] 提取内容: ${selector}, 类型: ${extractType}`);
        try {
            let content;
            if (selector) {
                const elements = await this.page.$$(selector);
                if (elements.length === 0) {
                    return ok({
                        success: true,
                        action: 'extract',
                        selector,
                        content: [],
                        count: 0,
                        message: '未找到匹配的元素'
                    });
                }
                content = await Promise.all(elements.map(async (el) => {
                    switch (extractType) {
                        case 'text':
                            return await el.innerText();
                        case 'html':
                            return await el.innerHTML();
                        case 'attribute':
                            const attrName = params.attribute || 'href';
                            return await el.getAttribute(attrName);
                        case 'value':
                            return await el.inputValue();
                        default:
                            return await el.innerText();
                    }
                }));
            }
            else {
                // 提取整个页面内容
                switch (extractType) {
                    case 'text':
                        content = await this.page.innerText('body');
                        // 清理文本
                        content = content
                            .replace(/\s+/g, ' ')
                            .replace(/\n+/g, '\n')
                            .trim()
                            .substring(0, 10000);
                        break;
                    case 'html':
                        content = await this.page.innerHTML('body');
                        break;
                    case 'title':
                        content = await this.page.title();
                        break;
                    default:
                        content = await this.page.innerText('body');
                }
            }
            return ok({
                success: true,
                action: 'extract',
                selector,
                extractType,
                content,
                count: Array.isArray(content) ? content.length : 1,
                message: '内容提取完成'
            });
        }
        catch (error) {
            return err(new Error(`内容提取失败: ${error instanceof Error ? error.message : String(error)}`));
        }
    }
    async handleFillForm(params) {
        await this.ensureBrowser();
        const formData = params.formData;
        if (!formData) {
            return err(new Error('formData is required for fill_form action'));
        }
        console.log(`[BrowserTool] 填写表单: ${Object.keys(formData).length} 个字段`);
        try {
            const results = [];
            for (const [selector, value] of Object.entries(formData)) {
                try {
                    const element = await this.page.$(selector);
                    if (element) {
                        // 清空输入框
                        await element.fill('');
                        // 输入新值
                        await element.fill(value);
                        results.push({ selector, success: true });
                    }
                    else {
                        results.push({ selector, success: false, error: 'Element not found' });
                    }
                }
                catch (error) {
                    results.push({
                        selector,
                        success: false,
                        error: error instanceof Error ? error.message : String(error)
                    });
                }
            }
            const successCount = results.filter(r => r.success).length;
            return ok({
                success: true,
                action: 'fill_form',
                results,
                fieldsTotal: Object.keys(formData).length,
                fieldsSuccess: successCount,
                message: `表单填写完成: ${successCount}/${Object.keys(formData).length} 个字段成功`
            });
        }
        catch (error) {
            return err(new Error(`表单填写失败: ${error instanceof Error ? error.message : String(error)}`));
        }
    }
    async handleClick(params) {
        await this.ensureBrowser();
        const selector = params.selector;
        if (!selector) {
            return err(new Error('selector is required for click action'));
        }
        console.log(`[BrowserTool] 点击元素: ${selector}`);
        try {
            // 等待元素可见
            await this.page.waitForSelector(selector, { state: 'visible', timeout: 5000 });
            // 点击元素
            await this.page.click(selector);
            // 等待一下让页面响应
            await this.page.waitForTimeout(500);
            return ok({
                success: true,
                action: 'click',
                selector,
                message: '元素点击完成'
            });
        }
        catch (error) {
            return err(new Error(`点击失败: ${error instanceof Error ? error.message : String(error)}`));
        }
    }
    async handleScroll(params) {
        await this.ensureBrowser();
        const direction = params.direction || 'down';
        const amount = params.amount || 500;
        console.log(`[BrowserTool] 滚动页面: ${direction}, ${amount}px`);
        try {
            const scrollY = direction === 'down' ? amount : -amount;
            await this.page.evaluate((y) => {
                window.scrollBy(0, y);
            }, scrollY);
            // 等待滚动完成
            await this.page.waitForTimeout(300);
            return ok({
                success: true,
                action: 'scroll',
                direction,
                amount,
                message: `页面滚动完成: ${direction} ${amount}px`
            });
        }
        catch (error) {
            return err(new Error(`滚动失败: ${error instanceof Error ? error.message : String(error)}`));
        }
    }
    async handleWait(params) {
        await this.ensureBrowser();
        const selector = params.selector;
        const timeout = params.timeout || 5000;
        console.log(`[BrowserTool] 等待元素: ${selector}`);
        try {
            if (selector) {
                await this.page.waitForSelector(selector, { state: 'visible', timeout });
            }
            else {
                await this.page.waitForTimeout(timeout);
            }
            return ok({
                success: true,
                action: 'wait',
                selector,
                timeout,
                message: '等待完成'
            });
        }
        catch (error) {
            return err(new Error(`等待超时: ${error instanceof Error ? error.message : String(error)}`));
        }
    }
    async handleClose(params) {
        console.log('[BrowserTool] 关闭浏览器');
        try {
            if (this.page) {
                await this.page.close();
                this.page = undefined;
            }
            if (this.context) {
                await this.context.close();
                this.context = undefined;
            }
            if (this.browser) {
                await this.browser.close();
                this.browser = undefined;
            }
            return ok({
                success: true,
                action: 'close',
                message: '浏览器已关闭'
            });
        }
        catch (error) {
            return err(new Error(`关闭失败: ${error instanceof Error ? error.message : String(error)}`));
        }
    }
    // 公共方法，供其他组件调用
    async getPage() {
        await this.ensureBrowser();
        return this.page;
    }
    async close() {
        await this.handleClose({});
    }
}
//# sourceMappingURL=browser-tool.js.map