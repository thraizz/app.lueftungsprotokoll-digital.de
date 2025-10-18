import { useEffect } from "react";
import { createBackup, getMetadata, setMetadata } from "@/lib/db";

const BACKUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const LAST_BACKUP_KEY = "last-auto-backup";

export function useAutoBackup() {
  useEffect(() => {
    const checkAndCreateBackup = async () => {
      try {
        const lastBackupMeta = await getMetadata(LAST_BACKUP_KEY);
        const lastBackupTime = lastBackupMeta?.value as number | undefined;
        const now = Date.now();

        // Create automatic backup if:
        // 1. No backup has been created before, OR
        // 2. More than 24 hours have passed since the last backup
        if (!lastBackupTime || now - lastBackupTime > BACKUP_INTERVAL) {
          await createBackup(true);
          await setMetadata(LAST_BACKUP_KEY, now);
          console.log("Automatic backup created successfully");
        }
      } catch (error) {
        console.error("Failed to create automatic backup:", error);
      }
    };

    // Check immediately on mount
    checkAndCreateBackup();

    // Set up interval to check periodically (every hour)
    const intervalId = setInterval(checkAndCreateBackup, 60 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);
}
