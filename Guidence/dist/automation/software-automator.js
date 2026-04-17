/**
 * 智游伴侣 - 软件自动化框架（增强版）
 * 自动处理弹窗、登录框等干扰元素
 */
import { chromium } from 'playwright';
import { exec } from 'child_process';
// 常用软件定义库（增强版）
export const SOFTWARE_REGISTRY = {
    'gaode_web': {
        name: '高德地图(网页版)',
        type: 'web',
        detectCommand: '',
        launchCommand: '',
        webUrl: 'https://www.amap.com/search?query=',
        popupCloseSelectors: [
            '.close-btn', '.modal-close', '[class*="close"]',
            'button:has-text("关闭")', 'button:has-text("×")',
            '.login-close', '.amap-info-close'
        ],
        searchSelectors: ['#searchInput', '#search_input', 'input[name="keyword"]']
    },
    'xiaohongshu_web': {
        name: '小红书(网页版)',
        type: 'web',
        detectCommand: '',
        launchCommand: '',
        webUrl: 'https://www.xiaohongshu.com/search_result?keyword=',
        popupCloseSelectors: [
            '.close-button', '.login-close', '[class*="close"]',
            'button:has-text("关闭")', 'button:has-text("取消")',
            '.modal-close', '.dialog-close'
        ],
        searchSelectors: ['#search-input', '.search-input input', 'input[placeholder*="搜索"]']
    },
    'ctrip': {
        name: '携程',
        type: 'web',
        detectCommand: '',
        launchCommand: '',
        webUrl: 'https://www.ctrip.com',
        popupCloseSelectors: ['.c-dialog-close', '.modal-close'],
        searchSelectors: ['#search-input', '.searchInput input']
    },
    'dianping': {
        name: '大众点评',
        type: 'web',
        detectCommand: '',
        launchCommand: '',
        webUrl: 'https://www.dianping.com',
        popupCloseSelectors: ['.close-btn', '.modal-close'],
        searchSelectors: ['#search-input', '.search-input input']
    }
};
export class SoftwareAutomator {
    browser = null;
    context = null;
    pages = new Map();
    humanLikeDelay;
    constructor(options) {
        this.humanLikeDelay = options?.humanLikeDelay ?? { min: 500, max: 1500 };
    }
    /**
     * 初始化浏览器
     */
    async init() {
        if (this.browser)
            return;
        this.browser = await chromium.launch({
            headless: false,
            slowMo: 100,
            args: ['--disable-blink-features=AutomationControlled']
        });
        this.context = await this.browser.newContext({
            viewport: { width: 1366, height: 768 },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            locale: 'zh-CN',
            timezoneId: 'Asia/Shanghai'
        });
    }
    /**
     * 检测软件是否安装
     */
    async detectSoftware(softwareId) {
        const software = SOFTWARE_REGISTRY[softwareId];
        if (!software) {
            console.log(`[Detect] 未知软件: ${softwareId}`);
            return false;
        }
        if (software.type === 'web' && !software.detectCommand) {
            console.log(`[Detect] ${software.name} 网页版可用`);
            return true;
        }
        return new Promise((resolve) => {
            exec(software.detectCommand, (error, stdout) => {
                const isInstalled = !error && stdout.trim().length > 0;
                console.log(`[Detect] ${software.name}: ${isInstalled ? '已安装' : '未安装'}`);
                resolve(isInstalled);
            });
        });
    }
    /**
     * 打开软件并直接搜索（更高效）
     */
    async openAndSearch(softwareId, keyword) {
        const software = SOFTWARE_REGISTRY[softwareId];
        if (!software) {
            return { success: false, error: `未知软件: ${softwareId}` };
        }
        await this.init();
        if (software.type === 'web' && software.webUrl) {
            try {
                // 直接打开搜索结果页面
                const searchUrl = software.webUrl + encodeURIComponent(keyword);
                console.log(`[Open] 正在打开 ${software.name} 搜索: ${keyword}`);
                const page = await this.context.newPage();
                this.pages.set(softwareId, page);
                await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
                await this.randomDelay(2000, 4000); // 等待页面加载
                // 关闭弹窗
                await this.closePopups(softwareId);
                console.log(`[Open] ${software.name} 搜索页面已打开`);
                return { success: true };
            }
            catch (error) {
                return { success: false, error: `打开失败: ${error}` };
            }
        }
        return { success: false, error: '不支持的软件类型' };
    }
    /**
     * 打开软件
     */
    async launchSoftware(softwareId) {
        const software = SOFTWARE_REGISTRY[softwareId];
        if (!software) {
            return { success: false, error: `未知软件: ${softwareId}` };
        }
        await this.init();
        if (software.type === 'web' && software.webUrl) {
            try {
                const page = await this.context.newPage();
                this.pages.set(softwareId, page);
                console.log(`[Launch] 正在打开 ${software.name}...`);
                await page.goto(software.webUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
                await this.randomDelay(2000, 4000);
                // 关闭弹窗
                await this.closePopups(softwareId);
                console.log(`[Launch] ${software.name} 已打开`);
                return { success: true };
            }
            catch (error) {
                return { success: false, error: `打开失败: ${error}` };
            }
        }
        return new Promise((resolve) => {
            exec(software.launchCommand, (error) => {
                if (error) {
                    resolve({ success: false, error: `启动失败: ${error.message}` });
                }
                else {
                    console.log(`[Launch] ${software.name} 已启动`);
                    resolve({ success: true });
                }
            });
        });
    }
    /**
     * 关闭弹窗
     */
    async closePopups(softwareId) {
        const page = this.pages.get(softwareId);
        const software = SOFTWARE_REGISTRY[softwareId];
        if (!page || !software?.popupCloseSelectors)
            return;
        console.log(`[Popup] 尝试关闭弹窗...`);
        for (const selector of software.popupCloseSelectors) {
            try {
                const closeBtn = await page.$(selector);
                if (closeBtn) {
                    const isVisible = await closeBtn.isVisible();
                    if (isVisible) {
                        await closeBtn.click({ timeout: 1000 });
                        console.log(`[Popup] 关闭了弹窗: ${selector}`);
                        await this.randomDelay(300, 600);
                    }
                }
            }
            catch {
                // 忽略，继续尝试下一个
            }
        }
        // 尝试按 ESC 键关闭
        await page.keyboard.press('Escape');
        await this.randomDelay(200, 400);
    }
    /**
     * 在网页中搜索
     */
    async searchOnWebsite(softwareId, keyword) {
        const page = this.pages.get(softwareId);
        const software = SOFTWARE_REGISTRY[softwareId];
        if (!page) {
            return { success: false, error: `软件未打开: ${softwareId}` };
        }
        try {
            console.log(`[Search] 在 ${softwareId} 中搜索: ${keyword}`);
            // 先关闭弹窗
            await this.closePopups(softwareId);
            // 使用软件定义的搜索框选择器
            const selectors = software?.searchSelectors || [
                'input[type="search"]',
                'input[name="keyword"]',
                'input[name="q"]',
                '#search',
                'input[placeholder*="搜索"]'
            ];
            let searchInput = null;
            for (const selector of selectors) {
                try {
                    searchInput = await page.waitForSelector(selector, { timeout: 3000 });
                    if (searchInput) {
                        const isVisible = await searchInput.isVisible();
                        if (isVisible)
                            break;
                        searchInput = null;
                    }
                }
                catch {
                    continue;
                }
            }
            if (!searchInput) {
                return { success: false, error: '未找到搜索框' };
            }
            // 清空并输入关键词
            await searchInput.click();
            await this.randomDelay(200, 500);
            await searchInput.fill('');
            await this.randomDelay(100, 300);
            await this.humanType(keyword);
            await this.randomDelay(300, 800);
            // 按回车搜索
            await page.keyboard.press('Enter');
            // 等待结果加载
            await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => { });
            await this.randomDelay(1000, 2000);
            // 再次关闭弹窗（搜索后可能弹出新的）
            await this.closePopups(softwareId);
            console.log(`[Search] 搜索完成`);
            return { success: true };
        }
        catch (error) {
            return { success: false, error: `搜索失败: ${error}` };
        }
    }
    /**
     * 读取页面内容
     */
    async readPageContent(softwareId) {
        const page = this.pages.get(softwareId);
        if (!page) {
            return { success: false, error: `软件未打开: ${softwareId}` };
        }
        try {
            console.log(`[Read] 正在读取 ${softwareId} 页面内容...`);
            // 滚动页面加载更多内容
            await this.scrollPage(page);
            // 提取内容
            const content = await page.evaluate(() => {
                // 移除干扰元素
                const removeSelectors = ['script', 'style', 'nav', 'footer', 'header', '.ad', '.popup', '.modal'];
                removeSelectors.forEach(sel => {
                    document.querySelectorAll(sel).forEach(el => el.remove());
                });
                // 获取文本内容
                const main = document.querySelector('main, article, .content, .main, #content, #main, .search-result, .result-list');
                const text = main ? main.innerText : document.body.innerText;
                return text.replace(/\s+/g, ' ').replace(/\n+/g, '\n').trim().substring(0, 8000);
            });
            console.log(`[Read] 读取完成，内容长度: ${content.length}`);
            return { success: true, data: content };
        }
        catch (error) {
            return { success: false, error: `读取失败: ${error}` };
        }
    }
    /**
     * 截图
     */
    async takeScreenshot(softwareId) {
        const page = this.pages.get(softwareId);
        if (!page) {
            return { success: false, error: `软件未打开: ${softwareId}` };
        }
        try {
            const screenshot = await page.screenshot({ fullPage: false });
            const base64 = screenshot.toString('base64');
            return { success: true, screenshot: `data:image/png;base64,${base64}` };
        }
        catch (error) {
            return { success: false, error: `截图失败: ${error}` };
        }
    }
    /**
     * 点击元素
     */
    async clickElement(softwareId, selector) {
        const page = this.pages.get(softwareId);
        if (!page) {
            return { success: false, error: `软件未打开: ${softwareId}` };
        }
        try {
            await this.randomDelay(200, 500);
            await page.click(selector);
            await this.randomDelay();
            return { success: true };
        }
        catch (error) {
            return { success: false, error: `点击失败: ${error}` };
        }
    }
    /**
     * 关闭软件
     */
    async closeSoftware(softwareId) {
        const page = this.pages.get(softwareId);
        if (page) {
            await page.close();
            this.pages.delete(softwareId);
            console.log(`[Close] ${softwareId} 已关闭`);
        }
    }
    /**
     * 关闭所有
     */
    async closeAll() {
        for (const [id, page] of this.pages) {
            await page.close();
        }
        this.pages.clear();
        if (this.context) {
            await this.context.close();
        }
        if (this.browser) {
            await this.browser.close();
        }
        console.log('[Close] 所有软件已关闭');
    }
    /**
     * 获取已打开的软件列表
     */
    getOpenedSoftware() {
        return Array.from(this.pages.keys());
    }
    // ============ 辅助方法 ============
    async humanType(text) {
        const page = Array.from(this.pages.values())[0];
        if (!page)
            return;
        for (const char of text) {
            await page.keyboard.type(char);
            await this.randomDelay(50, 120);
        }
    }
    async randomDelay(min, max) {
        const delayMin = min ?? this.humanLikeDelay.min;
        const delayMax = max ?? this.humanLikeDelay.max;
        const delay = Math.floor(Math.random() * (delayMax - delayMin) + delayMin);
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    async scrollPage(page) {
        for (let i = 0; i < 3; i++) {
            await page.evaluate(() => window.scrollBy(0, 500));
            await this.randomDelay(500, 1000);
        }
        await page.evaluate(() => window.scrollTo(0, 0));
        await this.randomDelay(300, 600);
    }
}
//# sourceMappingURL=software-automator.js.map