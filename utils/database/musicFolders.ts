import { getDatabaseSafe } from "./databaseCore";

export interface MusicFolder {
  id: string;
  name: string;
  uri: string;
  is_enabled: boolean;
  created_at: string;
}

export const getAllMusicFolders = async (): Promise<MusicFolder[]> => {
  try {
    const database = await getDatabaseSafe();
    const folders: any[] = await database.getAllAsync(
      "SELECT * FROM music_folders ORDER BY created_at DESC"
    );
    return folders.map((folder) => ({
      ...folder,
      is_enabled: folder.is_enabled === 1,
    }));
  } catch (error) {
    console.warn("Fetch error:", error);
    return [];
  }
};

export const getEnabledMusicFolders = async (): Promise<MusicFolder[]> => {
  try {
    const database = await getDatabaseSafe();
    const folders: any[] = await database.getAllAsync(
      "SELECT * FROM music_folders WHERE is_enabled = 1 ORDER BY created_at DESC"
    );
    return folders.map((folder) => ({
      ...folder,
      is_enabled: true,
    }));
  } catch (error) {
    console.warn("Fetch error:", error);
    return [];
  }
};

export const addMusicFolder = async (folder: {
  id: string;
  name: string;
  uri: string;
}): Promise<void> => {
  try {
    const database = await getDatabaseSafe();
    await database.runAsync(
      `INSERT OR REPLACE INTO music_folders (id, name, uri, is_enabled) 
       VALUES (?, ?, ?, 1)`,
      [folder.id, folder.name, folder.uri]
    );
  } catch (error) {
    console.warn("Add error:", error);
    throw error;
  }
};

export const removeMusicFolder = async (id: string): Promise<void> => {
  try {
    const database = await getDatabaseSafe();
    await database.runAsync("DELETE FROM music_folders WHERE id = ?", [id]);
  } catch (error) {
    console.warn("Remove error:", error);
    throw error;
  }
};

export const toggleMusicFolder = async (
  id: string,
  isEnabled: boolean
): Promise<void> => {
  try {
    const database = await getDatabaseSafe();
    await database.runAsync(
      "UPDATE music_folders SET is_enabled = ? WHERE id = ?",
      [isEnabled ? 1 : 0, id]
    );
  } catch (error) {
    console.warn("Toggle error:", error);
    throw error;
  }
};

export const getMusicFolderByUri = async (
  uri: string
): Promise<MusicFolder | null> => {
  try {
    const database = await getDatabaseSafe();
    const folder: any = await database.getFirstAsync(
      "SELECT * FROM music_folders WHERE uri = ?",
      [uri]
    );
    if (!folder) return null;
    return {
      ...folder,
      is_enabled: folder.is_enabled === 1,
    };
  } catch (error) {
    console.warn("Fetch error:", error);
    return null;
  }
};
