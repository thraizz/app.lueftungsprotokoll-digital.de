import { openDB, DBSchema, IDBPDatabase } from 'idb';

const DB_VERSION = 6;

export interface Room {
  id: string;
  name: string;
  icon?: string;
  order: number;
}

export interface VentilationEntry {
  id?: number;
  apartmentId: string;
  date: string;
  time: string;
  rooms: string[];
  ventilationType: string;
  duration: number;
  tempBefore: number;
  humidityBefore: number;
  tempAfter?: number;
  humidityAfter?: number;
  notes?: string;
  createdAt: number;
}

export interface Apartment {
  id: string;
  name: string;
  address: string;
  size: number;
  rooms: Room[];
  createdAt: number;
}

export interface DeletionLog {
  id?: number;
  type: 'entry' | 'apartment';
  originalId: string | number;
  deletedAt: number;
  data: VentilationEntry | Apartment;
  reason?: string;
}

export interface Backup {
  id?: number;
  timestamp: number;
  data: {
    entries: VentilationEntry[];
    apartments: Apartment[];
  };
  version: number;
  automatic: boolean;
}

export interface AppMetadata {
  key: string;
  value: string | number | boolean;
  updatedAt: number;
}

export interface NotificationTime {
  id: string;
  time: string;
  enabled: boolean;
  label: string;
}

