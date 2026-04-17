/**
 * 智游伴侣 - 用户偏好存储
 * 长期存储用户偏好，跨会话保持
 */
export interface UserPreferences {
    nickname?: string;
    hometown?: string;
    travelStyle?: '自驾游' | '自由行' | '跟团游' | '背包客';
    preferredDestinations?: string[];
    budgetRange?: {
        min: number;
        max: number;
        unit: 'per_day' | 'per_trip';
    };
    dietaryPreferences?: string[];
    favoriteFood?: string[];
    hotelPreference?: '经济型' | '舒适型' | '高档型' | '豪华型';
    drivingHabits?: {
        maxDrivingHoursPerDay?: number;
        preferHighway?: boolean;
        nightDriving?: boolean;
    };
    specialRequirements?: string;
    updatedAt?: number;
    version?: number;
}
export declare class UserPreferencesStore {
    private dataDir;
    constructor(dataDir?: string);
    private getFilePath;
    /**
     * 加载用户偏好
     */
    load(userId: string): UserPreferences;
    /**
     * 保存用户偏好
     */
    save(userId: string, preferences: Partial<UserPreferences>): void;
    /**
     * 更新单个字段
     */
    updateField<K extends keyof UserPreferences>(userId: string, key: K, value: UserPreferences[K]): void;
    /**
     * 获取摘要（用于LLM提示词）
     */
    getSummary(userId: string): string;
    /**
     * 删除用户偏好
     */
    delete(userId: string): void;
    private getDefaultPreferences;
}
//# sourceMappingURL=user-preferences.d.ts.map