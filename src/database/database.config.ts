import SQLite from 'react-native-sqlite-storage';

SQLite.enablePromise(true);

export const DB_NAME = 'ReelsTracker.db';
export const DB_LOCATION = 'default';

export async function openDatabase() {
  return SQLite.openDatabase({
    name: DB_NAME,
    location: DB_LOCATION,
  });
}
