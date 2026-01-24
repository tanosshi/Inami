import { getDatabaseSafe } from "./databaseCore";

export const saveSetting = async (codename: string, value: boolean) => {
  try {
    const database = await getDatabaseSafe();
    await database.runAsync(
      `INSERT OR REPLACE INTO settings (codename, value, updated_at) 
       VALUES (?, ?, CURRENT_TIMESTAMP)`,
      [codename, value ? "true" : "false"]
    );
  } catch (error) {
    console.warn(`Could not save setting ${codename}:`, error);
    throw error;
  }
};

export const saveTextSetting = async (codename: string, value: string) => {
  try {
    const database = await getDatabaseSafe();
    await database.runAsync(
      `INSERT OR REPLACE INTO settings (codename, value, updated_at) 
       VALUES (?, ?, CURRENT_TIMESTAMP)`,
      [codename, value]
    );
  } catch (error) {
    console.warn(`Could not save text setting ${codename}:`, error);
    throw error;
  }
};

export const saveSettingsBatch = async (
  settings: { codename: string; value: boolean }[]
) => {
  if (settings.length === 0) return;

  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      const database = await getDatabaseSafe();

      // Use a transaction to batch all inserts
      await database.withTransactionAsync(async () => {
        for (const setting of settings) {
          await database.runAsync(
            `INSERT OR REPLACE INTO settings (codename, value, updated_at) 
             VALUES (?, ?, CURRENT_TIMESTAMP)`,
            [setting.codename, setting.value ? "true" : "false"]
          );
        }
      });

      return;
    } catch (error: any) {
      retryCount++;

      // Locked?
      const isLockedError =
        error?.message?.includes("locked") ||
        error?.message?.includes("database is locked") ||
        error?.code === 5; // SQLITE_BUSY

      if (isLockedError && retryCount < maxRetries) {
        // Wait before retrying (exponential backoff)
        const waitTime = Math.min(100 * Math.pow(2, retryCount - 1), 1000);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }

      // If not a lock error or max retries reached, throw
      console.warn("Could not save settings batch:", error);
      throw error;
    }
  }
};

export const getSetting = async (codename: string): Promise<any> => {
  try {
    const database = await getDatabaseSafe();
    const setting: any = await database.getFirstAsync(
      "SELECT value FROM settings WHERE codename = ?",
      [codename]
    );

    if (!setting) {
      return null;
    }

    const value = setting.value;
    if (value === "true") return true;
    if (value === "false") return false;
    return value;
  } catch (error) {
    console.warn(`Could not fetch setting ${codename}:`, error);
    return null;
  }
};

export const getAllSettings = async (): Promise<Record<string, any>> => {
  try {
    const database = await getDatabaseSafe();
    const settings: any[] = await database.getAllAsync(
      "SELECT codename, value FROM settings"
    );

    const result: Record<string, any> = {};
    settings.forEach((setting) => {
      const value = setting.value;
      if (value === "true") result[setting.codename] = true;
      else if (value === "false") result[setting.codename] = false;
      else result[setting.codename] = value;
    });

    return result;
  } catch (error) {
    console.warn("Could not fetch all settings:", error);
    return {};
  }
};
