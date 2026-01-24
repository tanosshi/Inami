import { Buffer } from "buffer";
import { File, Paths, Directory } from "expo-file-system";
import * as FileSystem from "expo-file-system/legacy";
import { parseBuffer } from "music-metadata-browser";
import ImageColors from "react-native-image-colors";
import { safeString } from "./safeString";

export interface AudioMetadata {
  title: string;
  artist: string;
  album: string;
  duration: number;
  artwork?: string;
  palette?: string[];
}

function getExtensionFromMimeType(mimeType: string): string {
  const extensions: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/bmp": ".bmp",
  };
  return extensions[mimeType] || ".jpg";
}

async function saveArtwork(
  data: Uint8Array,
  mimeType: string,
  songName: string
): Promise<string> {
  const artworkDir = new Directory(Paths.document, "images/artwork");

  try {
    if (!artworkDir.exists) {
      try {
        artworkDir.create();
      } catch {}
    }
  } catch {}

  const safeName = songName.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 50);
  const extension = getExtensionFromMimeType(mimeType);
  const filename = `${safeName}${extension}`;
  const relativePath = `images/artwork/${filename}`;

  try {
    const artworkFile = new File(artworkDir, filename);
    artworkFile.write(data);
    return relativePath;
  } catch (error) {
    console.warn(
      "Failed to save artwork to document directory, retrying with legacy API:",
      error
    );
    try {
      const dir = (FileSystem as any).documentDirectory + "images/albumImages/";
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

      const fallbackFilename = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 9)}${extension}`;
      const fallbackRelativePath = `images/albumImages/${fallbackFilename}`;
      const fileUri =
        (FileSystem as any).documentDirectory + fallbackRelativePath;

      const base64 = Buffer.from(data).toString("base64");
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: "base64",
      } as any);

      return fallbackRelativePath;
    } catch (fallbackError) {
      console.warn("Failed to save artwork:", fallbackError);
      throw fallbackError;
    }
  }
}

const isSafUri = (uri: string): boolean => {
  return uri.startsWith("content://");
};

const MAX_FILE_SIZE_FOR_METADATA = 150 * 1024 * 1024;
const COPY_TO_CACHE_THRESHOLD = 20 * 1024 * 1024;

async function getFileSizeForSafUri(uri: string): Promise<number | null> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists && "size" in info) return info.size;
    return null;
  } catch {
    return null;
  }
}

async function readFileAsBuffer(uri: string): Promise<Uint8Array> {
  if (isSafUri(uri)) {
    const fileSize = await getFileSizeForSafUri(uri);

    if (fileSize && fileSize > MAX_FILE_SIZE_FOR_METADATA) {
      throw new Error(
        `File too large for metadata extraction: ${Math.round(
          fileSize / 1024 / 1024
        )}MB`
      );
    }

    if (fileSize && fileSize > COPY_TO_CACHE_THRESHOLD) {
      try {
        const filename = extractFilenameFromUri(uri).replace(
          /[^a-zA-Z0-9._-]/g,
          "_"
        );
        const cachePath =
          FileSystem.cacheDirectory + `${Date.now()}_${filename}`;

        await FileSystem.StorageAccessFramework.copyAsync({
          from: uri,
          to: cachePath,
        });

        const cachedFile = new File(cachePath);
        const arrayBuffer = await cachedFile.arrayBuffer();

        try {
          await FileSystem.deleteAsync(cachePath);
        } catch {}

        return new Uint8Array(arrayBuffer);
      } catch {}
    }

    const content = await FileSystem.StorageAccessFramework.readAsStringAsync(
      uri,
      { encoding: FileSystem.EncodingType.Base64 }
    );

    const binaryString = atob(content);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++)
      bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  } else {
    const sourceFile = new File(uri);
    const cacheDir = FileSystem.cacheDirectory ?? "";
    const isInCache =
      (cacheDir !== "" && uri.startsWith(cacheDir)) ||
      uri.includes("/cache/") ||
      uri.includes("/Cache/");
    let fileToRead: File;
    let createdTempCache = false;
    let tempCachePath: string | undefined;

    if (isInCache && sourceFile.exists) {
      fileToRead = sourceFile;
    } else {
      const safeName =
        sourceFile.name ||
        extractFilenameFromUri(uri).replace(/[^a-zA-Z0-9._-]/g, "_");
      tempCachePath = FileSystem.cacheDirectory + safeName;
      const cachedFile = new File(tempCachePath);
      try {
        const maybePromise: any = sourceFile.copy(cachedFile);
        if (maybePromise && typeof maybePromise.then === "function") {
          await maybePromise;
        }
      } catch {}
      fileToRead = cachedFile;
      createdTempCache = true;
    }

    const arrayBuffer = await fileToRead.arrayBuffer();

    if (createdTempCache && tempCachePath) {
      try {
        await FileSystem.deleteAsync(tempCachePath);
      } catch (delErr) {
        console.warn(
          "Failed to delete temporary cached file:",
          tempCachePath,
          delErr
        );
      }
    }

    return new Uint8Array(arrayBuffer);
  }
}

export const extractMetadata = async (
  uri: string,
  fallbackTitle?: string
): Promise<AudioMetadata> => {
  const defaultMetadata: AudioMetadata = {
    title: fallbackTitle || "Unknown Title",
    artist: "Unknown Artist",
    album: "Unknown Album",
    duration: 0,
    artwork: undefined,
  };

  try {
    const buffer = await readFileAsBuffer(uri);
    const mimeType = getMimeType(uri);

    const parseInput: any =
      buffer instanceof Uint8Array ? Buffer.from(buffer) : buffer;
    const metadata = await parseBuffer(parseInput, mimeType);

    const songName =
      safeString(metadata.common.title) ||
      safeString(fallbackTitle) ||
      extractFilenameFromUri(uri);

    let artworkUri: string | undefined;
    let pictureData: Uint8Array | undefined;
    let pictureFormat: string | undefined;
    if (metadata.common.picture?.[0]) {
      const picture = metadata.common.picture[0];
      pictureData = new Uint8Array(picture.data);
      pictureFormat = picture.format;
      const relativePath = await saveArtwork(
        pictureData,
        pictureFormat,
        songName
      );
      artworkUri = FileSystem.documentDirectory + relativePath;
    }

    let palette: string[] = [];
    if (artworkUri) {
      try {
        const colors = await ImageColors.getColors(artworkUri, {
          fallback: "#000000",
        });

        console.log("Extracted colors:", colors);
        colors.platform = "android"; // just force it lol

        if (colors.platform === "android") {
          palette = [
            colors.dominant,
            colors.average,
            colors.vibrant,
            colors.darkVibrant,
            colors.lightVibrant,
            colors.darkMuted,
            colors.lightMuted,
          ].filter(Boolean);
          console.log("Final palette array:", palette);
        }
      } catch (e) {
        console.log("ImageColors error:", e);
        if (pictureData && pictureFormat) {
          try {
            const base64 = Buffer.from(pictureData).toString("base64");
            const dataUrl = `data:${pictureFormat};base64,${base64}`;
            const colors = await ImageColors.getColors(dataUrl, {
              fallback: "#000000",
            });
            console.log("Extracted colors from data URL:", colors);
            colors.platform = "android";
            if (colors.platform === "android") {
              palette = [
                colors.dominant,
                colors.average,
                colors.vibrant,
                colors.darkVibrant,
                colors.lightVibrant,
                colors.darkMuted,
                colors.lightMuted,
              ].filter(Boolean);
              console.log("Final palette array from data URL:", palette);
            }
          } catch (fallbackError) {
            console.log("Fallback ImageColors error:", fallbackError);
          }
        }
      }
    }

    const result = {
      title:
        safeString(metadata.common.title) ||
        safeString(fallbackTitle) ||
        "Unknown Title",
      artist: safeString(metadata.common.artist) || "Unknown Artist",
      album: safeString(metadata.common.album) || "Unknown Album",
      duration: metadata.format.duration || 0,
      artwork: artworkUri,
      palette,
    };

    return result;
  } catch {
    return defaultMetadata;
  }
};

function extractFilenameFromUri(uri: string): string {
  try {
    const decoded = decodeURIComponent(uri);

    if (isSafUri(uri)) {
      const parts = decoded.split("/");
      const lastPart = parts[parts.length - 1];

      if (lastPart.includes(":")) {
        const pathPart = lastPart.split(":").pop();
        if (pathPart) {
          const segments = pathPart.split("/");
          return segments[segments.length - 1] || pathPart;
        }
      }
      return lastPart;
    } else {
      const parts = decoded.split("/");
      return parts[parts.length - 1] || "unknown";
    }
  } catch {
    return "unknown";
  }
}

function getMimeType(uri: string): string {
  const extension = uri.split(".").pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    mp3: "audio/mpeg",
    m4a: "audio/mp4",
    aac: "audio/aac",
    wav: "audio/wav",
    flac: "audio/flac",
    ogg: "audio/ogg",
    wma: "audio/x-ms-wma",
    opus: "audio/opus",
  };
  return mimeTypes[extension || ""] || "audio/mpeg";
}
