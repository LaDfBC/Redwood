export type AchievementLevel = 'bronze' | 'silver' | 'gold' | 'platinum' | 'legendary' | 'celestial';

export interface AchievementRow {
    user_id: string;
    level: AchievementLevel;
    achievement_name: string;
    earned_at: Date;
    cancelled: boolean;
}
