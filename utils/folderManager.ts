import { Platform, Linking } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";
import * as db from "./database";

const { StorageAccessFramework } = FileSystem;

export interface FolderInfo {
  id: string;
  name: string;
  uri: string;
  path: string;
}

export interface AudioFile {
  id: string;
  filename: string;
  uri: string;
  parentFolder: string;
  name: string;
}

export const COMMON_MUSIC_FOLDERS = [
  { name: "Music", path: "Music" },
  { name: "Download", path: "Download" },
  { name: "Downloads", path: "Downloads" },
  { name: "Audio", path: "Audio" },
  { name: "Recordings", path: "Recordings" },
  { name: "Podcasts", path: "Podcasts" },
  { name: "Ringtones", path: "Ringtones" },
  { name: "Alarms", path: "Alarms" },
  { name: "Notifications", path: "Notifications" },
];

const AUDIO_EXTENSIONS = [
  ".mp3",
  ".m4a",
  ".aac",
  ".wav",
  ".flac",
  ".ogg",
  ".wma",
  ".opus",
  ".aiff",
  ".alac",
];

export const checkAllFilesAccess = async (): Promise<boolean> => {
  if (Platform.OS !== "android") return false;

  try {
    if (Platform.Version >= 30) {
      try {
        const info = await FileSystem.getInfoAsync(
          "file:///storage/emulated/0/"
        );
        if (info.exists) {
          const contents = await FileSystem.readDirectoryAsync(
            "file:///storage/emulated/0/"
          );
          return contents.length >= 0;
        }
        return false;
      } catch (error) {
        console.log("All files access check failed:", error);
        return false;
      }
    }
    return true;
  } catch (error) {
    console.warn("Error checking all files access:", error);
    return false;
  }
};

export const openAllFilesAccessSettings = async (): Promise<void> => {
  if (Platform.OS !== "android") return;

  try {
    if (Platform.Version >= 30) {
      await IntentLauncher.startActivityAsync(
        "android.settings.MANAGE_APP_ALL_FILES_ACCESS_PERMISSION",
        {
          data: "package:com.tanos.Inami",
        }
      );
    } else {
      await Linking.openSettings();
    }
  } catch {
    try {
      await Linking.openSettings();
    } catch {
      //
    }
  }
};

export const requestDirectoryAccess = async (
  initialPath?: string
): Promise<FolderInfo | null> => {
  if (Platform.OS !== "android") return null;

  try {
    let initialUri: string | undefined;

    if (initialPath) {
      try {
        initialUri =
          StorageAccessFramework.getUriForDirectoryInRoot(initialPath);
      } catch {
        //
      }
    }

    const permissions =
      await StorageAccessFramework.requestDirectoryPermissionsAsync(
        initialUri || null
      );

    if (!permissions.granted) return null;

    const directoryUri = permissions.directoryUri;

    const folderName = extractFolderNameFromUri(directoryUri);

    return {
      id: generateFolderId(directoryUri),
      name: folderName,
      uri: directoryUri,
      path: decodeURIComponent(directoryUri),
    };
  } catch (error) {
    console.error("Error requesting directory access:", error);
    throw error;
  }
};

const extractFolderNameFromUri = (uri: string): string => {
  try {
    //content://xxxxxxxxxx/tree/primary%3AMusic
    const decoded = decodeURIComponent(uri);

    const parts = decoded.split("/");
    const lastPart = parts[parts.length - 1];

    if (lastPart.includes(":")) {
      const pathPart = lastPart.split(":").pop();
      if (pathPart) {
        const folderParts = pathPart.split("/");
        return folderParts[folderParts.length - 1] || pathPart;
      }
    }

    return lastPart || "Unknown Folder";
  } catch {
    return "Unknown Folder";
  }
};

