import { Platform } from 'react-native';

// Fallback storage for web
class WebStorage {
  private storage: Map<string, string> = new Map();
  
  set(key: string, value: string | number | boolean): void {
    this.storage.set(key, String(value));
  }
  
  getString(key: string): string | undefined {
    return this.storage.get(key);
  }
  
  getNumber(key: string): number | undefined {
    const value = this.storage.get(key);
    return value ? Number(value) : undefined;
  }
  
  delete(key: string): void {
    this.storage.delete(key);
  }
  
  clearAll(): void {
    this.storage.clear();
  }
  
  contains(key: string): boolean {
    return this.storage.has(key);
  }
}

// Create storage instances based on platform
const createStorage = (id: string) => {
  if (Platform.OS === 'web') {
    return new WebStorage();
  }
  // For native platforms, MMKV will be used when properly configured
  // For now, use fallback
  return new WebStorage();
};

const storage = createStorage('exhibition-app');
const userStorage = createStorage('user-data');
const bookingStorage = createStorage('booking-cache');

// Storage keys
export const StorageKeys = {
  // User data
  USER_SESSION: 'user_session',
  USER_PROFILE: 'user_profile',
  USER_PREFERENCES: 'user_preferences',
  
  // Bookings & Tickets
  CACHED_BOOKINGS: 'cached_bookings',
  OFFLINE_TICKETS: 'offline_tickets',
  
  // App state
  LAST_SYNC: 'last_sync',
  EVENT_CACHE: 'event_cache',
  
  // Authentication
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
} as const;

// Utility functions for common operations
export const StorageUtils = {
  // Set data with automatic JSON serialization
  setObject: <T>(key: string, value: T, storageInstance = storage): void => {
    try {
      storageInstance.set(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to store object:', error);
    }
  },

  // Get data with automatic JSON parsing
  getObject: <T>(key: string, defaultValue: T | null = null, storageInstance = storage): T | null => {
    try {
      const value = storageInstance.getString(key);
      return value ? JSON.parse(value) : defaultValue;
    } catch (error) {
      console.error('Failed to retrieve object:', error);
      return defaultValue;
    }
  },

  // Remove data
  remove: (key: string, storageInstance = storage): void => {
    storageInstance.delete(key);
  },

  // Clear all data from a storage instance
  clearAll: (storageInstance = storage): void => {
    storageInstance.clearAll();
  },

  // Check if key exists
  contains: (key: string, storageInstance = storage): boolean => {
    return storageInstance.contains(key);
  },

  // User-specific operations
  setUserData: <T>(key: string, value: T): void => {
    StorageUtils.setObject(key, value, userStorage);
  },

  getUserData: <T>(key: string, defaultValue: T | null = null): T | null => {
    return StorageUtils.getObject(key, defaultValue, userStorage);
  },

  // Booking-specific operations
  setBookingData: <T>(key: string, value: T): void => {
    StorageUtils.setObject(key, value, bookingStorage);
  },

  getBookingData: <T>(key: string, defaultValue: T | null = null): T | null => {
    return StorageUtils.getObject(key, defaultValue, bookingStorage);
  },

  // Cache management
  setCacheWithExpiry: <T>(
    key: string, 
    value: T, 
    expiryMinutes: number = 30,
    storageInstance = storage
  ): void => {
    const expiryTime = Date.now() + (expiryMinutes * 60 * 1000);
    const cacheData = {
      value,
      expiry: expiryTime
    };
    StorageUtils.setObject(key, cacheData, storageInstance);
  },

  getCacheWithExpiry: <T>(
    key: string, 
    defaultValue: T | null = null,
    storageInstance = storage
  ): T | null => {
    const cacheData = StorageUtils.getObject<{value: T; expiry: number}>(key, null, storageInstance);
    
    if (!cacheData) return defaultValue;
    
    // Check if cache has expired
    if (Date.now() > cacheData.expiry) {
      StorageUtils.remove(key, storageInstance);
      return defaultValue;
    }
    
    return cacheData.value;
  },

  // Event cache operations
  cacheEvents: (events: any[]): void => {
    StorageUtils.setCacheWithExpiry(StorageKeys.EVENT_CACHE, events, 15); // 15 minutes cache
  },

  getCachedEvents: (): any[] | null => {
    return StorageUtils.getCacheWithExpiry(StorageKeys.EVENT_CACHE, null);
  },

  // User session management
  saveUserSession: (session: any): void => {
    StorageUtils.setUserData(StorageKeys.USER_SESSION, session);
  },

  getUserSession: (): any | null => {
    return StorageUtils.getUserData(StorageKeys.USER_SESSION, null);
  },

  clearUserSession: (): void => {
    StorageUtils.remove(StorageKeys.USER_SESSION, userStorage);
    StorageUtils.remove(StorageKeys.USER_PROFILE, userStorage);
    StorageUtils.remove(StorageKeys.ACCESS_TOKEN, userStorage);
    StorageUtils.remove(StorageKeys.REFRESH_TOKEN, userStorage);
  },

  // Offline ticket storage for QR codes
  saveOfflineTicket: (bookingId: string, ticketData: any): void => {
    const tickets = StorageUtils.getBookingData<Record<string, any>>(StorageKeys.OFFLINE_TICKETS, {});
    if (tickets) {
      tickets[bookingId] = {
        ...ticketData,
        savedAt: Date.now()
      };
      StorageUtils.setBookingData(StorageKeys.OFFLINE_TICKETS, tickets);
    }
  },

  getOfflineTicket: (bookingId: string): any | null => {
    const tickets = StorageUtils.getBookingData<Record<string, any>>(StorageKeys.OFFLINE_TICKETS, {});
    return tickets ? tickets[bookingId] || null : null;
  },

  getAllOfflineTickets: (): Record<string, any> => {
    return StorageUtils.getBookingData<Record<string, any>>(StorageKeys.OFFLINE_TICKETS, {}) || {};
  },

  // Sync management
  updateLastSync: (): void => {
    storage.set(StorageKeys.LAST_SYNC, Date.now());
  },

  getLastSync: (): number => {
    return storage.getNumber(StorageKeys.LAST_SYNC) || 0;
  },

  shouldSync: (intervalMinutes: number = 5): boolean => {
    const lastSync = StorageUtils.getLastSync();
    const now = Date.now();
    const interval = intervalMinutes * 60 * 1000;
    return (now - lastSync) > interval;
  }
};

// Export storage instances for direct access if needed
export { storage, userStorage, bookingStorage };