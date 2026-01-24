import { getDatabase } from "./databaseCore";
import { downloadCommentImage } from "../artist/downloadCommentImage";
import * as FileSystem from "expo-file-system/legacy";

export interface ArtistComment {
  id?: number;
  artist_name: string;
  userName: string;
  text: string;
  profile?: string;
  created_at?: string;
}

export const storeArtistComments = async (
  artistName: string,
  comments: { userName: string; text: string; profile?: string }[]
): Promise<void> => {
  const database = getDatabase();

  await database.runAsync("DELETE FROM artist_comments WHERE artist_name = ?", [
    artistName,
  ]);

  for (const comment of comments) {
    if (
      comment.text.length === 0 ||
      comment.userName.length === 0 ||
      comment.text.includes("http")
    )
      continue;

    let profilePath: string | null = null;
    if (comment.profile) {
      try {
        profilePath = await downloadCommentImage(comment.profile);
      } catch (err) {
        console.warn(`Failed to download comment profile image:`, err);
        profilePath = null;
      }
    }

    await database.runAsync(
      `INSERT INTO artist_comments (artist_name, userName, text, profile) VALUES (?, ?, ?, ?)`,
      [artistName, comment.userName, comment.text, profilePath]
    );
  }

  console.log(
    `[Database] Stored ${comments.length} comments for artist: ${artistName}`
  );
};

export const getArtistComments = async (
  artistName: string
): Promise<ArtistComment[]> => {
  const database = getDatabase();
  const comments = await database.getAllAsync<ArtistComment>(
    "SELECT * FROM artist_comments WHERE artist_name = ? ORDER BY created_at DESC",
    [artistName]
  );

  return comments.map((comment) => ({
    ...comment,
    profile:
      comment.profile &&
      !comment.profile.startsWith("http") &&
      !comment.profile.startsWith("file://")
        ? (FileSystem as any).documentDirectory + comment.profile
        : comment.profile,
  }));
};

export const getAllArtistComments = async (): Promise<ArtistComment[]> => {
  const database = getDatabase();
  const comments = await database.getAllAsync<ArtistComment>(
    "SELECT * FROM artist_comments ORDER BY artist_name, created_at DESC"
  );

  return comments.map((comment) => ({
    ...comment,
    profile:
      comment.profile &&
      !comment.profile.startsWith("http") &&
      !comment.profile.startsWith("file://")
        ? (FileSystem as any).documentDirectory + comment.profile
        : comment.profile,
  }));
};

export const deleteArtistComments = async (
  artistName: string
): Promise<void> => {
  const database = getDatabase();
  await database.runAsync("DELETE FROM artist_comments WHERE artist_name = ?", [
    artistName,
  ]);

  console.log(`[Database] Deleted comments for artist: ${artistName}`);
};