const generateFolderId = (uri: string): string => {
  let hash = 0;
  for (let i = 0; i < uri.length; i++) {
    const char = uri.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `folder_${Math.abs(hash).toString(36)}_${Date.now()
    .toString(36)
    .slice(-4)}`;
};

export const isAudioFile = (filename: string): boolean => {
  const lowerFilename = filename.toLowerCase();
  return AUDIO_EXTENSIONS.some((ext) => lowerFilename.endsWith(ext));
};

const hasFileExtension = (filename: string): boolean => {
  const lowerFilename = filename.toLowerCase();
  const knownExtensions = [
    ...AUDIO_EXTENSIONS,
    ".lrc",
    ".txt",
    ".srt",
    ".vtt",
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".bmp",
    ".pdf",
    ".doc",
    ".docx",
    ".mp4",
    ".mkv",
    ".avi",
    ".mov",
    ".zip",
    ".rar",
    ".7z",
    ".json",
    ".xml",
    ".csv",
    ".js",
    ".ts",
    ".py",
    ".html",
    ".css",
  ];
  return knownExtensions.some((ext) => lowerFilename.endsWith(ext));
};
export const scanDirectoryForAudio = async (
  directoryUri: string,
  recursive: boolean = true
): Promise<AudioFile[]> => {
  const audioFiles: AudioFile[] = [];

  try {
    const contents = await StorageAccessFramework.readDirectoryAsync(
      directoryUri
    );

    for (const itemUri of contents) {
      try {
        const filename = extractFilenameFromUri(itemUri);

        if (isAudioFile(filename)) {
          audioFiles.push({
            id: generateFileId(itemUri),
            filename,
            name: filename,
            uri: itemUri,
            parentFolder: directoryUri,
          });
        } else if (recursive && !hasFileExtension(filename)) {
          try {
            const subFiles = await scanDirectoryForAudio(itemUri, recursive);
            audioFiles.push(...subFiles);
          } catch {}
        }
      } catch {}
    }
  } catch (error) {
    console.error("scanDirectoryForAudio ", directoryUri, error);
    throw error;
  }

  return audioFiles;
};

const extractFilenameFromUri = (uri: string): string => {
  try {
    const decoded = decodeURIComponent(uri);
    const parts = decoded.split("/");
    const lastPart = parts[parts.length - 1];

    if (lastPart.includes(":")) {
      const pathPart = lastPart.split(":").pop();
      if (pathPart) {
        const segments = pathPart.split("/");
        return segments[segments.length - 1] || pathPart;
      }
    }

    return lastPart || "unknown";
  } catch {
    return "unknown";
  }
};

const generateFileId = (uri: string): string => {
  let hash = 0;
  for (let i = 0; i < uri.length; i++) {
    const char = uri.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `song_${Math.abs(hash).toString(36)}_${Date.now()
    .toString(36)
    .slice(-4)}`;
};

export const scanAllMusicFolders = async (
  onProgress?: (current: number, total: number, folderName: string) => void
): Promise<AudioFile[]> => {
  const enabledFolders = await db.getEnabledMusicFolders();
  const allAudioFiles: AudioFile[] = [];

  for (let i = 0; i < enabledFolders.length; i++) {
    const folder = enabledFolders[i];

    if (onProgress) {
      onProgress(i + 1, enabledFolders.length, folder.name);
    }

    try {
      const files = await scanDirectoryForAudio(folder.uri, true);
      allAudioFiles.push(...files);
    } catch (error) {
      console.warn(error);
    }
  }

  return allAudioFiles;
};

export const readFileAsArrayBuffer = async (
  uri: string
): Promise<ArrayBuffer> => {
  try {
    const content = await StorageAccessFramework.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const binaryString = atob(content);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  } catch (error) {
    console.error("Error reading file:", error);
    throw error;
  }
};

export const getFileInfo = async (
  uri: string
): Promise<{ exists: boolean; size?: number; isDirectory?: boolean }> => {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return info;
  } catch {
    return { exists: false };
  }
};

export const saveFolder = async (folder: FolderInfo): Promise<void> => {
  await db.addMusicFolder({
    id: folder.id,
    name: folder.name,
    uri: folder.uri,
  });
};

export const removeFolder = async (folderId: string): Promise<void> => {
  await db.removeMusicFolder(folderId);
};

export const toggleFolder = async (
  folderId: string,
  enabled: boolean
): Promise<void> => {
  await db.toggleMusicFolder(folderId, enabled);
};

export const getSavedFolders = async (): Promise<db.MusicFolder[]> => {
  return await db.getAllMusicFolders();
};

export const isFolderSaved = async (uri: string): Promise<boolean> => {
  const folder = await db.getMusicFolderByUri(uri);
  return folder !== null;
};
