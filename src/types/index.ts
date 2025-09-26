export interface UsageSession {
    id: number;
    session_duration: number;
    session_date: string;
    session_time: string;
    instagram_opened: string;
    instagram_closed: string;
    reels_count?: number;
}

export interface DailyStats {
    date: string;
    total_duration: number;
    session_count: number;
    avg_session_duration: number;
}

export type PermissionType = 'accessibility' | 'overlay';

export interface Task {
    id: number;
    text: string;
    created_at?: string;
}