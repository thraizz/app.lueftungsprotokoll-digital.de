import { openDB, DBSchema, IDBPDatabase } from 'idb';

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
}

let dbPromise: Promise<IDBPDatabase<VentilationDB>> | null = null;

export const getDB = async () => {
  if (!dbPromise) {
    dbPromise = openDB<VentilationDB>('ventilation-db', 1, {
      upgrade(db) {
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

export const deleteEntry = async (id: number) => {
  const db = await getDB();
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

export const deleteApartment = async (id: string) => {
  const db = await getDB();
  await db.delete('apartments', id);
};
