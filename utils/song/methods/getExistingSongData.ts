import { getDatabaseSafe } from "../../database";

async function getExistingSongData(songId: string) {
  try {
    const db = await getDatabaseSafe();
    const song = await db.getFirstAsync(
      "SELECT album, artwork, genres, release_date, uri, palette, lyrics FROM songs WHERE id = ? LIMIT 1",
      [songId]
    );
    return song as {
      album: string | null;
      artwork: string | null;
      genres: string | null;
      release_date: string | null;
      lyrics?: string | null;
      uri?: string | null;
      palette?: string | null;
    } | null;
  } catch (error) {
    console.warn("Error fetching existing song data:", error);
    return null;
  }
}

export { getExistingSongData };
