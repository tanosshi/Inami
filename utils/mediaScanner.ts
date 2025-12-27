import { Platform } from "react-native";
import * as MediaLibrary from "expo-media-library";
import * as db from "./database";
import { extractMetadata } from "./metadataExtractor";

export interface AudioAsset {
  id: string;
  filename: string;
  uri: string;
  duration: number;
  albumId?: string;
}

export const requestPermissions = async (): Promise<boolean> => {
  if (Platform.OS === "web") return false;

  const { status } = await MediaLibrary.requestPermissionsAsync();
  return status === "granted";
};

export const scanDeviceMusic = async (
  onProgress?: (current: number, total: number) => void
): Promise<void> => {
  try {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      throw new Error("Media library permission not granted");
    }

    const audioAssets = await MediaLibrary.getAssetsAsync({
      mediaType: "audio",
      first: 1000,
      sortBy: [MediaLibrary.SortBy.creationTime],
    });

    let allAssets = audioAssets.assets;
    let hasNextPage = audioAssets.hasNextPage;
    let endCursor = audioAssets.endCursor;

    // Fetch all pages
    while (hasNextPage) {
      const nextPage = await MediaLibrary.getAssetsAsync({
        mediaType: "audio",
        first: 1000,
        after: endCursor,
        sortBy: [MediaLibrary.SortBy.creationTime],
      });
      allAssets = [...allAssets, ...nextPage.assets];
      hasNextPage = nextPage.hasNextPage;
      endCursor = nextPage.endCursor;
    }

    console.log(`Found ${allAssets.length} audio files`);

    // Process and add to database
    for (let i = 0; i < allAssets.length; i++) {
      const asset = allAssets[i];

      if (onProgress) {
        onProgress(i + 1, allAssets.length);
      }

      const existingSong = await db.getSongById(asset.id);
      if (existingSong) {
        continue;
      }

      const fileName = asset.filename
        .replace(/\[.*?\]/g, "")
        .replace(/\.(mp3|wav|m4a|flac|ogg)$/i, "")
        .trim();
      let metadata;

      try {
        metadata = await extractMetadata(asset.uri, fileName);
      } catch (error) {
        console.warn(
          `Failed to extract metadata for ${asset.filename}, using fallbacks. Error:`,
          error
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
          duration: asset.duration,
          artwork: undefined,
          palette: undefined,
        };
      }

      const song = {
        id: asset.id,
        title: metadata.title,
        artist: metadata.artist,
        album: metadata.album,
        duration: metadata.duration || asset.duration,
        uri: asset.uri,
        artwork: metadata.artwork || null,
        is_liked: false,
        palette: metadata.palette || null,
        play_count: 0,
      };

      await db.addSong(song);
    }

    console.log("Scan complete!");
  } catch (error) {
    console.error("Error scanning device music:", error);
    throw error;
  }
};

export const refreshLibrary = async (): Promise<void> => {
  await scanDeviceMusic();
};
