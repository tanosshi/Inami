import userAgents from "../../userAgents";

function getRandomUserAgent() {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

const userAgent = getRandomUserAgent();

async function getAlbumFromTrack(artist: string, track: string) {
  const res = await fetch(
    `https://itunes.apple.com/search?term=${encodeURIComponent(
      artist + " " + track
    )}&entity=song&limit=1`,
    {
      headers: {
        "User-Agent": userAgent,
      },
    }
  );
  const data = await res?.json();
  if (!data.results?.length) return null;

  if (!data.results[0].collectionName) {
    const mb_res = await fetch(
      `http://musicbrainz.org/ws/2/recording?query=artist:${encodeURIComponent(
        artist
      )}%20AND%20recording:${encodeURIComponent(track)}&fmt=json`,
      {
        headers: {
          "User-Agent": userAgent,
        },
      }
    );
    if (!mb_res.ok) return null;
    const mb_data = await mb_res.json();

    if (!mb_data.recordings?.length) return null;
    return {
      colName: mb_data.recordings[0].releases[0].title,
      res: null,
    };
  } else {
    return {
      colName: data.results[0].collectionName,
      res: data.results[0],
    };
  }
}

export { getAlbumFromTrack };