export interface NotificationSettings {
  id: string;
  apartmentId?: string;
  roomId?: string;
  times: NotificationTime[];
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

interface VentilationDB extends DBSchema {
  entries: {
    key: number;
    value: VentilationEntry;
    indexes: { 'by-apartment': string; 'by-date': string };
  };
  apartments: {
    key: string;
    value: Apartment;
  };
  deletionLog: {
    key: number;
    value: DeletionLog;
    indexes: { 'by-type': string; 'by-deleted-at': number };
  };
  backups: {
    key: number;
    value: Backup;
    indexes: { 'by-timestamp': number };
  };
  metadata: {
    key: string;
    value: AppMetadata;
  };
  notificationSettings: {
    key: string;
    value: NotificationSettings;
    indexes: { 'by-apartment': string; 'by-room': string };
  };
}

let dbPromise: Promise<IDBPDatabase<VentilationDB>> | null = null;

const resetDBPromise = () => {
  dbPromise = null;
};

// Expose reset function for migrations
if (typeof window !== 'undefined') {
  (window as typeof window & { __dbPromiseReset?: () => void }).__dbPromiseReset = resetDBPromise;
}

export const getDB = async () => {
  if (!dbPromise) {
    dbPromise = openDB<VentilationDB>('ventilation-db', DB_VERSION, {
      async upgrade(db, oldVersion, newVersion, transaction) {
        // Version 1: Initial schema
        if (oldVersion < 1) {
          if (!db.objectStoreNames.contains('entries')) {
            const entryStore = db.createObjectStore('entries', {
              keyPath: 'id',
              autoIncrement: true,
            });
            entryStore.createIndex('by-apartment', 'apartmentId');
            entryStore.createIndex('by-date', 'date');
          }
          if (!db.objectStoreNames.contains('apartments')) {
            db.createObjectStore('apartments', { keyPath: 'id' });
          }
        }

        // Version 2: Add deletion log, backups, and metadata stores
        if (oldVersion < 2) {
          if (!db.objectStoreNames.contains('deletionLog')) {
            const deletionStore = db.createObjectStore('deletionLog', {
              keyPath: 'id',
              autoIncrement: true,
            });
            deletionStore.createIndex('by-type', 'type');
            deletionStore.createIndex('by-deleted-at', 'deletedAt');
          }

          if (!db.objectStoreNames.contains('backups')) {
            const backupStore = db.createObjectStore('backups', {
              keyPath: 'id',
              autoIncrement: true,
            });
            backupStore.createIndex('by-timestamp', 'timestamp');
          }

          if (!db.objectStoreNames.contains('metadata')) {
            db.createObjectStore('metadata', { keyPath: 'key' });
          }
        }

        // Version 3: Migrate room string to rooms array
        if (oldVersion < 3) {
          const entriesStore = transaction.objectStore('entries');
          const allEntries = await entriesStore.getAll();

          for (const entry of allEntries) {
            let needsUpdate = false;
            const migratedEntry = { ...entry };

            // Migrate old single room string to rooms array
            if ('room' in entry && typeof entry.room === 'string') {
              migratedEntry.rooms = [entry.room];
              delete (migratedEntry as VentilationEntry & { room?: string }).room;
              needsUpdate = true;
            }

            // Ensure rooms array exists, even if empty
            if (!migratedEntry.rooms || !Array.isArray(migratedEntry.rooms)) {
              migratedEntry.rooms = [];
              needsUpdate = true;
            }

            if (needsUpdate) {
              await entriesStore.put(migratedEntry);
            }
          }
        }

        // Version 4: Add rooms array to apartments
        if (oldVersion < 4) {
          const apartmentsStore = transaction.objectStore('apartments');
          const allApartments = await apartmentsStore.getAll();

          for (const apartment of allApartments) {
            if (!apartment.rooms || !Array.isArray(apartment.rooms)) {
              const migratedApartment = {
                ...apartment,
                rooms: getDefaultRooms(),
              };
              await apartmentsStore.put(migratedApartment);
            }
          }
        }

        // Version 5: Add notification settings store
        if (oldVersion < 5) {
          if (!db.objectStoreNames.contains('notificationSettings')) {
            const notificationStore = db.createObjectStore('notificationSettings', {
              keyPath: 'id',
            });
            notificationStore.createIndex('by-apartment', 'apartmentId', { unique: false });
            notificationStore.createIndex('by-room', 'roomId', { unique: false });
          }
        }

        // Version 6: Ensure notification settings store exists (fix for users who had incomplete v5 migration)
        if (oldVersion < 6) {
          if (!db.objectStoreNames.contains('notificationSettings')) {
            const notificationStore = db.createObjectStore('notificationSettings', {
              keyPath: 'id',
            });
            notificationStore.createIndex('by-apartment', 'apartmentId', { unique: false });
            notificationStore.createIndex('by-room', 'roomId', { unique: false });
          }
        }
      },
      blocked() {
        console.warn('Database upgrade blocked by another connection');
      },
      blocking() {
        console.warn('This connection is blocking a database upgrade');
      },
      terminated() {
        console.error('Database connection was unexpectedly terminated');
        resetDBPromise();
      },
    }).catch(async (error) => {
      console.error('Error opening database:', error);

      if (error.name === 'NotFoundError' || error.message?.includes('object store')) {
        console.log('Database schema mismatch detected, attempting recovery...');
        resetDBPromise();

        const dbDeleteRequest = indexedDB.deleteDatabase('ventilation-db');

        return new Promise<IDBPDatabase<VentilationDB>>((resolve, reject) => {
          dbDeleteRequest.onsuccess = async () => {
            console.log('Old database deleted, creating fresh database...');
            try {
              const freshDB = await openDB<VentilationDB>('ventilation-db', DB_VERSION, {
                async upgrade(db, oldVersion, newVersion, transaction) {
                  if (oldVersion < 1) {
                    if (!db.objectStoreNames.contains('entries')) {
                      const entryStore = db.createObjectStore('entries', {
                        keyPath: 'id',
                        autoIncrement: true,
                      });
                      entryStore.createIndex('by-apartment', 'apartmentId');
                      entryStore.createIndex('by-date', 'date');
                    }
                    if (!db.objectStoreNames.contains('apartments')) {
                      db.createObjectStore('apartments', { keyPath: 'id' });
                    }
                  }

                  if (oldVersion < 2) {
                    if (!db.objectStoreNames.contains('deletionLog')) {
                      const deletionStore = db.createObjectStore('deletionLog', {
                        keyPath: 'id',
                        autoIncrement: true,
                      });
                      deletionStore.createIndex('by-type', 'type');
                      deletionStore.createIndex('by-deleted-at', 'deletedAt');
                    }

                    if (!db.objectStoreNames.contains('backups')) {
                      const backupStore = db.createObjectStore('backups', {
                        keyPath: 'id',
                        autoIncrement: true,
                      });
                      backupStore.createIndex('by-timestamp', 'timestamp');
                    }

                    if (!db.objectStoreNames.contains('metadata')) {
                      db.createObjectStore('metadata', { keyPath: 'key' });
                    }
                  }

                  if (!db.objectStoreNames.contains('notificationSettings')) {
                    const notificationStore = db.createObjectStore('notificationSettings', {
                      keyPath: 'id',
                    });
                    notificationStore.createIndex('by-apartment', 'apartmentId', { unique: false });
                    notificationStore.createIndex('by-room', 'roomId', { unique: false });
                  }
                },
              });
              resolve(freshDB);
            } catch (freshError) {
              reject(freshError);
            }
          };

          dbDeleteRequest.onerror = () => {
            reject(new Error('Failed to delete corrupted database'));
          };
        });
      }

      throw error;
    });
  }
  return dbPromise;
};

// Helper function to get default rooms
export const getDefaultRooms = (): Room[] => {
  return [
    { id: 'room-1', name: 'Wohnzimmer', icon: '🛋️', order: 1 },
    { id: 'room-2', name: 'Schlafzimmer', icon: '🛏️', order: 2 },
    { id: 'room-3', name: 'Küche', icon: '🍳', order: 3 },
    { id: 'room-4', name: 'Bad', icon: '🚿', order: 4 },
    { id: 'room-5', name: 'Flur', icon: '🚪', order: 5 },
    { id: 'room-6', name: 'Arbeitszimmer', icon: '💼', order: 6 },
    { id: 'room-7', name: 'Kinderzimmer', icon: '🧸', order: 7 },
  ];
};

// Entries
export const addEntry = async (entry: Omit<VentilationEntry, 'id'>) => {
  const db = await getDB();
  const id = await db.add('entries', { ...entry } as VentilationEntry);
  return id;
};

export const getAllEntries = async () => {
  const db = await getDB();
  return db.getAll('entries');
};

export const getEntriesByApartment = async (apartmentId: string) => {
  const db = await getDB();
  return db.getAllFromIndex('entries', 'by-apartment', apartmentId);
};

export const deleteEntry = async (id: number, reason?: string) => {
  const db = await getDB();

  // Get the entry before deleting it
  const entry = await db.get('entries', id);
  if (entry) {
    // Log the deletion
    await db.add('deletionLog', {
      type: 'entry',
      originalId: id,
      deletedAt: Date.now(),
      data: entry,
      reason,
    });
  }

  await db.delete('entries', id);
};

// Apartments
export const addApartment = async (apartment: Apartment) => {
  const db = await getDB();
  await db.add('apartments', apartment);
};

export const getAllApartments = async () => {
  const db = await getDB();
  return db.getAll('apartments');
};

export const getApartment = async (id: string) => {
  const db = await getDB();
  return db.get('apartments', id);
};

export const updateApartment = async (apartment: Apartment) => {
  const db = await getDB();
  await db.put('apartments', apartment);
};

export const deleteApartment = async (id: string, reason?: string) => {
  const db = await getDB();

  // Get the apartment before deleting it
  const apartment = await db.get('apartments', id);
  if (apartment) {
    // Log the deletion
    await db.add('deletionLog', {
      type: 'apartment',
      originalId: id,
      deletedAt: Date.now(),
      data: apartment,
      reason,
    });
  }

  await db.delete('apartments', id);
};

// Deletion Log
export const getDeletionLog = async () => {
  const db = await getDB();
  return db.getAll('deletionLog');
};

export const clearDeletionLog = async (olderThan?: number) => {
  const db = await getDB();
  if (olderThan) {
    const logs = await db.getAllFromIndex('deletionLog', 'by-deleted-at');
    for (const log of logs) {
      if (log.deletedAt < olderThan && log.id) {
        await db.delete('deletionLog', log.id);
      }
    }
  } else {
    await db.clear('deletionLog');
  }
};

// Backups
export const createBackup = async (automatic = false) => {
  const db = await getDB();
  const entries = await getAllEntries();
  const apartments = await getAllApartments();

  const backup: Omit<Backup, 'id'> = {
    timestamp: Date.now(),
    data: { entries, apartments },
    version: DB_VERSION,
    automatic,
  };

  const id = await db.add('backups', backup as Backup);

  // Keep only the last 10 automatic backups
  if (automatic) {
    const allBackups = await db.getAllFromIndex('backups', 'by-timestamp');
    const autoBackups = allBackups.filter(b => b.automatic);

    if (autoBackups.length > 10) {
      const toDelete = autoBackups.slice(0, autoBackups.length - 10);
      for (const backup of toDelete) {
        if (backup.id) {
          await db.delete('backups', backup.id);
        }
      }
    }
  }

  return id;
};

export const getBackups = async () => {
  const db = await getDB();
  const backups = await db.getAllFromIndex('backups', 'by-timestamp');
  return backups.reverse(); // Most recent first
};

export const restoreBackup = async (backupId: number) => {
  const db = await getDB();
  const backup = await db.get('backups', backupId);

  if (!backup) {
    throw new Error('Backup not found');
  }

  // Clear current data
  await db.clear('entries');
  await db.clear('apartments');

  // Restore data
  for (const entry of backup.data.entries) {
    await db.add('entries', entry);
  }
  for (const apartment of backup.data.apartments) {
    await db.add('apartments', apartment);
  }

  return true;
};

export const deleteBackup = async (id: number) => {
  const db = await getDB();
  await db.delete('backups', id);
};

// Metadata
export const getMetadata = async (key: string) => {
  const db = await getDB();
  return db.get('metadata', key);
};

export const setMetadata = async (key: string, value: string | number | boolean) => {
  const db = await getDB();
  await db.put('metadata', {
    key,
    value,
    updatedAt: Date.now(),
  });
};

// Export/Import
export const exportData = async () => {
  const entries = await getAllEntries();
  const apartments = await getAllApartments();

  return {
    version: DB_VERSION,
    exportedAt: Date.now(),
    data: {
      entries,
      apartments,
    },
  };
};

export const exportDataAsJSON = async () => {
  const data = await exportData();
  return JSON.stringify(data, null, 2);
};

export const exportDataAsCSV = async () => {
  const entries = await getAllEntries();

  // CSV headers
  const headers = [
    'ID',
    'Apartment ID',
    'Date',
    'Time',
    'Rooms',
    'Ventilation Type',
    'Duration (min)',
    'Temp Before (°C)',
    'Humidity Before (%)',
    'Temp After (°C)',
    'Humidity After (%)',
    'Notes',
    'Created At',
  ];

  const rows = entries.map(entry => [
    entry.id || '',
    entry.apartmentId,
    entry.date,
    entry.time,
    entry.rooms?.join(', ') || '',
    entry.ventilationType,
    entry.duration,
    entry.tempBefore,
    entry.humidityBefore,
    entry.tempAfter || '',
    entry.humidityAfter || '',
    (entry.notes || '').replace(/"/g, '""'), // Escape quotes
    new Date(entry.createdAt).toISOString(),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  return csvContent;
};

export const importData = async (
  data: {
    version: number;
    exportedAt: number;
    data: {
      entries: VentilationEntry[];
      apartments: Apartment[];
    };
  },
  mode: 'replace' | 'merge' = 'merge'
) => {
  const db = await getDB();

  // Create backup before import
  await createBackup(false);

  if (mode === 'replace') {
    await db.clear('entries');
    await db.clear('apartments');
  }

  // Import apartments first
  for (const apartment of data.data.apartments) {
    const existing = await db.get('apartments', apartment.id);
    if (!existing || mode === 'replace') {
      await db.put('apartments', apartment);
    }
  }

  // Import entries
  for (const entry of data.data.entries) {
    if (mode === 'replace') {
      await db.add('entries', entry);
    } else {
      // In merge mode, add new entries
      await db.add('entries', entry);
    }
  }

  return {
    imported: {
      entries: data.data.entries.length,
      apartments: data.data.apartments.length,
    },
  };
};

// Notification Settings
export const getDefaultNotificationTimes = (): NotificationTime[] => {
  return [
    { id: 'time-1', time: '07:00', enabled: true, label: 'Morgens' },
    { id: 'time-2', time: '12:00', enabled: true, label: 'Mittags' },
    { id: 'time-3', time: '18:00', enabled: true, label: 'Abends' },
    { id: 'time-4', time: '21:00', enabled: true, label: 'Vor Schlafenszeit' },
  ];
};

export const getNotificationSettings = async (id: string) => {
  const db = await getDB();
  return db.get('notificationSettings', id);
};

export const getAllNotificationSettings = async () => {
  const db = await getDB();
  return db.getAll('notificationSettings');
};

export const getNotificationSettingsByApartment = async (apartmentId: string) => {
  const db = await getDB();
  return db.getAllFromIndex('notificationSettings', 'by-apartment', apartmentId);
};

export const getNotificationSettingsByRoom = async (roomId: string) => {
  const db = await getDB();
  return db.getAllFromIndex('notificationSettings', 'by-room', roomId);
};

export const saveNotificationSettings = async (settings: NotificationSettings) => {
  const db = await getDB();
  await db.put('notificationSettings', {
    ...settings,
    updatedAt: Date.now(),
  });
};

export const deleteNotificationSettings = async (id: string) => {
  const db = await getDB();
  await db.delete('notificationSettings', id);
};
