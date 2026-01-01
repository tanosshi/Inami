import { File, Paths, Directory } from "expo-file-system";
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
    const sourceFile = new File(uri);

    const isInCache = uri.includes("/cache/") || uri.includes("/Cache/");
    let fileToRead: File;

    if (isInCache && sourceFile.exists) {
      fileToRead = sourceFile;
    } else {
      const cachedFile = new File(Paths.cache, sourceFile.name);
      sourceFile.copy(cachedFile);
      fileToRead = cachedFile;
    }

    const arrayBuffer = await fileToRead.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    const metadata = await parseBuffer(buffer, getMimeType(fileToRead.uri));

    let artworkUri: string | undefined;
    if (metadata.common.picture?.[0]) {
      const picture = metadata.common.picture[0];
      const songName =
        safeString(metadata.common.title) ||
        safeString(fallbackTitle) ||
        safeString(sourceFile.name);
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
