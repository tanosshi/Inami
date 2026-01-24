import { getDatabase } from "./databaseCore";
import { getDatabaseSafe } from "./databaseCore";
import * as FileSystem from "expo-file-system/legacy";

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

    const genres = (song as any)?.genres
      ? (() => {
          try {
            const parsed = JSON.parse((song as any).genres);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })()
      : [];

    const artwork =
      (song as any)?.artwork &&
      !(song as any).artwork.startsWith("http") &&
      !(song as any).artwork.startsWith("file://")
        ? (FileSystem as any).documentDirectory + (song as any).artwork
        : (song as any)?.artwork;

    return {
      ...song,
      artwork,
      palette,
      genres,
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

  const genres = (song as any)?.genres
    ? (() => {
        try {
          const parsed = JSON.parse((song as any).genres);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      })()
    : [];

  const artwork =
    (song as any)?.artwork &&
    !(song as any).artwork.startsWith("http") &&
    !(song as any).artwork.startsWith("file://")
      ? (FileSystem as any).documentDirectory + (song as any).artwork
      : (song as any)?.artwork;

  return {
    ...song,
    artwork,
    palette,
    genres,
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

    const genres = (song as any)?.genres
      ? (() => {
          try {
            const parsed = JSON.parse((song as any).genres);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })()
      : [];

    const artwork =
      (song as any)?.artwork &&
      !(song as any).artwork.startsWith("http") &&
      !(song as any).artwork.startsWith("file://")
        ? (FileSystem as any).documentDirectory + (song as any).artwork
        : (song as any)?.artwork;

    return {
      ...song,
      artwork,
      palette,
      genres,
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
