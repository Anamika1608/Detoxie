import { useEffect, useState, useCallback } from 'react';
import { NativeModules, NativeEventEmitter } from 'react-native';
import { Platform } from '../types';
import { DatabaseHelper } from '../database';

const { ContentMonitorModule } = NativeModules;

interface ContentEvent {
  status: string;
  platform?: Platform;
  totalTimeSpent?: number;
}

interface TimeUpdateEvent {
  currentSessionTime: number;
  totalTimeSpent: number;
  platform?: Platform;
  instagramTimeToday?: number;
  youtubeTimeToday?: number;
}

interface StatsUpdateEvent {
  totalTime: number;
  sessionCount: number;
  lastSessionDate: string;
  platform?: Platform;
  instagramTimeToday?: number;
  youtubeTimeToday?: number;
}

export const useContentTracker = () => {
  const [contentStatus, setContentStatus] = useState('Initializing...');
  const [currentSessionTime, setCurrentSessionTime] = useState(0);
  const [currentPlatform, setCurrentPlatform] = useState<Platform | null>(null);
  const [totalTimeSpent, setTotalTimeSpent] = useState(0);
  const [platformStats, setPlatformStats] = useState<Record<Platform, number>>({
    instagram: 0,
    youtube: 0,
  });
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [dbHelper] = useState(new DatabaseHelper());

  useEffect(() => {
    initializeDatabase();
  }, []);

  useEffect(() => {
    const eventEmitter = new NativeEventEmitter(ContentMonitorModule);

    const timeUpdateListener = eventEmitter.addListener(
      'ContentTimeUpdate',
      (event: TimeUpdateEvent) => {
        setCurrentSessionTime(event.currentSessionTime);
        setTotalTimeSpent(event.totalTimeSpent);
        if (event.platform) {
          setCurrentPlatform(event.platform);
        }
        // Update platform-specific stats from native
        if (event.instagramTimeToday !== undefined || event.youtubeTimeToday !== undefined) {
          setPlatformStats({
            instagram: event.instagramTimeToday || 0,
            youtube: event.youtubeTimeToday || 0,
          });
        }
      }
    );

    const statusListener = eventEmitter.addListener(
      'ContentEvent',
      (event: ContentEvent) => {
        setContentStatus(event.status);
        if (event.platform) {
          setCurrentPlatform(event.platform);
        }
        if (event.totalTimeSpent !== undefined) {
          setTotalTimeSpent(event.totalTimeSpent);
        }
      }
    );

    const statsListener = eventEmitter.addListener(
      'ContentStatsUpdate',
      (event: StatsUpdateEvent) => {
        setTotalTimeSpent(event.totalTime);
        if (event.instagramTimeToday !== undefined || event.youtubeTimeToday !== undefined) {
          setPlatformStats({
            instagram: event.instagramTimeToday || 0,
            youtube: event.youtubeTimeToday || 0,
          });
        }
      }
    );

    return () => {
      timeUpdateListener.remove();
      statusListener.remove();
      statsListener.remove();
    };
  }, []);

  const initializeDatabase = async () => {
    await dbHelper.initializeDatabase();
    await loadStoredTime();
    await loadPlatformStats();
  };

  const loadStoredTime = async () => {
    const totalTime = await dbHelper.getTotalUsageTime();
    setTotalTimeSpent(totalTime);
  };

  const loadPlatformStats = useCallback(async () => {
    try {
      // Try to get from native module first (more up-to-date)
      const nativeStats = await ContentMonitorModule.getPlatformStats();
      if (nativeStats) {
        setPlatformStats({
          instagram: nativeStats.instagramTimeToday || 0,
          youtube: nativeStats.youtubeTimeToday || 0,
        });
        return;
      }
    } catch (error) {
      // Fall back to database
      console.log('Falling back to DB for platform stats');
    }

    // Fallback to database
    const stats = await dbHelper.getTodayUsageByPlatform();
    setPlatformStats(stats);
  }, [dbHelper]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return h ? `${h}h ${m}m ${s}s` : m ? `${m}m ${s}s` : `${s}s`;
  };

  const formatMinutes = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  return {
    contentStatus,
    currentSessionTime,
    currentPlatform,
    totalTimeSpent,
    platformStats,
    isMonitoring,
    formatTime,
    formatMinutes,
    loadPlatformStats,
  };
};
