import userAgents from "../../userAgents";
function getRandomUserAgent() {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}
const userAgent = getRandomUserAgent();

async function getBandCampAlbumCover(artist: string, album: string) {
  async function tryFetch(alb: string) {
    const slug = alb.replaceAll(" ", "-").toLowerCase();
    const res = await fetch(`https://${artist}.bandcamp.com/album/${slug}`, {
      headers: {
        "User-Agent": userAgent,
        Accept: "text/html",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    console.log({
      url: res.url,
      status: res.status,
      redirected: res.redirected,
    });
    if (text.includes("bio-pic placeholder")) return null;
    const match = text.match(/<meta property="og:image" content="([^"]+)"/);
    if (match && match[1]) return match[1];
    return null;
  }

  try {
    return await tryFetch(album);
  } catch {
    try {
      const cleaned = album.split("-")[0].trim();
      if (!cleaned || cleaned === album) return null;
      return await tryFetch(cleaned);
    } catch (err2) {
      console.warn(
        `getBandCampAlbumCover failed for ${artist} - ${album}:`,
        err2
      );
      return null;
    }
  }
}

export { getBandCampAlbumCover };
