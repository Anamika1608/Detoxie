import type { UsageSession, DailyStats } from '../types';
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

  private async createTables() {
    if (!this.db) throw new Error('Database not initialized');
    for (const query of TABLES) {
      await this.db.executeSql(query);
    }
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
}
