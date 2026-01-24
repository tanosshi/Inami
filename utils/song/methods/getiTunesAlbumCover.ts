import userAgents from "../../userAgents";
function getRandomUserAgent() {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}
const userAgent = getRandomUserAgent();

async function getiTunesAlbumCover(artist: string, album: string) {
  if (artist === "Various Artists" || artist === "Unknown Artist") artist = "";
  const res = await fetch(
    `https://itunes.apple.com/search?term=${encodeURIComponent(
      artist + " " + album
    )}&entity=album&limit=1`,
    {
      headers: {
        "User-Agent": userAgent,
      },
    }
  );
  const data = await res.json();
  if (!data.results?.length) return null;

  return {
    image: data.results[0].artworkUrl100.replace("100x100", "1000x1000"),
    res: data.results[0],
  };
}

export { getiTunesAlbumCover };
