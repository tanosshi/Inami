import { getLastfmAPIKey } from "@/secrets";

async function getArtistGenres(artist: string, fallback: string) {
  const lastfmAPIKey = await getLastfmAPIKey();
  async function getGenres(artist: string) {
    const res = await fetch(
      `https://ws.audioscrobbler.com/2.0/?method=artist.gettoptags&artist=${encodeURIComponent(
        artist
      )}&api_key=${lastfmAPIKey}&format=json`
    );

    const data = await res.json();

    if (!data.toptags?.tag?.length) return [];

    const tags = data.toptags.tag;
    const genres: string[] = [];
    for (let i = 0; i < tags.length && genres.length < 5; i++) {
      const name = (tags[i]?.name || "").trim();
      if (!name) continue;
      if (/test/i.test(name)) {
        continue;
      }
      genres.push(name);
    }

    return genres;
  }

  let genres = await getGenres(artist);

  if (!genres.length && fallback && fallback !== "Unknown Artist")
    genres = await getGenres(fallback);

  return genres;
}

export { getArtistGenres };
