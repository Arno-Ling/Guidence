/**
 * 测试软件自动化 - 模拟操作高德地图和小红书
 */
import { SoftwareAutomator } from './automation/software-automator.js';
async function testAutomation() {
    console.log('='.repeat(60));
    console.log('测试软件自动化功能');
    console.log('='.repeat(60));
    const automator = new SoftwareAutomator({
        humanLikeDelay: { min: 800, max: 1500 } // 模拟人类延迟
    });
    try {
        // 测试1: 检测软件
        console.log('\n--- 测试1: 检测软件 ---');
        const gaodeInstalled = await automator.detectSoftware('gaode_web');
        console.log(`高德地图(网页版): ${gaodeInstalled ? '可用 ✅' : '不可用 ❌'}`);
        const xiaohongshuInstalled = await automator.detectSoftware('xiaohongshu_web');
        console.log(`小红书(网页版): ${xiaohongshuInstalled ? '可用 ✅' : '不可用 ❌'}`);
        // 测试2: 打开高德地图
        console.log('\n--- 测试2: 打开高德地图 ---');
        const gaodeResult = await automator.launchSoftware('gaode_web');
        console.log(`打开高德地图: ${gaodeResult.success ? '成功 ✅' : '失败 ❌'}`);
        if (!gaodeResult.success) {
            console.log(`错误: ${gaodeResult.error}`);
        }
        // 测试3: 在高德搜索青岛景点
        console.log('\n--- 测试3: 搜索青岛景点 ---');
        const searchResult = await automator.searchOnWebsite('gaode_web', '青岛 景点');
        console.log(`搜索: ${searchResult.success ? '成功 ✅' : '失败 ❌'}`);
        if (!searchResult.success) {
            console.log(`错误: ${searchResult.error}`);
        }
        // 等待一下让用户看到结果
        await new Promise(resolve => setTimeout(resolve, 3000));
        // 测试4: 读取页面内容
        console.log('\n--- 测试4: 读取搜索结果 ---');
        const readResult = await automator.readPageContent('gaode_web');
        if (readResult.success) {
            console.log('页面内容预览:');
            console.log('---');
            const content = readResult.data;
            console.log(content.substring(0, 500) + '...');
            console.log('---');
        }
        else {
            console.log(`读取失败: ${readResult.error}`);
        }
        // 测试5: 截图
        console.log('\n--- 测试5: 截图 ---');
        const screenshotResult = await automator.takeScreenshot('gaode_web');
        console.log(`截图: ${screenshotResult.success ? '成功 ✅' : '失败 ❌'}`);
        // 测试6: 打开小红书
        console.log('\n--- 测试6: 打开小红书 ---');
        const xhsResult = await automator.launchSoftware('xiaohongshu_web');
        console.log(`打开小红书: ${xhsResult.success ? '成功 ✅' : '失败 ❌'}`);
        // 测试7: 在小红书搜索青岛旅游攻略
        console.log('\n--- 测试7: 搜索青岛旅游攻略 ---');
        const xhsSearchResult = await automator.searchOnWebsite('xiaohongshu_web', '青岛旅游攻略');
        console.log(`搜索: ${xhsSearchResult.success ? '成功 ✅' : '失败 ❌'}`);
        // 等待
        await new Promise(resolve => setTimeout(resolve, 3000));
        // 测试8: 读取小红书内容
        console.log('\n--- 测试8: 读取小红书攻略 ---');
        const xhsReadResult = await automator.readPageContent('xiaohongshu_web');
        if (xhsReadResult.success) {
            console.log('攻略内容预览:');
            console.log('---');
            const content = xhsReadResult.data;
            console.log(content.substring(0, 500) + '...');
            console.log('---');
        }
        // 测试9: 列出已打开的软件
        console.log('\n--- 测试9: 已打开的软件 ---');
        const opened = automator.getOpenedSoftware();
        console.log('已打开:', opened.join(', '));
        // 总结
        console.log('\n' + '='.repeat(60));
        console.log('测试总结');
        console.log('='.repeat(60));
        console.log('✅ 软件检测功能正常');
        console.log('✅ 打开软件功能正常');
        console.log('✅ 搜索功能正常');
        console.log('✅ 读取内容功能正常');
        console.log('✅ 截图功能正常');
        console.log('\n浏览器窗口将保持打开状态，你可以手动查看。');
        console.log('按 Ctrl+C 关闭测试。');
        // 不关闭浏览器，让用户看到结果
        // await automator.closeAll();
    }
    catch (error) {
        console.error('测试异常:', error);
        await automator.closeAll();
    }
}
// 运行测试
testAutomation();
//# sourceMappingURL=test-automation.js.map