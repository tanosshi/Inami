import { Platform, PermissionsAndroid } from "react-native";
import * as db from "./database";
import { extractMetadata } from "./metadataExtractor";
import {
  scanAllMusicFolders,
  scanDirectoryForAudio,
  removeFolder,
  AudioFile,
} from "./folderManager";
import { useSongStore } from "../store/songStore";

export interface AudioAsset {
  id: string;
  filename: string;
  uri: string;
  duration: number;
  albumId?: string;
}

export const requestPermissions = async (): Promise<boolean> => {
  if (Platform.OS !== "android") return false;

  try {
    if (Platform.Version >= 33) {
      const result = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO,
      ]);
      return (
        result[PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO] ===
        PermissionsAndroid.RESULTS.GRANTED
      );
    } else {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
      );
      return result === PermissionsAndroid.RESULTS.GRANTED;
    }
  } catch (error) {
    console.error("Error requesting storage permissions:", error);
    return false;
  }
};

const generateSongId = (uri: string): string => {
  let hash = 0;
  for (let i = 0; i < uri.length; i++) {
    const char = uri.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `song_${Math.abs(hash).toString(16)}_${Date.now().toString(36)}`;
};

const cleanFilename = (filename: string): string => {
  return filename
    .replace(/\[.*?\]/g, "")
    .replace(/\.(mp3|wav|m4a|flac|ogg|aac|wma)$/i, "")
    .trim();
};

const CONCURRENT_BATCH_SIZE = 5;
const processAudioFile = async (
  audioFile: AudioFile
): Promise<{
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  uri: string;
  artwork: string | null;
  is_liked: boolean;
  palette: string[] | null;
  play_count: number;
} | null> => {
  try {
    const fileName = cleanFilename(audioFile.name);
    let metadata;

    try {
      metadata = await extractMetadata(audioFile.uri, fileName);
    } catch {
      console.warn(
        `Failed to extract metadata for ${audioFile.name}, using fallbacks.`
      );
      let title = fileName;
      let artist = "Unknown Artist";

      if (title.includes(" - ")) {
        const parts = title.split(" - ");
        if (parts.length >= 2) {
          artist = parts[0].trim();
          title = parts.slice(1).join(" - ").trim();
        }
      }

      metadata = {
        title,
        artist,
        album: "Unknown Album",
        duration: 0,
        artwork: undefined,
        palette: undefined,
      };
    }

    return {
      id: generateSongId(audioFile.uri),
      title: metadata.title,
      artist: metadata.artist,
      album: metadata.album,
      duration: metadata.duration || 0,
      uri: audioFile.uri,
      artwork: metadata.artwork || null,
      is_liked: false,
      palette: metadata.palette || null,
      play_count: 0,
    };
  } catch {
    console.error(`Error processing ${audioFile.name}`);
    return null;
  }
};

const processBatch = async (
  files: AudioFile[],
  onProgress?: (current: number, total: number, totalFiles: number) => void,
  startIndex: number = 0,
  totalFiles: number = files.length
): Promise<void> => {
  const results = await Promise.all(
    files.map(async (file, index) => {
      const song = await processAudioFile(file);
      if (onProgress) {
        onProgress(startIndex + index + 1, totalFiles, totalFiles);
      }
      return song;
    })
  );

  for (const song of results) {
    if (song) {
      try {
        await db.addSong(song);
      } catch (error) {
        console.warn(`Failed to add song ${song.title}:`, error);
      }
    }
  }
};

export const scanDeviceMusic = async (
  onProgress?: (current: number, total: number) => void
): Promise<void> => {
  try {
    const audioFiles = await scanAllMusicFolders();

    if (audioFiles.length === 0) return;

    console.log(`${audioFiles.length} audio files in folders`);

    const existingSongs = await db.getAllSongs();
    const existingUris = new Set(existingSongs.map((s) => s.uri));

    const newFiles = audioFiles.filter((f) => !existingUris.has(f.uri));

    if (newFiles.length === 0) {
      if (onProgress) onProgress(audioFiles.length, audioFiles.length);
      return;
    }

    for (let i = 0; i < newFiles.length; i += CONCURRENT_BATCH_SIZE) {
      const batch = newFiles.slice(i, i + CONCURRENT_BATCH_SIZE);
      await processBatch(
        batch,
        (current) => {
          if (onProgress) onProgress(i + current, newFiles.length);
        },
        i,
        newFiles.length
      );
    }

    console.log("Scan complete!");
  } catch (error) {
    console.error("Error scanning device music:", error);
    throw error;
  }
};

export const refreshLibrary = async (
  onProgress?: (current: number, total: number) => void
): Promise<void> => {
  try {
    const existingSongs = await db.getAllSongs();
    const audioFiles = await scanAllMusicFolders();

    const currentFileUris = new Set(audioFiles.map((f) => f.uri));
    const existingUris = new Set(existingSongs.map((s) => s.uri));

    const songsToRemove = existingSongs.filter(
      (song) => !currentFileUris.has(song.uri)
    );

    for (const song of songsToRemove) await db.deleteSong(song.id);

    const newFiles = audioFiles.filter((f) => !existingUris.has(f.uri));

    if (newFiles.length > 0) {
      for (let i = 0; i < newFiles.length; i += CONCURRENT_BATCH_SIZE) {
        const batch = newFiles.slice(i, i + CONCURRENT_BATCH_SIZE);
        await processBatch(
          batch,
          (current) => {
            if (onProgress) onProgress(i + current, newFiles.length);
          },
          i,
          newFiles.length
        );
      }
    }
  } catch (error) {
    throw error;
  }
};

const scannedThisSession = new Set<string>();
export const scanEnabledFoldersOnStartup = async (): Promise<void> => {
  try {
    const enabledFolders = await db.getEnabledMusicFolders();
    if (!enabledFolders || enabledFolders.length === 0) return;

    let existingSongs = await db.getAllSongs();
    const existingUris = new Set(existingSongs.map((s) => s.uri));

    for (const folder of enabledFolders) {
      if (scannedThisSession.has(folder.uri)) continue;

      try {
        const files = await scanDirectoryForAudio(folder.uri, true);

        if (!files || files.length === 0) {
          console.log(`[startup-scan] no files found in folder ${folder.uri}`);
          scannedThisSession.add(folder.uri);
          continue;
        }

        const newFiles = files.filter((f) => !existingUris.has(f.uri));
        if (newFiles.length > 0) {
          for (let i = 0; i < newFiles.length; i += CONCURRENT_BATCH_SIZE) {
            const batch = newFiles.slice(i, i + CONCURRENT_BATCH_SIZE);
            await processBatch(batch, undefined, i, newFiles.length);
          }
          for (const f of newFiles) existingUris.add(f.uri);
        }

        scannedThisSession.add(folder.uri);
      } catch {
        try {
          let folderPathPart = decodeURIComponent(folder.uri || "");
          folderPathPart = folderPathPart.split("/").pop() || folderPathPart;
          if (folderPathPart.includes(":"))
            folderPathPart = folderPathPart.split(":").pop() || folderPathPart;
          folderPathPart = folderPathPart.replace(/%2F/g, "/");
          folderPathPart = folderPathPart.replace(/%20/g, " ");

          const allSongs = await db.getAllSongs();
          const songsToRemove: string[] = [];
          for (const s of allSongs) {
            try {
              const decodedSongUri = decodeURIComponent(s.uri || "");
              if (folderPathPart && decodedSongUri.includes(folderPathPart)) {
                songsToRemove.push(s.id);
              }
            } catch {}
          }

          for (const id of songsToRemove) {
            try {
              await db.deleteSong(id);
            } catch {}
          }

          try {
            const fetchSongs = useSongStore.getState().fetchSongs;
            if (fetchSongs) await fetchSongs();
          } catch {}

          try {
            await removeFolder(folder.id);
          } catch {}

          scannedThisSession.add(folder.uri);
        } catch {
          scannedThisSession.add(folder.uri);
        }
      }
    }
  } catch {}
};
