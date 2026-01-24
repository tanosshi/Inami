import { getDatabaseSafe } from "./database";
import * as FileSystem from "expo-file-system/legacy";
import { downloadImage } from "./songMetadata";
import { downloadImage as downloadArtistImage } from "./artistMetadata";

interface SongRecord {
  id: string;
  artwork: string | null;
  uri: string;
}

interface ArtistRecord {
  name: string;
  image_url: string | null;
  fallback_url: string | null;
}

interface SongWithArtwork {
  id: string;
  artwork: string;
  title: string;
}

interface ArtistWithImage {
  name: string;
  image_url: string;
  fallback_url: string | null;
}

export async function validateImageExists(imageUri: string): Promise<boolean> {
  if (!imageUri) return false;

  try {
    const info = await FileSystem.getInfoAsync(imageUri);
    return info.exists;
  } catch (error) {
    console.warn(
      `[ImageValidation] Failed to check image existence: ${imageUri}`,
      error
    );
    return false;
  }
}

export async function validateAudioExists(audioUri: string): Promise<boolean> {
  if (!audioUri) return false;

  try {
    const info = await FileSystem.getInfoAsync(audioUri);
    return info.exists;
  } catch (error) {
    console.warn(
      `[AudioValidation] Failed to check audio file existence: ${audioUri}`,
      error
    );
    return false;
  }
}

export async function validateAndRefetchSongImage(
  songId: string,
  imageUri: string,
  fallbackUrl: string
): Promise<string | null> {
  try {
    const fullUri =
      imageUri.startsWith("http") || imageUri.startsWith("file://")
        ? imageUri
        : (FileSystem as any).documentDirectory + imageUri;

    const exists = await validateImageExists(fullUri);
    if (exists) return imageUri;

    console.log(
      `[ImageValidation] Song image missing, cannot refetch (no external source): ${songId}`
    );

    const db = await getDatabaseSafe();
    await db.runAsync("UPDATE songs SET artwork = NULL WHERE id = ?", [songId]);

    return null;
  } catch (error) {
    console.warn(
      `[ImageValidation] Failed to validate song image: ${songId}`,
      error
    );
    return fallbackUrl;
  }
}

export async function validateAndRefetchArtistImage(
  artistName: string,
  imageUri: string,
  fallbackUrl: string
): Promise<string | null> {
  try {
    const fullUri =
      imageUri.startsWith("http") || imageUri.startsWith("file://")
        ? imageUri
        : (FileSystem as any).documentDirectory + imageUri;

    const exists = await validateImageExists(fullUri);
    if (exists) return imageUri;

    console.log(
      `[ImageValidation] Artist image missing, refetching: ${artistName}`
    );

    const newUri = await downloadArtistImage(fallbackUrl);

    const db = await getDatabaseSafe();
    await db.runAsync(
      "UPDATE artists SET image_url = ? WHERE name = ? COLLATE NOCASE",
      [newUri, artistName]
    );

    return newUri;
  } catch (error) {
    console.warn(
      `[ImageValidation] Failed to refetch artist image: ${artistName}`,
      error
    );
    return fallbackUrl;
  }
}

export async function cleanupOrphanedFiles(): Promise<void> {
  try {
    const db = await getDatabaseSafe();

    const songsWithArtwork: SongRecord[] = await db.getAllAsync(
      "SELECT id, artwork FROM songs WHERE artwork IS NOT NULL"
    );
    let imagesCleaned = 0;

    for (const song of songsWithArtwork) {
      if (
        song.artwork &&
        !song.artwork.startsWith("http") &&
        !song.artwork.startsWith("file://")
      ) {
        const fullUri = (FileSystem as any).documentDirectory + song.artwork;
        const exists = await validateImageExists(fullUri);
        if (!exists) {
          await db.runAsync("UPDATE songs SET artwork = NULL WHERE id = ?", [
            song.id,
          ]);
          imagesCleaned++;
        }
      }
    }

    const songsWithAudio: SongRecord[] = await db.getAllAsync(
      "SELECT id, uri FROM songs WHERE uri IS NOT NULL"
    );
    let audioCleaned = 0;

    for (const song of songsWithAudio) {
      if (
        song.uri &&
        !song.uri.startsWith("http") &&
        !song.uri.startsWith("content://")
      ) {
        const exists = await validateAudioExists(song.uri);
        if (!exists) {
          await db.runAsync("DELETE FROM songs WHERE id = ?", [song.id]);
          await db.runAsync("DELETE FROM playlist_songs WHERE song_id = ?", [
            song.id,
          ]);
          audioCleaned++;
          console.log(`[AudioValidation] Removed orphaned song: ${song.id}`);
        }
      }
    }

    const artists: ArtistRecord[] = await db.getAllAsync(
      "SELECT name, image_url FROM artists WHERE image_url IS NOT NULL"
    );

    for (const artist of artists) {
      if (
        artist.image_url &&
        !artist.image_url.startsWith("http") &&
        !artist.image_url.startsWith("file://")
      ) {
        const fullUri =
          (FileSystem as any).documentDirectory + artist.image_url;
        const exists = await validateImageExists(fullUri);
        if (!exists) {
          await db.runAsync(
            "UPDATE artists SET image_url = fallback_url WHERE name = ? COLLATE NOCASE",
            [artist.name]
          );
        }
      }
    }
  } catch (error) {
    console.error("[ImageValidation] Cleanup failed:", error);
  }
}

export async function validateAllImages(): Promise<void> {
  console.log("[ImageValidation] Starting validation of all images...");

  try {
    const db = await getDatabaseSafe();

    const songs: SongWithArtwork[] = await db.getAllAsync(`
      SELECT id, artwork, title 
      FROM songs 
      WHERE artwork IS NOT NULL 
      AND (artwork LIKE '%/cache/%' OR artwork LIKE '%/cache/%' OR artwork LIKE '%/images/%')
    `);

    for (const song of songs) {
      if (song.artwork && !song.artwork.startsWith("http"))
        await validateAndRefetchSongImage(song.id, song.artwork, song.artwork);
    }

    const artists: ArtistWithImage[] = await db.getAllAsync(`
      SELECT name, image_url, fallback_url 
      FROM artists 
      WHERE image_url IS NOT NULL 
      AND (image_url LIKE '%/cache/%' OR image_url LIKE '%/cache/%' OR image_url LIKE '%/images/%')
    `);

    for (const artist of artists) {
      if (
        artist.image_url &&
        !artist.image_url.startsWith("http") &&
        artist.fallback_url
      ) {
        await validateAndRefetchArtistImage(
          artist.name,
          artist.image_url,
          artist.fallback_url
        );
      }
    }

    console.log("[ImageValidation] Image validation complete");
  } catch (error) {
    console.error("[ImageValidation] Image validation failed:", error);
  }
}
