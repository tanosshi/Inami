import { File, Paths, Directory } from "expo-file-system";
import * as FileSystem from "expo-file-system/legacy";
import { parseBuffer } from "music-metadata-browser";
import ImageColors from "react-native-image-colors";

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
  const artworkDir = new Directory(Paths.cache, "artwork");

  if (!artworkDir.exists) artworkDir.create();

  const safeName = songName.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 50);
  const extension = getExtensionFromMimeType(mimeType);
  const artworkFile = new File(artworkDir, `${safeName}${extension}`);

  artworkFile.write(data);

  return artworkFile.uri;
}

const isSafUri = (uri: string): boolean => {
  return uri.startsWith("content://");
};

const MAX_FILE_SIZE_FOR_METADATA = 50 * 1024 * 1024;

async function getFileSizeForSafUri(uri: string): Promise<number | null> {
  try {
    const info = await FileSystem.getInfoAsync(uri, { size: true });
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
    const isInCache = uri.includes("/cache/") || uri.includes("/Cache/");
    let fileToRead: File;

    if (isInCache && sourceFile.exists) fileToRead = sourceFile;
    else {
      const cachedFile = new File(Paths.cache, sourceFile.name);
      sourceFile.copy(cachedFile);
      fileToRead = cachedFile;
    }

    const arrayBuffer = await fileToRead.arrayBuffer();
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
    const metadata = await parseBuffer(buffer, mimeType);

    const songName =
      safeString(metadata.common.title) ||
      safeString(fallbackTitle) ||
      extractFilenameFromUri(uri);

    let artworkUri: string | undefined;
    if (metadata.common.picture?.[0]) {
      const picture = metadata.common.picture[0];
      artworkUri = await saveArtwork(
        new Uint8Array(picture.data),
        picture.format,
        songName
      );
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
  } catch (err) {
    console.warn("Failed to extract metadata", err);
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

const safeString = (value: any): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return value.toString();
  if (typeof value === "boolean") return value.toString();
  try {
    return String(value);
  } catch {
    return value.toString().replace(/[^a-zA-Z]/g, "");
  }
};
