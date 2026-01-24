import { getDatabase } from "./databaseCore";
import * as FileSystem from "expo-file-system/legacy";

interface ArtistRecord {
  id?: string;
  name: string;
  mbid?: string;
  wikidata_id?: string;
  image_url?: string | null;
  fallback_url?: string | null;
  listeners?: number | null;
  genres?: string | null;
  last_release_date?: string | null;
  created_at?: string;
}

export const getAllArtists = async (): Promise<ArtistRecord[]> => {
  const database = getDatabase();
  const artists = await database.getAllAsync<ArtistRecord>(
    "SELECT * FROM artists ORDER BY name COLLATE NOCASE ASC"
  );

  return artists.map((artist) => ({
    ...artist,
    image_url:
      artist.image_url &&
      !artist.image_url.startsWith("http") &&
      !artist.image_url.startsWith("file://")
        ? (FileSystem as any).documentDirectory + artist.image_url
        : artist.image_url,
    fallback_url:
      artist.fallback_url &&
      !artist.fallback_url.startsWith("http") &&
      !artist.fallback_url.startsWith("file://")
        ? (FileSystem as any).documentDirectory + artist.fallback_url
        : artist.fallback_url,
  }));
};

export const getArtist = async (
  identifier: string,
  by?: "mbid" | "name"
): Promise<ArtistRecord | null> => {
  console.log(
    "[Database] getArtist called with identifier:",
    identifier,
    "by:",
    by
  );
  const database = getDatabase();

  let result: ArtistRecord | null = null;

  if (by === "mbid") {
    result = await database.getFirstAsync<ArtistRecord>(
      "SELECT * FROM artists WHERE mbid = ? LIMIT 1",
      [identifier]
    );
    console.log("[Database] getArtist by MBID result:", result);
  } else if (by === "name") {
    result = await database.getFirstAsync<ArtistRecord>(
      "SELECT * FROM artists WHERE name = ? COLLATE NOCASE LIMIT 1",
      [identifier]
    );
    console.log("[Database] getArtist by name result:", result);
  } else {
    // Try MBID first, then name
    console.log("[Database] getArtist trying MBID first");
    const byMbid = await database.getFirstAsync<ArtistRecord>(
      "SELECT * FROM artists WHERE mbid = ? LIMIT 1",
      [identifier]
    );
    if (byMbid) {
      console.log("[Database] getArtist found by MBID:", byMbid);
      result = byMbid;
    } else {
      console.log("[Database] getArtist trying name");
      const byName = await database.getFirstAsync<ArtistRecord>(
        "SELECT * FROM artists WHERE name = ? COLLATE NOCASE LIMIT 1",
        [identifier]
      );
      console.log("[Database] getArtist by name result:", byName);
      result = byName;
    }
  }

  if (result) {
    return {
      ...result,
      image_url:
        result.image_url &&
        !result.image_url.startsWith("http") &&
        !result.image_url.startsWith("file://")
          ? (FileSystem as any).documentDirectory + result.image_url
          : result.image_url,
      fallback_url:
        result.fallback_url &&
        !result.fallback_url.startsWith("http") &&
        !result.fallback_url.startsWith("file://")
          ? (FileSystem as any).documentDirectory + result.fallback_url
          : result.fallback_url,
    };
  }

  return result;
};

export const upsertArtist = async (
  artistData: Partial<ArtistRecord> & { name: string }
): Promise<void> => {
  const database = getDatabase();

  // Check if artist exists by name (case insensitive)
  const existingArtist = await database.getFirstAsync<ArtistRecord>(
    "SELECT * FROM artists WHERE name = ? COLLATE NOCASE LIMIT 1",
    [artistData.name]
  );

  if (existingArtist) {
    // Update existing artist, merging non-null fields
    const updates: string[] = [];
    const params: any[] = [];

    if (artistData.mbid !== undefined && artistData.mbid !== null) {
      updates.push("mbid = ?");
      params.push(artistData.mbid);
    }
    if (
      artistData.wikidata_id !== undefined &&
      artistData.wikidata_id !== null
    ) {
      updates.push("wikidata_id = ?");
      params.push(artistData.wikidata_id);
    }
    if (artistData.image_url !== undefined && artistData.image_url !== null) {
      updates.push("image_url = ?");
      params.push(artistData.image_url);
    }
    if (
      artistData.fallback_url !== undefined &&
      artistData.fallback_url !== null
    ) {
      updates.push("fallback_url = ?");
      params.push(artistData.fallback_url);
    }
    if (artistData.listeners !== undefined && artistData.listeners !== null) {
      updates.push("listeners = ?");
      params.push(artistData.listeners);
    }
    if (artistData.genres !== undefined && artistData.genres !== null) {
      updates.push("genres = ?");
      params.push(artistData.genres);
    }
    if (
      artistData.last_release_date !== undefined &&
      artistData.last_release_date !== null
    ) {
      updates.push("last_release_date = ?");
      params.push(artistData.last_release_date);
    }

    if (updates.length > 0) {
      params.push(existingArtist.id);
      await database.runAsync(
        `UPDATE artists SET ${updates.join(", ")} WHERE id = ?`,
        params
      );
      console.log(
        `Updated artist ${artistData.name} with ${updates.length} fields`
      );
    }
  } else {
    // Insert new artist
    const artistStr = String(artistData.name);
    const hash = Math.abs(
      Array.from(artistStr).reduce(
        (h: number, c: string) => ((h << 5) - h + c.charCodeAt(0)) | 0,
        0
      )
    ).toString(16);
    const artistId = `artist_${hash}_${Date.now().toString(36)}`;

    await database.runAsync(
      `INSERT INTO artists (id, name, mbid, wikidata_id, image_url, fallback_url, listeners, genres, last_release_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        artistId,
        artistData.name,
        artistData.mbid || null,
        artistData.wikidata_id || null,
        artistData.image_url || null,
        artistData.fallback_url || null,
        artistData.listeners || null,
        artistData.genres || null,
        artistData.last_release_date || null,
      ]
    );
    console.log(`Inserted new artist ${artistData.name} with id ${artistId}`);
  }
};
