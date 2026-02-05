import { Platform } from "react-native";

let SQLite: any = null;
let db: any = null;
let initPromise: Promise<void> | null = null;

export const initDatabase = async () => {
  if (Platform.OS === "web") return;
  if (db) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    if (!SQLite) {
      const sqlite = await import("expo-sqlite");
      SQLite = sqlite;
    }

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
        mbid TEXT,
        album_mbid TEXT,
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
        aka TEXT,
        top_artists TEXT,
        top_tracks TEXT,
        top_albums TEXT,
        CHECK (id = 1)
      );

      CREATE TABLE IF NOT EXISTS listening_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        artist TEXT NOT NULL,
        track TEXT NOT NULL,
        album TEXT,
        timestamp INTEGER NOT NULL,
        mbid TEXT,
        album_mbid TEXT,
        artwork TEXT,
        source TEXT DEFAULT 'lastfm',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_songs_liked ON songs(is_liked);
      CREATE INDEX IF NOT EXISTS idx_songs_play_count ON songs(play_count DESC);

      CREATE INDEX IF NOT EXISTS idx_playlist_songs ON playlist_songs(playlist_id, position);
      CREATE INDEX IF NOT EXISTS idx_music_folders_enabled ON music_folders(is_enabled);

      CREATE INDEX IF NOT EXISTS idx_artist_comments_artist_name ON artist_comments(artist_name);
      CREATE INDEX IF NOT EXISTS idx_song_comments_song_id ON song_comments(song_id);

      CREATE INDEX IF NOT EXISTS idx_listening_history_timestamp ON listening_history(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_listening_history_artist ON listening_history(artist);
      CREATE INDEX IF NOT EXISTS idx_listening_history_track ON listening_history(track);
    `);

      try {
        const settingsInfo: any[] = await db.getAllAsync(
          "PRAGMA table_info(settings)"
        );
        const valueColumn = settingsInfo.find(
          (col: any) => col.name === "value"
        );
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
          console.log(
            "[Database] Migrated settings table value column to TEXT"
          );
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
            await db.execAsync(
              "ALTER TABLE songs ADD COLUMN release_date TEXT;"
            );
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
              await db.execAsync(
                "ALTER TABLE songs ADD COLUMN listeners REAL;"
              );
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

          const hasMbid = songsInfo.some(
            (col: any) => col && col.name === "mbid"
          );
          if (!hasMbid) {
            try {
              await db.execAsync("ALTER TABLE songs ADD COLUMN mbid TEXT;");
              console.log(
                "[Database] Added missing column 'mbid' to 'songs' table."
              );
            } catch (err) {
              console.warn(
                "[Database] Could not add 'mbid' column to 'songs' table:",
                err
              );
            }
          }

          const hasAlbumMbid = songsInfo.some(
            (col: any) => col && col.name === "album_mbid"
          );
          if (!hasAlbumMbid) {
            try {
              await db.execAsync(
                "ALTER TABLE songs ADD COLUMN album_mbid TEXT;"
              );
              console.log(
                "[Database] Added missing column 'album_mbid' to 'songs' table."
              );
            } catch (err) {
              console.warn(
                "[Database] Could not add 'album_mbid' column to 'songs' table:",
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

        const profileInfo: any[] = await db.getAllAsync(
          "PRAGMA table_info(profile)"
        );
        const hasAka = profileInfo.some(
          (col: any) => col && col.name === "aka"
        );
        if (!hasAka) {
          try {
            await db.execAsync("ALTER TABLE profile ADD COLUMN aka TEXT;");
            console.log(
              "[Database] Added missing column 'aka' to 'profile' table."
            );
          } catch (err) {
            console.warn(
              "[Database] Could not add 'aka' column to 'profile' table:",
              err
            );
          }
        }

        const hasTopArtists = profileInfo.some(
          (col: any) => col && col.name === "top_artists"
        );
        if (!hasTopArtists) {
          try {
            await db.execAsync(
              "ALTER TABLE profile ADD COLUMN top_artists TEXT;"
            );
            console.log(
              "[Database] Added missing column 'top_artists' to 'profile' table."
            );
          } catch (err) {
            console.warn(
              "[Database] Could not add 'top_artists' column to 'profile' table:",
              err
            );
          }
        }

        const hasTopTracks = profileInfo.some(
          (col: any) => col && col.name === "top_tracks"
        );
        if (!hasTopTracks) {
          try {
            await db.execAsync(
              "ALTER TABLE profile ADD COLUMN top_tracks TEXT;"
            );
            console.log(
              "[Database] Added missing column 'top_tracks' to 'profile' table."
            );
          } catch (err) {
            console.warn(
              "[Database] Could not add 'top_tracks' column to 'profile' table:",
              err
            );
          }
        }

        const hasTopAlbums = profileInfo.some(
          (col: any) => col && col.name === "top_albums"
        );
        if (!hasTopAlbums) {
          try {
            await db.execAsync(
              "ALTER TABLE profile ADD COLUMN top_albums TEXT;"
            );
            console.log(
              "[Database] Added missing column 'top_albums' to 'profile' table."
            );
          } catch (err) {
            console.warn(
              "[Database] Could not add 'top_albums' column to 'profile' table:",
              err
            );
          }
        }

        const hasPrimaryColor = profileInfo.some(
          (col: any) => col && col.name === "primary_color"
        );
        if (!hasPrimaryColor) {
          try {
            await db.execAsync(
              "ALTER TABLE profile ADD COLUMN primary_color TEXT;"
            );
            console.log(
              "[Database] Added missing column 'primary_color' to 'profile' table."
            );
          } catch (err) {
            console.warn(
              "[Database] Could not add 'primary_color' column to 'profile' table:",
              err
            );
          }
        }

        const hasRawColor = profileInfo.some(
          (col: any) => col && col.name === "raw_color"
        );
        if (!hasRawColor) {
          try {
            await db.execAsync(
              "ALTER TABLE profile ADD COLUMN raw_color TEXT;"
            );
            console.log(
              "[Database] Added missing column 'raw_color' to 'profile' table."
            );
          } catch (err) {
            console.warn(
              "[Database] Could not add 'raw_color' column to 'profile' table:",
              err
            );
          }
        }

        const hasLandingFinished = profileInfo.some(
          (col: any) => col && col.name === "landing_finished"
        );
        if (!hasLandingFinished) {
          try {
            await db.execAsync(
              "ALTER TABLE profile ADD COLUMN landing_finished INTEGER DEFAULT 0;"
            );
            console.log(
              "[Database] Added missing column 'landing_finished' to 'profile' table."
            );
          } catch (err) {
            console.warn(
              "[Database] Could not add 'landing_finished' column to 'profile' table:",
              err
            );
          }
        }

        // Check and add artwork column to listening_history table
        const listeningHistoryInfo: any[] = await db.getAllAsync(
          "PRAGMA table_info(listening_history);"
        );
        const hasArtwork = listeningHistoryInfo.some(
          (col: any) => col && col.name === "artwork"
        );
        if (!hasArtwork) {
          try {
            await db.execAsync(
              "ALTER TABLE listening_history ADD COLUMN artwork TEXT;"
            );
            console.log(
              "[Database] Added missing column 'artwork' to 'listening_history' table."
            );
          } catch (err) {
            console.warn(
              "[Database] Could not add 'artwork' column to 'listening_history' table:",
              err
            );
          }
        }

        // Remove duplicate listening history entries
        try {
          const { removeDuplicateListeningHistory } = await import(
            "./listeningHistoryOperations"
          );
          await removeDuplicateListeningHistory();
        } catch (err) {
          console.warn(
            "[Database] Error removing duplicate listening history:",
            err
          );
        }
      } catch (e) {
        console.warn(
          "[Database] Could not verify/alter artists/profile table schema:",
          e
        );
      }
    } catch (err) {
      initPromise = null;
      throw err;
    }
  })();
  return initPromise;
};

export const getDatabase = (): any => {
  if (!db) {
    throw new Error("Database not initialized. Call initDatabase() first.");
  }
  return db;
};

// Safe database getter that waits for initialization
export const getDatabaseSafe = async (): Promise<any> => {
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
  aka?: string;
  primary_color?: string;
  raw_color?: string;
  landing_finished?: boolean;
}) => {
  const db = await getDatabaseSafe();
  // Ensure aka column exists via init (already handled, but good to be safe)

  await db.runAsync(
    `INSERT INTO profile (id, username, profile_picture, country, playcount, artist_count, track_count, album_count, lastfm_url, aka, primary_color, raw_color, landing_finished) 
     VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       username=excluded.username,
       profile_picture=excluded.profile_picture,
       country=excluded.country,
       playcount=excluded.playcount,
       artist_count=excluded.artist_count,
       track_count=excluded.track_count,
       album_count=excluded.album_count,
       lastfm_url=excluded.lastfm_url,
       aka=excluded.aka,
       primary_color=excluded.primary_color,
       raw_color=excluded.raw_color,
       landing_finished=excluded.landing_finished`,
    [
      profile.username,
      profile.profile_picture,
      profile.country,
      profile.playcount,
      profile.artist_count,
      profile.track_count,
      profile.album_count,
      profile.lastfm_url,
      profile.aka || null,
      profile.primary_color || null,
      profile.raw_color || null,
      profile.landing_finished ? 1 : 0,
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
  aka?: string;
  primary_color?: string;
  raw_color?: string;
  landing_finished?: number;
} | null> => {
  const db = await getDatabaseSafe();
  const result = await db.getFirstAsync(
    `SELECT username, profile_picture, country, playcount, artist_count, track_count, album_count, lastfm_url, aka, primary_color, raw_color, landing_finished FROM profile WHERE id = 1`
  );
  return result as any;
};

export const setLandingFinished = async (finished: boolean = true) => {
  const db = await getDatabaseSafe();
  await db.runAsync(
    `INSERT INTO profile (id, landing_finished) VALUES (1, ?)
     ON CONFLICT(id) DO UPDATE SET landing_finished=excluded.landing_finished`,
    [finished ? 1 : 0]
  );
};

export const getLandingFinished = async (): Promise<boolean> => {
  const db = await getDatabaseSafe();
  const result = await db.getFirstAsync(
    `SELECT landing_finished FROM profile WHERE id = 1`
  );
  return result ? (result as any).landing_finished === 1 : false;
};
