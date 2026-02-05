import { getDatabase } from "./databaseCore";

export interface ListeningHistoryEntry {
  id?: number;
  artist: string;
  track: string;
  album?: string;
  timestamp: number;
  mbid?: string;
  album_mbid?: string;
  artwork?: string;
  source?: string;
  created_at?: string;
}

export const addListeningHistoryEntry = async (
  entry: Omit<ListeningHistoryEntry, "id" | "created_at">
) => {
  const database = getDatabase();
  await database.runAsync(
    `INSERT INTO listening_history (artist, track, album, timestamp, mbid, album_mbid, artwork, source) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      entry.artist,
      entry.track,
      entry.album || null,
      entry.timestamp,
      entry.mbid || null,
      entry.album_mbid || null,
      entry.artwork || null,
      entry.source || "lastfm",
    ]
  );
};

export const addListeningHistoryBatch = async (
  entries: Omit<ListeningHistoryEntry, "id" | "created_at">[]
) => {
  if (entries.length === 0) return;

  const database = getDatabase();

  // Use transaction for better performance and data integrity
  await database.withTransactionAsync(async () => {
    for (const entry of entries) {
      await database.runAsync(
        `INSERT INTO listening_history (artist, track, album, timestamp, mbid, album_mbid, artwork, source) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          entry.artist,
          entry.track,
          entry.album || null,
          entry.timestamp,
          entry.mbid || null,
          entry.album_mbid || null,
          entry.artwork || null,
          entry.source || "lastfm",
        ]
      );
    }
  });
};

export const getListeningHistory = async (
  limit: number = 100,
  offset: number = 0
): Promise<ListeningHistoryEntry[]> => {
  const database = getDatabase();
  const entries: any[] = await database.getAllAsync(
    "SELECT * FROM listening_history ORDER BY timestamp DESC LIMIT ? OFFSET ?",
    [limit, offset]
  );
  return entries;
};

export const getListeningHistoryByArtist = async (
  artist: string,
  limit: number = 50
): Promise<ListeningHistoryEntry[]> => {
  const database = getDatabase();
  const entries: any[] = await database.getAllAsync(
    "SELECT * FROM listening_history WHERE artist = ? ORDER BY timestamp DESC LIMIT ?",
    [artist, limit]
  );
  return entries;
};

export const getListeningHistoryByTrack = async (
  artist: string,
  track: string
): Promise<ListeningHistoryEntry[]> => {
  const database = getDatabase();
  const entries: any[] = await database.getAllAsync(
    "SELECT * FROM listening_history WHERE artist = ? AND track = ? ORDER BY timestamp DESC",
    [artist, track]
  );
  return entries;
};

export const getListeningHistoryCount = async (): Promise<number> => {
  const database = getDatabase();
  const result: any = await database.getFirstAsync(
    "SELECT COUNT(*) as count FROM listening_history"
  );
  return result?.count || 0;
};

export const clearListeningHistory = async (source?: string) => {
  const database = getDatabase();
  if (source) {
    await database.runAsync("DELETE FROM listening_history WHERE source = ?", [
      source,
    ]);
  } else {
    await database.runAsync("DELETE FROM listening_history");
  }
};

export const removeDuplicateListeningHistory = async () => {
  const database = getDatabase();

  try {
    // Remove duplicates, keeping the first entry (lowest id) for each unique combination
    await database.execAsync(`
      DELETE FROM listening_history
      WHERE id NOT IN (
        SELECT MIN(id)
        FROM listening_history
        GROUP BY LOWER(artist), LOWER(track), timestamp
      )
    `);

    const result: any = await database.getFirstAsync(
      "SELECT COUNT(*) as count FROM listening_history"
    );

    console.log(
      `[Database] Cleaned listening history, ${
        result?.count || 0
      } unique entries remaining.`
    );
  } catch (error) {
    console.warn(
      "[Database] Error removing duplicate listening history:",
      error
    );
  }
};
