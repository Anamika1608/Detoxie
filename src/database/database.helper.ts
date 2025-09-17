import type { UsageSession, DailyStats, Task } from '../types';
import { openDatabase } from './database.config';
import { TABLES } from './database.tables';
import SQLite from 'react-native-sqlite-storage';

export class DatabaseHelper {
    private db: SQLite.SQLiteDatabase | null = null;

    async initializeDatabase() {
        this.db = await openDatabase();
        await this.createTables();
        return this.db;
    }

    // Dream image helpers
    async getDreamImageBase64(): Promise<string | null> {
        if (!this.db) throw new Error('Database not initialized');
        const results = await this.db.executeSql('SELECT image_base64 FROM dream_image ORDER BY updated_at DESC LIMIT 1');
        if (results[0].rows.length > 0) {
            return results[0].rows.item(0).image_base64 as string;
        }
        return null;
    }

    async setDreamImageBase64(imageBase64: string): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');
        const existing = await this.db.executeSql('SELECT id FROM dream_image LIMIT 1');
        if (existing[0].rows.length > 0) {
            const id = existing[0].rows.item(0).id;
            await this.db.executeSql('UPDATE dream_image SET image_base64 = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [imageBase64, id]);
        } else {
            await this.db.executeSql('INSERT INTO dream_image (image_base64) VALUES (?)', [imageBase64]);
        }
    }

    async deleteDreamImage(): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');
        await this.db.executeSql('DELETE FROM dream_image');
    }
    
    private async createTables() {
        if (!this.db) throw new Error('Database not initialized');
        for (const query of TABLES) {
            await this.db.executeSql(query);
        }
    }

    async getTimerMinutes(): Promise<number | null> {
        if (!this.db) throw new Error('Database not initialized');
        const results = await this.db.executeSql('SELECT minutes FROM timer_settings ORDER BY updated_at DESC LIMIT 1');
        if (results[0].rows.length > 0) {
            const row = results[0].rows.item(0);
            return row.minutes as number;
        }
        return null;
    }

    async setTimerMinutes(minutes: number): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');
        // Keep a single row; replace existing or insert new
        const existing = await this.db.executeSql('SELECT id FROM timer_settings LIMIT 1');
        if (existing[0].rows.length > 0) {
            const id = existing[0].rows.item(0).id;
            await this.db.executeSql('UPDATE timer_settings SET minutes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [minutes, id]);
        } else {
            await this.db.executeSql('INSERT INTO timer_settings (minutes) VALUES (?)', [minutes]);
        }
    }

    // Tasks CRUD
    async getAllTaskTexts(): Promise<string[]> {
        if (!this.db) throw new Error('Database not initialized');
        const results = await this.db.executeSql('SELECT text FROM tasks ORDER BY created_at DESC');
        const rows = results[0].rows;
        const texts: string[] = [];
        for (let i = 0; i < rows.length; i++) {
            const row = rows.item(i);
            texts.push(row.text as string);
        }
        return texts;
    }

    async getAllTasks(): Promise<Task[]> {
        if (!this.db) throw new Error('Database not initialized');
        const results = await this.db.executeSql('SELECT * FROM tasks ORDER BY created_at DESC');
        const rows = results[0].rows;
        const tasks: Task[] = [];
        for (let i = 0; i < rows.length; i++) {
            const row = rows.item(i);
            tasks.push({ id: row.id, text: row.text, completed: !!row.completed, created_at: row.created_at });
        }
        return tasks;
    }

    async addTask(text: string): Promise<Task> {
        if (!this.db) throw new Error('Database not initialized');
        const result = await this.db.executeSql('INSERT INTO tasks (text, completed) VALUES (?, ?)', [text, 0]);
        const insertId = result[0].insertId;
        return { id: insertId, text, completed: false } as Task;
    }

    async deleteTask(id: number): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');
        await this.db.executeSql('DELETE FROM tasks WHERE id = ?', [id]);
    }

    async addUsageSession(
        duration: number,
        instagramOpened: string,
        instagramClosed: string,
        reelsCount: number = 0
    ) {
        if (!this.db) throw new Error('Database not initialized');
        const now = new Date();
        const sessionDate = now.toISOString().split('T')[0];
        const sessionTime = now.toTimeString().split(' ')[0];

        await this.db.executeSql(
            `INSERT INTO usage_sessions 
      (session_duration, session_date, session_time, instagram_opened, instagram_closed, reels_count) 
      VALUES (?, ?, ?, ?, ?, ?)`,
            [duration, sessionDate, sessionTime, instagramOpened, instagramClosed, reelsCount]
        );

        await this.updateDailyStats(sessionDate, duration);
    }

    private async updateDailyStats(date: string, duration: number) {
        if (!this.db) throw new Error('Database not initialized');
        const existing = await this.db.executeSql(
            'SELECT * FROM daily_stats WHERE date = ?',
            [date]
        );

        if (existing[0].rows.length > 0) {
            const current = existing[0].rows.item(0);
            const total = current.total_duration + duration;
            const count = current.session_count + 1;
            const avg = total / count;

            await this.db.executeSql(
                `UPDATE daily_stats 
         SET total_duration = ?, session_count = ?, avg_session_duration = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE date = ?`,
                [total, count, avg, date]
            );
        } else {
            await this.db.executeSql(
                `INSERT INTO daily_stats (date, total_duration, session_count, avg_session_duration) 
         VALUES (?, ?, ?, ?)`,
                [date, duration, 1, duration]
            );
        }
    }

    async getTotalUsageTime(): Promise<number> {
        if (!this.db) throw new Error('Database not initialized');

        try {
            const results = await this.db.executeSql(
                'SELECT SUM(session_duration) as total FROM usage_sessions'
            );

            if (results[0].rows.length > 0) {
                return results[0].rows.item(0).total || 0;
            }
            return 0;
        } catch (error) {
            console.error('Error getting total usage time:', error);
            throw error;
        }
    }

}
