import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase | null = null;
let isInitializing = false;

export const initDatabase = async () => {
  // Prevent multiple simultaneous initializations
  if (isInitializing) {
    // Wait for existing initialization
    while (isInitializing) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    return;
  }

  if (db) return; // Already initialized

  isInitializing = true;
  try {
    db = await SQLite.openDatabaseAsync("Myoraei.db");

    // Create tables
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS songs (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        artist TEXT DEFAULT 'Unknown Artist',
        album TEXT DEFAULT 'Unknown Album',
        duration REAL DEFAULT 0,
        uri TEXT NOT NULL,
        artwork TEXT,
        palette TEXT,
        is_liked INTEGER DEFAULT 0,
        play_count INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS playlists (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        artwork TEXT,
        song_count INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS playlist_songs (
        playlist_id TEXT,
        song_id TEXT,
        position INTEGER,
        added_at TEXT DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (playlist_id, song_id),
        FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
        FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_songs_liked ON songs(is_liked);
      CREATE INDEX IF NOT EXISTS idx_songs_play_count ON songs(play_count DESC);
      CREATE INDEX IF NOT EXISTS idx_playlist_songs ON playlist_songs(playlist_id, position);
    `);
  } finally {
    isInitializing = false;
  }
};

export const getDatabase = (): SQLite.SQLiteDatabase => {
  if (!db) {
    throw new Error("Database not initialized. Call initDatabase() first.");
  }
  return db;
};

// Safe database getter that waits for initialization
export const getDatabaseSafe = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!db) {
    await initDatabase();
  }
  return db!;
};

// Song Operations
export const getAllSongs = async () => {
  const database = getDatabase();
  const songs: any[] = await database.getAllAsync(
    "SELECT * FROM songs ORDER BY created_at DESC"
  );
  return songs.map((song) => {
    const palette = Array.isArray((song as any)?.palette)
      ? (song as any).palette
      : (song as any) && (song as any).palette
      ? (() => {
          try {
            return JSON.parse((song as any).palette);
          } catch {
            return null;
          }
        })()
      : null;

    return {
      ...song,
      palette,
    };
  });
};

export const getSongById = async (id: string) => {
  const database = getDatabase();
  const song = await database.getFirstAsync(
    "SELECT * FROM songs WHERE id = ?",
    [id]
  );
  if (!song) return null;
  return {
    ...song,
    palette: Array.isArray((song as any)?.palette)
      ? (song as any).palette
      : (song as any) && (song as any).palette
      ? (() => {
          try {
            return JSON.parse((song as any).palette);
          } catch {
            return null;
          }
        })()
      : null,
  };
};

export const getLikedSongs = async () => {
  const database = getDatabase();
  const songs: any[] = await database.getAllAsync(
    "SELECT * FROM songs WHERE is_liked = 1 ORDER BY created_at DESC"
  );
  return songs.map((song) => {
    const palette = Array.isArray((song as any)?.palette)
      ? (song as any).palette
      : (song as any) && (song as any).palette
      ? (() => {
          try {
            return JSON.parse((song as any).palette);
          } catch {
            return null;
          }
        })()
      : null;
    return {
      ...song,
      palette,
    };
  });
};

export const addSong = async (song: any) => {
  const database = getDatabase();
  const paletteValue = song.palette
    ? typeof song.palette === "string"
      ? song.palette
      : JSON.stringify(song.palette)
    : null;

  await database.runAsync(
    `INSERT INTO songs (id, title, artist, album, duration, uri, artwork, palette, is_liked, play_count) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      song.id,
      song.title,
      song.artist || "Unknown Artist",
      song.album || "Unknown Album",
      song.duration || 0,
      song.uri,
      song.artwork || null,
      paletteValue,
      song.is_liked ? 1 : 0,
      song.play_count || 0,
    ]
  );
};

export const updateSong = async (
  id: string,
  updates: Record<string, string | number | null>
) => {
  const database = getDatabase();
  const fields = Object.keys(updates)
    .map((key) => `${key} = ?`)
    .join(", ");
  const values = [...Object.values(updates), id] as (string | number | null)[];
  await database.runAsync(`UPDATE songs SET ${fields} WHERE id = ?`, values);
};

export const deleteSong = async (id: string) => {
  const database = getDatabase();
  await database.runAsync("DELETE FROM songs WHERE id = ?", [id]);
};

export const toggleLikeSong = async (id: string) => {
  const database = getDatabase();
  await database.runAsync(
    "UPDATE songs SET is_liked = NOT is_liked WHERE id = ?",
    [id]
  );
};

export const incrementPlayCount = async (id: string) => {
  try {
    const database = await getDatabaseSafe();
    // Check if song exists first
    const song = await database.getFirstAsync(
      "SELECT id FROM songs WHERE id = ?",
      [id]
    );
    if (song) {
      await database.runAsync(
        "UPDATE songs SET play_count = play_count + 1 WHERE id = ?",
        [id]
      );
    }
  } catch (error) {
    console.warn("Could not increment play count:", error);
  }
};

// Playlist Operations
export const getAllPlaylists = async () => {
  const database = getDatabase();
  return await database.getAllAsync(
    "SELECT * FROM playlists ORDER BY created_at DESC"
  );
};

export const getPlaylistById = async (id: string) => {
  const database = getDatabase();
  return await database.getFirstAsync("SELECT * FROM playlists WHERE id = ?", [
    id,
  ]);
};

export const addPlaylist = async (playlist: any) => {
  const database = getDatabase();
  await database.runAsync(
    `INSERT INTO playlists (id, name, description, artwork, song_count) 
     VALUES (?, ?, ?, ?, ?)`,
    [
      playlist.id,
      playlist.name,
      playlist.description || "",
      playlist.artwork || null,
      playlist.song_count || 0,
    ]
  );
};

export const updatePlaylist = async (
  id: string,
  updates: Record<string, string | number | null>
) => {
  const database = getDatabase();
  const fields = Object.keys(updates)
    .map((key) => `${key} = ?`)
    .join(", ");
  const values = [...Object.values(updates), id] as (string | number | null)[];
  await database.runAsync(
    `UPDATE playlists SET ${fields} WHERE id = ?`,
    values
  );
};

export const deletePlaylist = async (id: string) => {
  const database = getDatabase();
  await database.runAsync("DELETE FROM playlists WHERE id = ?", [id]);
};

export const getPlaylistSongs = async (playlistId: string) => {
  const database = getDatabase();
  return await database.getAllAsync(
    `SELECT s.* FROM songs s
     JOIN playlist_songs ps ON s.id = ps.song_id
     WHERE ps.playlist_id = ?
     ORDER BY ps.position`,
    [playlistId]
  );
};

export const clearDatabase = async () => {
  const database = await SQLite.openDatabaseAsync("Myoraei.db");
  await database.execAsync("DROP TABLE IF EXISTS songs");
  await database.execAsync("DROP TABLE IF EXISTS playlists");
  await database.execAsync("DROP TABLE IF EXISTS playlist_songs");
};

export const addSongToPlaylist = async (
  playlistId: string,
  songId: string,
  position?: number
) => {
  const database = getDatabase();

  // Get max position if not provided
  let finalPosition: number;
  if (position === undefined) {
    const result: any = await database.getFirstAsync(
      "SELECT MAX(position) as max_pos FROM playlist_songs WHERE playlist_id = ?",
      [playlistId]
    );
    finalPosition = (result?.max_pos ?? -1) + 1;
  } else {
    finalPosition = position;
  }

  await database.runAsync(
    "INSERT INTO playlist_songs (playlist_id, song_id, position) VALUES (?, ?, ?)",
    [playlistId, songId, finalPosition]
  );

  // Update song count
  await database.runAsync(
    "UPDATE playlists SET song_count = song_count + 1 WHERE id = ?",
    [playlistId]
  );
};

export const removeSongFromPlaylist = async (
  playlistId: string,
  songId: string
) => {
  const database = getDatabase();
  await database.runAsync(
    "DELETE FROM playlist_songs WHERE playlist_id = ? AND song_id = ?",
    [playlistId, songId]
  );

  // Update song count
  await database.runAsync(
    "UPDATE playlists SET song_count = song_count - 1 WHERE id = ?",
    [playlistId]
  );
};

// Stats Operations
export const getStats = async () => {
  try {
    const database = await getDatabaseSafe();

    const totalSongs: any = await database.getFirstAsync(
      "SELECT COUNT(*) as count FROM songs"
    );
    const totalPlaylists: any = await database.getFirstAsync(
      "SELECT COUNT(*) as count FROM playlists"
    );
    const likedSongs: any = await database.getFirstAsync(
      "SELECT COUNT(*) as count FROM songs WHERE is_liked = 1"
    );
    const totalPlayCount: any = await database.getFirstAsync(
      "SELECT SUM(play_count) as total FROM songs"
    );

    return {
      total_songs: totalSongs?.count || 0,
      total_playlists: totalPlaylists?.count || 0,
      liked_songs: likedSongs?.count || 0,
      total_play_count: totalPlayCount?.total || 0,
    };
  } catch (error) {
    console.warn("Could not fetch stats:", error);
    return {
      total_songs: 0,
      total_playlists: 0,
      liked_songs: 0,
      total_play_count: 0,
    };
  }
};

// AsyncStorage helpers for simple key-value data
export const saveToStorage = async (key: string, value: any) => {
  await AsyncStorage.setItem(key, JSON.stringify(value));
};

export const getFromStorage = async (key: string) => {
  const value = await AsyncStorage.getItem(key);
  return value ? JSON.parse(value) : null;
};

export const removeFromStorage = async (key: string) => {
  await AsyncStorage.removeItem(key);
};
