import { getDatabase } from "./databaseCore";
import { getDatabaseSafe } from "./databaseCore";
import * as FileSystem from "expo-file-system/legacy";

function parsePalette(value: unknown): unknown {
  if (Array.isArray(value)) return value;
  if (value == null || typeof value !== "string") return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function parseGenres(value: unknown): string[] {
  if (value == null) return [];
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function resolveArtwork(artwork: unknown): string | undefined {
  if (artwork == null || typeof artwork !== "string") return undefined;
  if (artwork.startsWith("http") || artwork.startsWith("file://"))
    return artwork;
  return (FileSystem as any).documentDirectory + artwork;
}

function transformSongRow(song: any) {
  const palette = parsePalette(song?.palette);
  const genres = parseGenres(song?.genres);
  const artwork = resolveArtwork(song?.artwork);
  return { ...song, artwork: artwork ?? song?.artwork, palette, genres };
}

export const getAllSongs = async () => {
  const database = getDatabase();
  const songs: any[] = await database.getAllAsync(
    "SELECT * FROM songs ORDER BY created_at DESC"
  );
  return songs.map(transformSongRow);
};

export const getSongById = async (id: string) => {
  const database = getDatabase();
  const song = await database.getFirstAsync(
    "SELECT * FROM songs WHERE id = ?",
    [id]
  );
  if (!song) return null;
  return transformSongRow(song);
};

export const getLikedSongs = async () => {
  const database = getDatabase();
  const songs: any[] = await database.getAllAsync(
    "SELECT * FROM songs WHERE is_liked = 1 ORDER BY created_at DESC"
  );
  return songs.map(transformSongRow);
};

export const addSong = async (song: any) => {
  const database = getDatabase();
  const paletteValue = song.palette
    ? typeof song.palette === "string"
      ? song.palette
      : JSON.stringify(song.palette)
    : null;

  await database.runAsync(
    `INSERT INTO songs (id, title, artist, album, duration, uri, artwork, palette, is_liked, play_count, mbid, album_mbid) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      song.mbid || null,
      song.album_mbid || null,
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

export const getTopGenres = async (limit: number = 20) => {
  console.log("[getTopGenres] Starting with limit:", limit);
  const database = getDatabase();
  console.log("[getTopGenres] Database obtained:", !!database);

  const totalHistory: any[] = await database.getAllAsync(
    "SELECT COUNT(*) as count FROM listening_history"
  );
  console.log(
    "[getTopGenres] Total listening history entries:",
    totalHistory[0]?.count || 0
  );

  const recentArtists: any[] = await database.getAllAsync(
    `SELECT artist, COUNT(*) as listen_count 
     FROM listening_history 
     GROUP BY artist 
     ORDER BY listen_count DESC 
     LIMIT 50`
  );
  console.log("[getTopGenres] Top artists found:", recentArtists.length);
  if (recentArtists.length > 0) {
    console.log("[getTopGenres] Top 10 artists:", recentArtists.slice(0, 10));
  }

  if (recentArtists.length === 0) {
    console.log(
      "[getTopGenres] No recent listens, falling back to artists with most songs"
    );
    const artists: any[] = await database.getAllAsync(
      `SELECT DISTINCT artist FROM songs LIMIT 50`
    );
    console.log(
      "[getTopGenres] Found",
      artists.length,
      "unique artists in songs"
    );

    const genreCount: { [key: string]: number } = {};

    for (const artistRow of artists) {
      const artist: any = await database.getFirstAsync(
        "SELECT genres FROM artists WHERE LOWER(name) = LOWER(?) AND genres IS NOT NULL AND genres != '' AND genres != '[]' LIMIT 1",
        [artistRow.artist]
      );

      if (artist) {
        const genres = parseGenres(artist.genres);
        genres.forEach((genre) => {
          if (genre && genre.trim() !== "") {
            genreCount[genre] = (genreCount[genre] || 0) + 1;
          }
        });
      }
    }

    console.log(
      "[getTopGenres] Fallback genre count:",
      Object.keys(genreCount).length,
      genreCount
    );

    const sorted = Object.entries(genreCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);
    console.log("[getTopGenres] Returning fallback genres:", sorted.length);
    return sorted.map(([genre, count]) => ({ text: genre, weight: count }));
  }

  const genreCount: { [key: string]: number } = {};

  for (const listenedArtist of recentArtists) {
    const artist: any = await database.getFirstAsync(
      "SELECT genres FROM artists WHERE LOWER(name) = LOWER(?) AND genres IS NOT NULL AND genres != '' AND genres != '[]' LIMIT 1",
      [listenedArtist.artist]
    );

    if (artist) {
      console.log(
        `[getTopGenres] Found artist ${listenedArtist.artist}, genres:`,
        artist.genres
      );
      const genres = parseGenres(artist.genres);
      genres.forEach((genre) => {
        if (genre && genre.trim() !== "") {
          const weight = listenedArtist.listen_count || 1;
          genreCount[genre] = (genreCount[genre] || 0) + weight;
        }
      });
    } else {
      console.log(
        `[getTopGenres] No artist entry found for ${listenedArtist.artist}`
      );
    }
  }

  console.log(
    "[getTopGenres] Total genres from recent listens:",
    Object.keys(genreCount).length,
    genreCount
  );

  const sorted = Object.entries(genreCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
  console.log("[getTopGenres] Returning recent listen genres:", sorted.length);
  return sorted.map(([genre, count]) => ({ text: genre, weight: count }));
};
