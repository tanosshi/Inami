import * as FileSystem from "expo-file-system/legacy";

const AUDIO_EXTENSIONS = [
  ".mp3",
  ".m4a",
  ".wav",
  ".flac",
  ".ogg",
  ".aac",
  ".wma",
  ".opus",
];

const IGNORED_EXTENSIONS = [
  ".lrc",
  ".txt",
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".zip",
  ".pdf",
  ".nfo",
  ".cue",
  ".log",
  ".m3u",
  ".m3u8",
  ".pls",
];

export const isAudioFile = (filename: string): boolean => {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf("."));
  return AUDIO_EXTENSIONS.includes(ext);
};

export const isIgnoredFile = (filename: string): boolean => {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf("."));
  return IGNORED_EXTENSIONS.includes(ext);
};

export const sanitizeFileName = (filename: string): string => {
  return filename.replace(/[%\[\]]/g, "_").replace(/\s+/g, "_");
};

export const scanDirectoryForAudio = async (
  directoryUri: string
): Promise<string[]> => {
  const audioFiles: string[] = [];

  try {
    const files = await FileSystem.StorageAccessFramework.readDirectoryAsync(
      directoryUri
    );

    for (const fileUri of files) {
      const decodedUri = decodeURIComponent(fileUri);
      const fileName = decodedUri.substring(decodedUri.lastIndexOf("/") + 1);

      if (isAudioFile(fileName)) {
        audioFiles.push(fileUri);
      } else if (!isIgnoredFile(fileName)) {
        // we'll handle it easier when i have time
        try {
          const subFiles = await scanDirectoryForAudio(fileUri);
          audioFiles.push(...subFiles);
        } catch {}
      }
    }
  } catch (error) {
    const errorMsg = String(error);
    if (!errorMsg.includes("exist")) {
      console.log("Error scanning directory:", error);
    }
  }

  return audioFiles;
};
