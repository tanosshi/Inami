import * as SQLite from "expo-sqlite";
import { getDatabaseSafe } from "./databaseCore";

export const clearDatabase = async () => {
  const database = await SQLite.openDatabaseAsync("Inami.db");
  await database.execAsync("DROP TABLE IF EXISTS songs");
  await database.execAsync("DROP TABLE IF EXISTS playlists");
  await database.execAsync("DROP TABLE IF EXISTS playlist_songs");
};

export const clearSongsDatabase = async () => {
  const database = await SQLite.openDatabaseAsync("Inami.db");
  await database.execAsync("DELETE FROM songs");
  await database.execAsync("DELETE FROM playlist_songs");
};

export const mergeDuplicateArtists = async () => {
  try {
    const database = await getDatabaseSafe();

    // Get all artists grouped by name (case insensitive)
    const artists = (await database.getAllAsync(`
      SELECT name, COUNT(*) as count
      FROM artists
      GROUP BY LOWER(name)
      HAVING COUNT(*) > 1
      ORDER BY name
    `)) as { name: string; count: number }[];

    console.log(`[Merge] Found ${artists.length} artist names with duplicates`);

    for (const artist of artists) {
      console.log(
        `[Merge] Processing ${artist.count} duplicates for "${artist.name}"`
      );

      // Get all records for this artist name
      const duplicates = (await database.getAllAsync(
        `
        SELECT rowid, * FROM artists
        WHERE LOWER(name) = LOWER(?)
        ORDER BY created_at ASC
      `,
        [artist.name]
      )) as any[];

      console.log(
        `[Merge] Retrieved ${duplicates.length} records for "${artist.name}"`
      );

      if (duplicates.length < 2) continue;

      // Find the best record to keep (prefer one with most non-null fields, then most recent)
      let bestIndex = 0;
      let bestScore = 0;
      let bestCreatedAt = duplicates[0].created_at;

      for (let i = 0; i < duplicates.length; i++) {
        const record = duplicates[i];
        let score = 0;
        if (record.mbid && record.mbid !== "zero") score++;
        if (record.wikidata_id && record.wikidata_id !== "zero") score++;
        if (record.image_url) score++;
        if (record.fallback_url) score++;
        if (record.listeners) score++;
        if (record.genres) score++;
        if (record.last_release_date) score++;

        console.log(
          `[Merge] Record ${i} score: ${score}, listeners: ${record.listeners}, created_at: ${record.created_at}`
        );

        const isBetter =
          score > bestScore ||
          (score === bestScore && record.created_at > bestCreatedAt);

        if (isBetter) {
          bestScore = score;
          bestIndex = i;
          bestCreatedAt = record.created_at;
        }
      }

      console.log(
        `[Merge] Best record index: ${bestIndex}, score: ${bestScore}`
      );

      const bestRecord = duplicates[bestIndex];

      // Merge all non-null fields into the best record
      const updates: string[] = [];
      const params: any[] = [];

      for (let i = 0; i < duplicates.length; i++) {
        if (i === bestIndex) continue;
        const record = duplicates[i];

        if (record.listeners && !bestRecord.listeners) {
          updates.push("listeners = ?");
          params.push(record.listeners);
          bestRecord.listeners = record.listeners;
          console.log(
            `[Merge] Merging listeners ${record.listeners} into best record`
          );
        }
        // Add other fields if needed
      }

      // Update the best record with merged data
      if (updates.length > 0) {
        params.push(bestRecord.rowid);
        await database.runAsync(
          `UPDATE artists SET ${updates.join(", ")} WHERE rowid = ?`,
          params
        );
        console.log(`[Merge] Updated best record for ${bestRecord.name}`);
      }

      // Delete duplicate records
      const duplicateRowIds = duplicates
        .filter((_, index) => index !== bestIndex)
        .map((record) => record.rowid);

      console.log(
        `[Merge] Deleting ${
          duplicateRowIds.length
        } duplicate records: ${duplicateRowIds.join(", ")}`
      );

      if (duplicateRowIds.length > 0) {
        await database.runAsync(
          `DELETE FROM artists WHERE rowid IN (${duplicateRowIds
            .map(() => "?")
            .join(",")})`,
          duplicateRowIds
        );
        console.log(
          `[Merge] Deleted ${duplicateRowIds.length} duplicate records for ${bestRecord.name}`
        );
      }
    }

    console.log("[Merge] Artist deduplication completed");
  } catch (error) {
    console.error("[Merge] Error merging duplicate artists:", error);
  }
};

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

    // Calculate top artist by total play count
    const topArtist: any = await database.getFirstAsync(`
      SELECT artist, SUM(play_count) as total_plays
      FROM songs
      WHERE artist IS NOT NULL AND artist != ''
      GROUP BY artist
      ORDER BY total_plays DESC
      LIMIT 1
    `);

    return {
      total_songs: totalSongs?.count || 0,
      total_playlists: totalPlaylists?.count || 0,
      liked_songs: likedSongs?.count || 0,
      total_play_count: totalPlayCount?.total || 0,
      top_artist: topArtist?.artist || null,
    };
  } catch (error) {
    console.warn("Could not fetch stats:", error);
    return {
      total_songs: 0,
      total_playlists: 0,
      liked_songs: 0,
      total_play_count: 0,
      top_artist: null,
    };
  }
};
