/**
 * 智游伴侣 - 软件自动化框架（增强版）
 * 自动处理弹窗、登录框等干扰元素
 */
export interface SoftwareDefinition {
    name: string;
    type: 'web' | 'desktop' | 'mobile';
    detectCommand: string;
    launchCommand: string;
    webUrl?: string;
    windowTitle?: string;
    popupCloseSelectors?: string[];
    searchSelectors?: string[];
}
export declare const SOFTWARE_REGISTRY: Record<string, SoftwareDefinition>;
export interface AutomationResult {
    success: boolean;
    data?: unknown;
    error?: string;
    screenshot?: string;
}
export declare class SoftwareAutomator {
    private browser;
    private context;
    private pages;
    private humanLikeDelay;
    constructor(options?: {
        humanLikeDelay?: {
            min: number;
            max: number;
        };
    });
    /**
     * 初始化浏览器
     */
    init(): Promise<void>;
    /**
     * 检测软件是否安装
     */
    detectSoftware(softwareId: string): Promise<boolean>;
    /**
     * 打开软件并直接搜索（更高效）
     */
    openAndSearch(softwareId: string, keyword: string): Promise<AutomationResult>;
    /**
     * 打开软件
     */
    launchSoftware(softwareId: string): Promise<AutomationResult>;
    /**
     * 关闭弹窗
     */
    closePopups(softwareId: string): Promise<void>;
    /**
     * 在网页中搜索
     */
    searchOnWebsite(softwareId: string, keyword: string): Promise<AutomationResult>;
    /**
     * 读取页面内容
     */
    readPageContent(softwareId: string): Promise<AutomationResult>;
    /**
     * 截图
     */
    takeScreenshot(softwareId: string): Promise<AutomationResult>;
    /**
     * 点击元素
     */
    clickElement(softwareId: string, selector: string): Promise<AutomationResult>;
    /**
     * 关闭软件
     */
    closeSoftware(softwareId: string): Promise<void>;
    /**
     * 关闭所有
     */
    closeAll(): Promise<void>;
    /**
     * 获取已打开的软件列表
     */
    getOpenedSoftware(): string[];
    private humanType;
    private randomDelay;
    private scrollPage;
}
//# sourceMappingURL=software-automator.d.ts.map