import { getDatabase } from "./databaseCore";

export interface SongComment {
  id?: number;
  song_id: string;
  artist_name: string;
  user: string;
  text: string;
  profile?: string;
  created_at?: string;
}

export const storeSongComments = async (
  songId: string,
  artistName: string,
  comments: Array<{ user: string; text: string; profile?: string }>
): Promise<void> => {
  const database = getDatabase();

  await database.runAsync("DELETE FROM song_comments WHERE song_id = ?", [
    songId,
  ]);

  for (const comment of comments) {
    if (
      comment.text.length === 0 ||
      comment.user.length === 0 ||
      comment.text.includes("http")
    )
      continue;

    await database.runAsync(
      `INSERT INTO song_comments (song_id, artist_name, user, text, profile) VALUES (?, ?, ?, ?, ?)`,
      [songId, artistName, comment.user, comment.text, comment.profile || null]
    );
  }

  console.log(
    `[Database] Stored ${comments.length} comments for song: ${songId}`
  );
};

export const getSongComments = async (songId: string): Promise<SongComment[]> => {
  const database = getDatabase();
  const comments = await database.getAllAsync<SongComment>(
    "SELECT * FROM song_comments WHERE song_id = ? ORDER BY created_at DESC",
    [songId]
  );

  return comments;
};

export const getAllSongComments = async (): Promise<SongComment[]> => {
  const database = getDatabase();
  const comments = await database.getAllAsync<SongComment>(
    "SELECT * FROM song_comments ORDER BY song_id, created_at DESC"
  );

  return comments;
};

export const deleteSongComments = async (songId: string): Promise<void> => {
  const database = getDatabase();
  await database.runAsync("DELETE FROM song_comments WHERE song_id = ?", [
    songId,
  ]);

  console.log(`[Database] Deleted comments for song: ${songId}`);
};