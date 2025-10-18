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
    const expectedStores = ["entries", "apartments", "deletionLog", "backups", "metadata"];
    for (const storeName of expectedStores) {
      if (!db.objectStoreNames.contains(storeName)) {
        errors.push(`Missing object store: ${storeName}`);
      }
    }

    // Verify indexes
    const tx = db.transaction(["entries", "deletionLog", "backups"], "readonly");

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
      throw new Error("Database integrity check failed");
    }

    console.log("Database validation successful");
  } catch (error) {
    console.error("Migration initialization failed:", error);
    throw error;
  }
}
