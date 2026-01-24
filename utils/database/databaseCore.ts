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
    db = await SQLite.openDatabaseAsync("Inami.db");

    await db.execAsync("PRAGMA journal_mode=WAL;"); // Enable WAL mode for better concurrency and reduce locking issues
    await db.execAsync("PRAGMA busy_timeout=5000;"); // Set busy timeout to wait for locks to be released (5 seconds)

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS songs (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        artist TEXT DEFAULT 'Unknown Artist',
        album TEXT DEFAULT 'Unknown Album',
        genres TEXT,
        track_small_info TEXT,
        track_big_info TEXT,
        listeners REAL,
        release_date TEXT,
        duration REAL DEFAULT 0,
        uri TEXT NOT NULL,
        artwork TEXT,
        palette TEXT,
        is_liked INTEGER DEFAULT 0,
        play_count INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS artists (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        mbid TEXT,
        wikidata_id TEXT,
        image_url TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS artist_comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        artist_name TEXT NOT NULL,
        userName TEXT NOT NULL,
        text TEXT NOT NULL,
        profile TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (artist_name) REFERENCES artists(name) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS song_comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        song_id TEXT NOT NULL,
        artist_name TEXT NOT NULL,
        user TEXT NOT NULL,
        text TEXT NOT NULL,
        profile TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
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

      CREATE TABLE IF NOT EXISTS music_folders (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        uri TEXT NOT NULL,
        is_enabled INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS settings_theme (
        id INTEGER PRIMARY KEY DEFAULT 1,
        theme TEXT NOT NULL DEFAULT 'Black',
        nav_toggle INTEGER DEFAULT 1,
        show_nav_text_toggle INTEGER DEFAULT 1,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        CHECK (id = 1)
      );

      CREATE TABLE IF NOT EXISTS settings (
        codename TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS profile (
        id INTEGER PRIMARY KEY DEFAULT 1,
        username TEXT,
        profile_picture TEXT,
        country TEXT,
        playcount TEXT,
        artist_count TEXT,
        track_count TEXT,
        album_count TEXT,
        lastfm_url TEXT,
        CHECK (id = 1)
      );

      CREATE INDEX IF NOT EXISTS idx_songs_liked ON songs(is_liked);
      CREATE INDEX IF NOT EXISTS idx_songs_play_count ON songs(play_count DESC);
      CREATE INDEX IF NOT EXISTS idx_playlist_songs ON playlist_songs(playlist_id, position);
      CREATE INDEX IF NOT EXISTS idx_music_folders_enabled ON music_folders(is_enabled);
      CREATE INDEX IF NOT EXISTS idx_artist_comments_artist_name ON artist_comments(artist_name);
      CREATE INDEX IF NOT EXISTS idx_song_comments_song_id ON song_comments(song_id);
    `);

    try {
      const settingsInfo: any[] = await db.getAllAsync(
        "PRAGMA table_info(settings)"
      );
      const valueColumn = settingsInfo.find((col: any) => col.name === "value");
      if (valueColumn && valueColumn.type === "INTEGER") {
        // Migrate to TEXT
        await db.execAsync(`
          CREATE TABLE settings_new (
            codename TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
          );
          INSERT INTO settings_new (codename, value, updated_at)
          SELECT codename, CASE WHEN value = 1 THEN 'true' ELSE 'false' END, updated_at FROM settings;
          DROP TABLE settings;
          ALTER TABLE settings_new RENAME TO settings;
        `);
        console.log("[Database] Migrated settings table value column to TEXT");
      }
    } catch (error) {
      console.warn("[Database] Could not migrate settings table:", error);
    }

    try {
      // Ensure songs table has genres and release_date columns (for migrations)
      try {
        const songsInfo: any[] = await db.getAllAsync(
          "PRAGMA table_info(songs)"
        );
        const hasGenres = songsInfo.some(
          (col: any) => col && col.name === "genres"
        );
        const hasReleaseDate = songsInfo.some(
          (col: any) => col && col.name === "release_date"
        );
        const hasLyrics = songsInfo.some(
          (col: any) => col && col.name === "lyrics"
        );
        const hasTrackSmall = songsInfo.some(
          (col: any) => col && col.name === "track_small_info"
        );
        const hasTrackBig = songsInfo.some(
          (col: any) => col && col.name === "track_big_info"
        );
        const hasListeners = songsInfo.some(
          (col: any) => col && col.name === "listeners"
        );
        if (!hasGenres) {
          await db.execAsync("ALTER TABLE songs ADD COLUMN genres TEXT;");
          console.log(
            "[Database] Added missing column 'genres' to 'songs' table."
          );
        }
        if (!hasReleaseDate) {
          await db.execAsync("ALTER TABLE songs ADD COLUMN release_date TEXT;");
          console.log(
            "[Database] Added missing column 'release_date' to 'songs' table."
          );
        }
        if (!hasLyrics) {
          try {
            await db.execAsync("ALTER TABLE songs ADD COLUMN lyrics TEXT;");
            console.log(
              "[Database] Added missing column 'lyrics' to 'songs' table."
            );
          } catch (err) {
            console.warn(
              "[Database] Could not add 'lyrics' column to 'songs' table:",
              err
            );
          }
        }
        if (!hasTrackSmall) {
          try {
            await db.execAsync(
              "ALTER TABLE songs ADD COLUMN track_small_info TEXT;"
            );
            console.log(
              "[Database] Added missing column 'track_small_info' to 'songs' table."
            );
          } catch (err) {
            console.warn(
              "[Database] Could not add 'track_small_info' column to 'songs' table:",
              err
            );
          }
        }
        if (!hasTrackBig) {
          try {
            await db.execAsync(
              "ALTER TABLE songs ADD COLUMN track_big_info TEXT;"
            );
            console.log(
              "[Database] Added missing column 'track_big_info' to 'songs' table."
            );
          } catch (err) {
            console.warn(
              "[Database] Could not add 'track_big_info' column to 'songs' table:",
              err
            );
          }
        }
        if (!hasListeners) {
          try {
            await db.execAsync("ALTER TABLE songs ADD COLUMN listeners REAL;");
            console.log(
              "[Database] Added missing column 'listeners' to 'songs' table."
            );
          } catch (err) {
            console.warn(
              "[Database] Could not add 'listeners' column to 'songs' table:",
              err
            );
          }
        }
      } catch (e) {
        console.warn(
          "[Database] Could not verify/alter songs table schema:",
          e
        );
      }

      const tableInfo: any[] = await db.getAllAsync(
        "PRAGMA table_info(artists)"
      );
      const hasImageUrl = tableInfo.some(
        (col: any) => col && col.name === "image_url"
      );
      if (!hasImageUrl) {
        await db.execAsync("ALTER TABLE artists ADD COLUMN image_url TEXT;");
        console.log(
          "[Database] Added missing column 'image_url' to 'artists' table."
        );
      }
      const hasFallbackUrl = tableInfo.some(
        (col: any) => col && col.name === "fallback_url"
      );
      if (!hasFallbackUrl) {
        try {
          await db.execAsync(
            "ALTER TABLE artists ADD COLUMN fallback_url TEXT;"
          );
          console.log(
            "[Database] Added missing column 'fallback_url' to 'artists' table."
          );
        } catch (err) {
          console.warn(
            "[Database] Could not add 'fallback_url' column to 'artists' table:",
            err
          );
        }
      }

      const hasArtistGenres = tableInfo.some(
        (col: any) => col && col.name === "genres"
      );
      if (!hasArtistGenres) {
        try {
          await db.execAsync("ALTER TABLE artists ADD COLUMN genres TEXT;");
          console.log(
            "[Database] Added missing column 'genres' to 'artists' table."
          );
        } catch (err) {
          console.warn(
            "[Database] Could not add 'genres' column to 'artists' table:",
            err
          );
        }
      }

      const hasLastRelease = tableInfo.some(
        (col: any) => col && col.name === "last_release_date"
      );
      if (!hasLastRelease) {
        try {
          await db.execAsync(
            "ALTER TABLE artists ADD COLUMN last_release_date TEXT;"
          );
          console.log(
            "[Database] Added missing column 'last_release_date' to 'artists' table."
          );
        } catch (err) {
          console.warn(
            "[Database] Could not add 'last_release_date' column to 'artists' table:",
            err
          );
        }
      }

      const hasListeners = tableInfo.some(
        (col: any) => col && col.name === "listeners"
      );
      if (!hasListeners) {
        try {
          await db.execAsync(
            "ALTER TABLE artists ADD COLUMN listeners INTEGER;"
          );
          console.log(
            "[Database] Added missing column 'listeners' to 'artists' table."
          );
        } catch (err) {
          console.warn(
            "[Database] Could not add 'listeners' column to 'artists' table:",
            err
          );
        }
      }
    } catch (e) {
      console.warn(
        "[Database] Could not verify/alter artists table schema:",
        e
      );
    }
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

// Export the db instance for other modules to use
export { db };

export const saveProfile = async (profile: {
  username: string;
  profile_picture: string;
  country: string;
  playcount: string;
  artist_count: string;
  track_count: string;
  album_count: string;
  lastfm_url: string;
}) => {
  const db = await getDatabaseSafe();
  await db.runAsync(
    `INSERT OR REPLACE INTO profile (id, username, profile_picture, country, playcount, artist_count, track_count, album_count, lastfm_url) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      profile.username,
      profile.profile_picture,
      profile.country,
      profile.playcount,
      profile.artist_count,
      profile.track_count,
      profile.album_count,
      profile.lastfm_url,
    ]
  );
};

export const getProfileItem = async (): Promise<{
  username: string;
  profile_picture: string;
  country: string;
  playcount: string;
  artist_count: string;
  track_count: string;
  album_count: string;
  lastfm_url: string;
} | null> => {
  const db = await getDatabaseSafe();
  const result = await db.getFirstAsync(
    `SELECT username, profile_picture, country, playcount, artist_count, track_count, album_count, lastfm_url FROM profile WHERE id = 1`
  );
  return result as any;
};
