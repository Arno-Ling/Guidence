/**
 * 智游伴侣 - 用户偏好存储
 * 长期存储用户偏好，跨会话保持
 */
import * as fs from 'fs';
import * as path from 'path';
export class UserPreferencesStore {
    dataDir;
    constructor(dataDir = './data/users') {
        this.dataDir = dataDir;
        // 确保目录存在
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }
    }
    getFilePath(userId) {
        return path.join(this.dataDir, `${userId}_preferences.json`);
    }
    /**
     * 加载用户偏好
     */
    load(userId) {
        const filePath = this.getFilePath(userId);
        if (!fs.existsSync(filePath)) {
            return this.getDefaultPreferences();
        }
        try {
            const data = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(data);
        }
        catch (error) {
            console.error(`Failed to load preferences for ${userId}:`, error);
            return this.getDefaultPreferences();
        }
    }
    /**
     * 保存用户偏好
     */
    save(userId, preferences) {
        const current = this.load(userId);
        const updated = {
            ...current,
            ...preferences,
            updatedAt: Date.now(),
            version: (current.version || 0) + 1
        };
        const filePath = this.getFilePath(userId);
        fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf-8');
    }
    /**
     * 更新单个字段
     */
    updateField(userId, key, value) {
        this.save(userId, { [key]: value });
    }
    /**
     * 获取摘要（用于LLM提示词）
     */
    getSummary(userId) {
        const prefs = this.load(userId);
        const parts = [];
        if (prefs.hometown)
            parts.push(`常住地: ${prefs.hometown}`);
        if (prefs.travelStyle)
            parts.push(`旅行风格: ${prefs.travelStyle}`);
        if (prefs.budgetRange) {
            parts.push(`预算范围: ${prefs.budgetRange.min}-${prefs.budgetRange.max}元/${prefs.budgetRange.unit === 'per_day' ? '天' : '次'}`);
        }
        if (prefs.hotelPreference)
            parts.push(`住宿偏好: ${prefs.hotelPreference}`);
        if (prefs.dietaryPreferences?.length) {
            parts.push(`饮食限制: ${prefs.dietaryPreferences.join(', ')}`);
        }
        if (prefs.favoriteFood?.length) {
            parts.push(`喜欢的美食: ${prefs.favoriteFood.join(', ')}`);
        }
        if (prefs.drivingHabits?.maxDrivingHoursPerDay) {
            parts.push(`每日最长驾驶: ${prefs.drivingHabits.maxDrivingHoursPerDay}小时`);
        }
        if (prefs.specialRequirements) {
            parts.push(`特殊需求: ${prefs.specialRequirements}`);
        }
        return parts.length > 0
            ? `用户偏好:\n${parts.join('\n')}`
            : '暂无用户偏好信息';
    }
    /**
     * 删除用户偏好
     */
    delete(userId) {
        const filePath = this.getFilePath(userId);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
    getDefaultPreferences() {
        return {
            preferredDestinations: [],
            dietaryPreferences: [],
            favoriteFood: [],
            updatedAt: Date.now(),
            version: 1
        };
    }
}
//# sourceMappingURL=user-preferences.js.map