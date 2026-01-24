// netease caution: random chinese symbols, lyrics start with random introduction
// lrclib caution: random \n sometimes,

import userAgents from "../../userAgents";

function getRandomUserAgent() {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

const userAgent = getRandomUserAgent();

type LyricsResult = {
  trackName: string | null;
  artistName: string | null;
  albumName: string | null;
  syncedLyrics: string | null;
  plainLyrics: string | null;
};

type Lyrics = {
  lyrics: string | null;
};

async function getLrcLib(
  artist: string,
  track: string
): Promise<LyricsResult | null> {
  const res = await fetch(
    `https://lrclib.net/api/get?artist_name=${encodeURIComponent(
      artist
    )}&track_name=${encodeURIComponent(track)}`,
    {
      headers: {
        "User-Agent": userAgent,
      },
    }
  );

  if (!res.ok) return null;

  const data = await res.json().catch(() => null);
  if (!data) return null;

  if (data?.statusCode === 404) return null;
  if (data?.instrumental === true)
    return {
      trackName: data.trackName,
      artistName: data.artistName,
      albumName: data.albumName,
      syncedLyrics: "INSTRUMENTAL",
      plainLyrics: "INSTRUMENTAL",
    };

  const synced =
    typeof data.syncedLyrics === "string"
      ? data.syncedLyrics.replace(/\r\n/g, "\n").trim()
      : null;

  const plain =
    typeof data.plainLyrics === "string"
      ? data.plainLyrics.replace(/\r\n/g, "\n").trim()
      : null;

  if (!synced && !plain) return null;

  return {
    trackName: data.trackName,
    artistName: data.artistName,
    albumName: data.albumName,
    syncedLyrics: synced,
    plainLyrics: plain,
  };
}

async function getNeteaseCloudMusicLyrics(
  artist: string,
  track: string
): Promise<LyricsResult | null> {
  try {
    const query = `${artist} ${track}`;

    const searchUrl = `https://music.163.com/api/search/get?s=${encodeURIComponent(
      query
    )}&type=1&limit=1&offset=0`;

    const searchRes = await fetch(searchUrl, {
      headers: {
        Referer: "https://music.163.com/",
        "User-Agent": userAgent,
      },
    });

    const searchData = await searchRes.json().catch(() => null);
    if (!searchData) return null;

    const song = searchData.result?.songs?.[0];
    if (!song || !song.id) return null;
    const neteaseID = song.id;

    const raw = await fetch(
      `https://music.163.com/api/song/lyric?id=${encodeURIComponent(
        neteaseID
      )}&lv=1&tv=1`,
      {
        headers: {
          Referer: "https://music.163.com/",
          "User-Agent": userAgent,
        },
      }
    );

    const response = await raw.json().catch(() => null);
    if (!response) return null;

    const lyricData = response.data ?? response;
    const lyric = lyricData.lrc?.lyric ?? null;

    const hasTimestamp =
      lyric.includes("[00:") ||
      lyric.includes("[01:") ||
      lyric.includes("[02:") ||
      lyric.includes("[03:") ||
      lyric.includes("[04:");

    if (lyric)
      return {
        syncedLyrics: hasTimestamp ? lyric : null,
        plainLyrics: hasTimestamp ? null : lyric,
        trackName: "From NetEase",
        artistName: null,
        albumName: null,
      };
    return null;
  } catch (error) {
    console.error("Error fetching NetEase lyrics:", error);
    return null;
  }
}

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";
const REFERER = "https://y.qq.com/portal/player.html";

async function getQQMusicLyrics(
  artist: string,
  track: string
): Promise<LyricsResult | null> {
  try {
    const query = `${artist} ${track}`;

    // 1. Search for song to grab songmid
    const paramst = new URLSearchParams({
      w: query,
      format: "json",
      p: "1",
      n: "1",
      aggr: "1",
      lossless: "1",
      cr: "1",
      new_json: "1",
    });

    const searchUrl = `https://c.y.qq.com/soso/fcgi-bin/client_search_cp?${paramst.toString()}`;

    const rawSearchRes = await fetch(searchUrl, {
      headers: {
        Referer: REFERER,
        "User-Agent": USER_AGENT,
      },
    });

    if (!rawSearchRes.ok) return null;

    const searchJson = await rawSearchRes.json().catch(() => null);
    if (!searchJson) return null;
    const searchRes = { data: searchJson };

    const song = searchRes.data?.data?.song?.list?.[0];
    if (!song || !song.mid) return null;

    const songMid = song.mid;

    // 2 Fetch lyrics with songmid
    const params = new URLSearchParams({
      songmid: String(songMid),
      pcachetime: String(Date.now()),
      platform: "yqq",
      hostUin: "0",
      needNewCode: "0",
      ct: "20",
      cv: "1878",
    });

    const lyricUrl = `https://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg?${params.toString()}`;

    const resp = await fetch(lyricUrl, {
      headers: {
        Referer: REFERER,
        "User-Agent": USER_AGENT,
      },
    });

    if (!resp.ok) return null;

    const text = await resp.text().catch(() => null);
    const lyricRes = { data: text };
    let data: any = lyricRes.data;

    if (typeof data === "string") {
      const match = data.match(/callback\((.*)\)/);
      if (match) {
        try {
          data = JSON.parse(match[0]);
        } catch {
          data = JSON.parse(match[1]);
        }
      }
    }

    if (!data || typeof data !== "object" || !data.lyric) return null;

    // 3 Decode Base64 (why is it even decrypted lol)
    const lyric = Buffer.from(data.lyric, "base64").toString("utf-8");
    const hasTimestamp = /\[\d{2}:\d{2}/.test(lyric);

    return {
      syncedLyrics: hasTimestamp ? lyric : null,
      plainLyrics: hasTimestamp ? null : lyric,
      trackName: song.name || song.title || null,
      artistName: song.singer?.[0]?.name || null,
      albumName: song.album?.name || null,
    };
  } catch (error) {
    console.error("Error fetching QQ Music lyrics:", error);
    return null;
  }
}

async function getLyrics(
  artist: string,
  track: string
): Promise<Lyrics | null> {
  async function grabLyrics(
    artist: string,
    track: string
  ): Promise<Lyrics | null> {
    let lrcLibResult = await getLrcLib(artist, track);

    if (lrcLibResult || lrcLibResult !== null) {
      if (
        lrcLibResult.syncedLyrics === "INSTRUMENTAL" ||
        lrcLibResult.plainLyrics === "INSTRUMENTAL"
      )
        return { lyrics: "instrumental" };

      if (lrcLibResult.syncedLyrics || lrcLibResult.plainLyrics)
        return {
          lyrics: lrcLibResult.syncedLyrics || lrcLibResult.plainLyrics,
        };
    }

    let neteaseResult = await getNeteaseCloudMusicLyrics(artist, track);
    if (
      (neteaseResult || neteaseResult !== null) &&
      (neteaseResult.plainLyrics || neteaseResult.syncedLyrics)
    ) {
      return {
        lyrics: neteaseResult.syncedLyrics || neteaseResult.plainLyrics,
      };
    }

    let qqResult = await getQQMusicLyrics(artist, track);
    if (
      (qqResult || qqResult !== null) &&
      (qqResult.plainLyrics || qqResult.syncedLyrics)
    ) {
      return {
        lyrics: qqResult.syncedLyrics || qqResult.plainLyrics,
      };
    }
    return null;
  }

  let x = await grabLyrics(artist, track)
    .then((res) => {
      const resLyr = res?.lyrics || null;
      return resLyr;
    })
    .catch(() => {
      return null;
    });

  if (x) return { lyrics: x };
  else return null;
}

export { getLyrics };
