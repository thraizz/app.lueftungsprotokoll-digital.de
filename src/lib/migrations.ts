import { getDB } from "./db";

export interface Migration {
  version: number;
  name: string;
  up: () => Promise<void>;
}

// Migration registry - add new migrations here
const migrations: Migration[] = [
  {
    version: 1,
    name: "Initial schema",
    up: async () => {
      // Initial schema is handled by the openDB upgrade callback
      console.log("Migration v1: Initial schema already applied");
    },
  },
  {
    version: 2,
    name: "Add deletion log, backups, and metadata",
    up: async () => {
      // This migration is handled by the openDB upgrade callback
      console.log("Migration v2: Deletion log, backups, and metadata stores added");
    },
  },
];

/**
 * Get the current database version
 */
export async function getCurrentVersion(): Promise<number> {
  const db = await getDB();
  return db.version;
}

/**
 * Get all available migrations up to the current version
 */
export function getAvailableMigrations(currentVersion: number): Migration[] {
  return migrations.filter(m => m.version <= currentVersion);
}

/**
 * Get pending migrations that haven't been applied yet
 */
export function getPendingMigrations(currentVersion: number, targetVersion: number): Migration[] {
  return migrations.filter(m => m.version > currentVersion && m.version <= targetVersion);
}

/**
 * Run all pending migrations
 */
export async function runMigrations(fromVersion: number, toVersion: number): Promise<void> {
  const pending = getPendingMigrations(fromVersion, toVersion);

  if (pending.length === 0) {
    console.log("No pending migrations");
    return;
  }

  console.log(`Running ${pending.length} migration(s)...`);

  for (const migration of pending) {
    console.log(`Applying migration v${migration.version}: ${migration.name}`);
    try {
      await migration.up();
      console.log(`Migration v${migration.version} completed successfully`);
    } catch (error) {
      console.error(`Migration v${migration.version} failed:`, error);
      throw new Error(`Migration failed at version ${migration.version}: ${error}`);
    }
  }

  console.log("All migrations completed successfully");
}

/**
 * Validate database integrity after migrations
 */
export async function validateDatabase(): Promise<{
  valid: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  try {
    const db = await getDB();

    // Check if all expected object stores exist
    const expectedStores: ("entries" | "apartments" | "deletionLog" | "backups" | "metadata" | "notificationSettings")[] = ["entries", "apartments", "deletionLog", "backups", "metadata", "notificationSettings"];
    for (const storeName of expectedStores) {
      if (!db.objectStoreNames.contains(storeName)) {
        errors.push(`Missing object store: ${storeName}`);
      }
    }

    // Verify indexes
    const storesForValidation: ("entries" | "deletionLog" | "backups" | "notificationSettings")[] = ["entries", "deletionLog", "backups"];
    if (db.objectStoreNames.contains("notificationSettings")) {
      storesForValidation.push("notificationSettings");
    }
    const tx = db.transaction(storesForValidation, "readonly");

    const entriesStore = tx.objectStore("entries");
    if (!entriesStore.indexNames.contains("by-apartment")) {
      errors.push("Missing index: entries.by-apartment");
    }
    if (!entriesStore.indexNames.contains("by-date")) {
      errors.push("Missing index: entries.by-date");
    }

    const deletionStore = tx.objectStore("deletionLog");
    if (!deletionStore.indexNames.contains("by-type")) {
      errors.push("Missing index: deletionLog.by-type");
    }
    if (!deletionStore.indexNames.contains("by-deleted-at")) {
      errors.push("Missing index: deletionLog.by-deleted-at");
    }

    const backupsStore = tx.objectStore("backups");
    if (!backupsStore.indexNames.contains("by-timestamp")) {
      errors.push("Missing index: backups.by-timestamp");
    }

    if (db.objectStoreNames.contains("notificationSettings")) {
      const notificationStore = tx.objectStore("notificationSettings");
      if (!notificationStore.indexNames.contains("by-apartment")) {
        errors.push("Missing index: notificationSettings.by-apartment");
      }
      if (!notificationStore.indexNames.contains("by-room")) {
        errors.push("Missing index: notificationSettings.by-room");
      }
    }

    await tx.done;

    return {
      valid: errors.length === 0,
      errors,
    };
  } catch (error) {
    errors.push(`Database validation error: ${error}`);
    return {
      valid: false,
      errors,
    };
  }
}

/**
 * Force database recreation by deleting and reopening
 */
export async function recreateDatabase(): Promise<void> {
  console.log("Recreating database...");

  // Close any open connections
  const db = await getDB();
  db.close();

  // Delete the database
  return new Promise((resolve, reject) => {
    const deleteRequest = indexedDB.deleteDatabase('ventilation-db');

    deleteRequest.onsuccess = () => {
      console.log("Database deleted successfully");
      // Clear the cached promise so next getDB() call will recreate
      (window as typeof window & { __dbPromiseReset?: () => void }).__dbPromiseReset?.();
      resolve();
    };

    deleteRequest.onerror = () => {
      console.error("Failed to delete database");
      reject(new Error("Failed to delete database"));
    };

    deleteRequest.onblocked = () => {
      console.warn("Database deletion blocked - close all tabs and try again");
      reject(new Error("Database deletion blocked"));
    };
  });
}

/**
 * Initialize the migration system
 * This should be called when the app starts
 */
export async function initializeMigrations(): Promise<void> {
  try {
    const currentVersion = await getCurrentVersion();
    console.log(`Current database version: ${currentVersion}`);

    // Validate database integrity
    const validation = await validateDatabase();
    if (!validation.valid) {
      console.error("Database validation failed:", validation.errors);

      // Attempt to recreate the database
      try {
        await recreateDatabase();
        console.log("Database recreated, validating again...");

        // Validate again after recreation
        const db = await getDB();
        const newValidation = await validateDatabase();

        if (!newValidation.valid) {
          console.error("Database validation still failed after recreation:", newValidation.errors);
          throw new Error("Database integrity check failed even after recreation");
        }

        console.log("Database validation successful after recreation");
      } catch (recreateError) {
        console.error("Failed to recreate database:", recreateError);
        throw new Error("Database could not be fixed");
      }
    } else {
      console.log("Database validation successful");
    }
  } catch (error) {
    console.error("Migration initialization failed:", error);
    throw error;
  }
}
