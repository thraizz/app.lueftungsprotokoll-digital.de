import { openDB, DBSchema, IDBPDatabase } from 'idb';

const DB_VERSION = 2;

export interface VentilationEntry {
  id?: number;
  apartmentId: string;
  date: string;
  time: string;
  room: string;
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
}

let dbPromise: Promise<IDBPDatabase<VentilationDB>> | null = null;

export const getDB = async () => {
  if (!dbPromise) {
    dbPromise = openDB<VentilationDB>('ventilation-db', DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
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
      },
    });
  }
  return dbPromise;
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
    'Room',
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
    entry.room,
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
