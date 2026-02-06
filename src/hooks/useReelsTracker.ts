import { useEffect, useState } from 'react';
import { NativeModules, NativeEventEmitter, Alert } from 'react-native';
import { DailyStats, UsageSession } from '../types';
import { DatabaseHelper } from '../database';

const { ContentMonitorModule } = NativeModules;

interface ReelsEvent {
  status: string;
  totalTimeSpent?: number;
}
interface TimeUpdateEvent {
  currentSessionTime: number;
  totalTimeSpent: number;
}

export const useReelsTracker = () => {
  const [reelsStatus, setReelsStatus] = useState('Initializing...');
  const [currentSessionTime, setCurrentSessionTime] = useState(0);
  const [totalTimeSpent, setTotalTimeSpent] = useState(0);

  const [isMonitoring, setIsMonitoring] = useState(false);
  const [dbHelper] = useState(new DatabaseHelper());

  useEffect(() => {
    initializeDatabase();
  }, []);

  useEffect(() => {
    const eventEmitter = new NativeEventEmitter(ContentMonitorModule);

    const timeUpdateListener = eventEmitter.addListener('ContentTimeUpdate', (event: TimeUpdateEvent) => {
      setCurrentSessionTime(event.currentSessionTime);
      setTotalTimeSpent(event.totalTimeSpent);
    });

    const statusListener = eventEmitter.addListener('ContentEvent', (event: ReelsEvent) => {
      setReelsStatus(event.status);
      if (event.totalTimeSpent !== undefined) {
        setTotalTimeSpent(event.totalTimeSpent);
      }
    });

    return () => {
      timeUpdateListener.remove();
      statusListener.remove();
    };
  }, []);

  const initializeDatabase = async () => {
    await dbHelper.initializeDatabase();
    await loadStoredTime();
  };

  const loadStoredTime = async () => {
    const totalTime = await dbHelper.getTotalUsageTime();
    setTotalTimeSpent(totalTime);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h ? `${h}h ${m}m ${s}s` : m ? `${m}m ${s}s` : `${s}s`;
  };

  return {
    reelsStatus,
    currentSessionTime,
    totalTimeSpent,
    isMonitoring,
    formatTime
  };
};
