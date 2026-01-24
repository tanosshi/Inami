import { getDatabase } from "./databaseCore";

export const getAllPlaylists = async () => {
  const database = getDatabase();
  return await database.getAllAsync(
    "SELECT * FROM playlists ORDER BY created_at DESC"
  );
};

export const getPlaylistById = async (id: string) => {
  const database = getDatabase();
  return await database.getFirstAsync("SELECT * FROM playlists WHERE id = ?", [
    id,
  ]);
};

export const addPlaylist = async (playlist: any) => {
  const database = getDatabase();
  await database.runAsync(
    `INSERT INTO playlists (id, name, description, artwork, song_count) 
     VALUES (?, ?, ?, ?, ?)`,
    [
      playlist.id,
      playlist.name,
      playlist.description || "",
      playlist.artwork || null,
      playlist.song_count || 0,
    ]
  );
};

export const updatePlaylist = async (
  id: string,
  updates: Record<string, string | number | null>
) => {
  const database = getDatabase();
  const fields = Object.keys(updates)
    .map((key) => `${key} = ?`)
    .join(", ");
  const values = [...Object.values(updates), id] as (string | number | null)[];
  await database.runAsync(
    `UPDATE playlists SET ${fields} WHERE id = ?`,
    values
  );
};

export const deletePlaylist = async (id: string) => {
  const database = getDatabase();
  await database.runAsync("DELETE FROM playlists WHERE id = ?", [id]);
};

export const getPlaylistSongs = async (playlistId: string) => {
  const database = getDatabase();
  return await database.getAllAsync(
    `SELECT s.* FROM songs s
     JOIN playlist_songs ps ON s.id = ps.song_id
     WHERE ps.playlist_id = ?
     ORDER BY ps.position`,
    [playlistId]
  );
};

export const addSongToPlaylist = async (
  playlistId: string,
  songId: string,
  position?: number
) => {
  const database = getDatabase();

  // Get max position if not provided
  let finalPosition: number;
  if (position === undefined) {
    const result: any = await database.getFirstAsync(
      "SELECT MAX(position) as max_pos FROM playlist_songs WHERE playlist_id = ?",
      [playlistId]
    );
    finalPosition = (result?.max_pos ?? -1) + 1;
  } else {
    finalPosition = position;
  }

  await database.runAsync(
    "INSERT INTO playlist_songs (playlist_id, song_id, position) VALUES (?, ?, ?)",
    [playlistId, songId, finalPosition]
  );

  // Update song count
  await database.runAsync(
    "UPDATE playlists SET song_count = song_count + 1 WHERE id = ?",
    [playlistId]
  );
};

export const removeSongFromPlaylist = async (
  playlistId: string,
  songId: string
) => {
  const database = getDatabase();
  await database.runAsync(
    "DELETE FROM playlist_songs WHERE playlist_id = ? AND song_id = ?",
    [playlistId, songId]
  );

  // Update song count
  await database.runAsync(
    "UPDATE playlists SET song_count = song_count - 1 WHERE id = ?",
    [playlistId]
  );
};
