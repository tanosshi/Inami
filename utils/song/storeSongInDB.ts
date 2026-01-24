import { getDatabaseSafe, upsertArtist } from "../database";

async function storeSongInDB(
  songTitle: string,
  artistName?: string | null,
  allGenres?: string[] | null,
  releaseDate?: string | null,
  album?: string | null,
  coverUrl?: string | null,
  palette?: string[] | null,
  songId?: string | null,
  lyricsPath: string | null = "none",
  originalTitle?: string | null,
  originalArtist?: string | null,
  trackSmallInfo?: string | null,
  trackBigInfo?: string | null,
  listeners?: number | null
) {
  console.log(`storeSongInDB: ${songTitle} - ${artistName}`);
  try {
    const db = await getDatabaseSafe();

    if (!songTitle) {
      console.warn("No song title provided, skipping DB store.");
      return;
    }

    if (songId) {
      const existingSong: any = await db.getFirstAsync(
        `SELECT id FROM songs WHERE id = ? LIMIT 1`,
        [songId]
      );
      if (existingSong && existingSong.id) {
        const updates: any[] = [];
        const params: any[] = [];
        if (songTitle && originalTitle && songTitle !== originalTitle) {
          updates.push("title = ?");
          params.push(
            songTitle
              .replace(" - single", "")
              .replace(" - ep", "")
              .replace(" - remaster", "")
              .replace(" - Topic", "")
              .replace(" - Single", "")
              .replace(" - SINGLE", "")
              .replace(" - Ep", "")
              .replace(" - EP", "")
              .replace(" - Remaster", "")
          );
        }
        if (artistName && originalArtist && artistName !== originalArtist) {
          updates.push("artist = ?");
          params.push(
            artistName
              .replace(" - single", "")
              .replace(" - ep", "")
              .replace(" - remaster", "")
              .replace(" - Topic", "")
              .replace(" - Single", "")
              .replace(" - SINGLE", "")
              .replace(" - Ep", "")
              .replace(" - EP", "")
              .replace(" - Remaster", "")
          );
        }
        if (album) {
          updates.push("album = ?");
          params.push(
            album
              .replace(" - single", "")
              .replace(" - ep", "")
              .replace(" - remaster", "")
              .replace(" - Topic", "")
              .replace(" - Single", "")
              .replace(" - SINGLE", "")
              .replace(" - Ep", "")
              .replace(" - EP", "")
              .replace(" - Remaster", "")
          );
        }
        if (coverUrl) {
          updates.push("artwork = ?");
          params.push(coverUrl);
        }
        if (allGenres && allGenres.length) {
          updates.push("genres = ?");
          params.push(JSON.stringify(allGenres));
        }
        if (releaseDate) {
          updates.push("release_date = ?");
          params.push(releaseDate);
        }
        if (palette && palette.length) {
          updates.push("palette = ?");
          params.push(JSON.stringify(palette));
        }
        if (lyricsPath) {
          updates.push("lyrics = ?");
          params.push(lyricsPath);
        }
        if (trackSmallInfo) {
          updates.push("track_small_info = ?");
          params.push(trackSmallInfo);
        }
        if (trackBigInfo) {
          updates.push("track_big_info = ?");
          params.push(trackBigInfo);
        }
        if (typeof listeners === "number") {
          updates.push("listeners = ?");
          params.push(listeners);
        }

        if (updates.length > 0) {
          params.push(existingSong.id);
          await db.runAsync(
            `UPDATE songs SET ${updates.join(", ")} WHERE id = ?`,
            params
          );
          console.log(
            `Updated song ${existingSong.id} with album/artwork by id`
          );
        }
      }
    }

    if (artistName) {
      await upsertArtist({
        name: artistName,
        image_url: coverUrl,
        genres: allGenres ? JSON.stringify(allGenres) : null,
        last_release_date: releaseDate,
      });
    }
  } catch (err) {
    console.warn(`Failed to store song ${songTitle}:`, err);
  }
}

export { storeSongInDB };
