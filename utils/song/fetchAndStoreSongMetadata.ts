import { getExistingSongData } from "./methods/getExistingSongData";
import { getAlbumFromTrack } from "./methods/getAlbumFromTrack";
import { getiTunesAlbumCover } from "./methods/getiTunesAlbumCover";
import { getBandCampAlbumCover } from "./methods/getBandCampAlbumCover";
import { getArtistGenres } from "./methods/getArtistGenres";
import { downloadImage } from "./downloadImage";
import { storeSongInDB } from "./storeSongInDB";
import { hasFaultyUnicode } from "./hasFaultyUnicode";
import { extractMetadata } from "../metadataExtractor";
import { getLyrics } from "./methods/getLyrics";
import { customFetch } from "./customFetch";
import { similarity } from "./similarity";
import { getSongComments } from "./methods/getSongComments";
import * as FileSystem from "expo-file-system/legacy";
import * as yt from "@/utils/youtubescraper/index";
import { getLastfmAPIKey } from "@/secrets";
import { storeSongComments, upsertArtist } from "../database";

let isLyricsDirChecked = false;

// in the end push limits to all api calls to fill all gaps to keep it perfect. ; also make it use google at the end if alot of main data misses

async function fetchAndStoreSongMetadata(
  songTitle: string,
  artistName?: string,
  songId?: string,
  songUri?: string
) {
  const [lastfmAPIKey, existingData] = await Promise.all([
    getLastfmAPIKey(),
    songId ? getExistingSongData(songId) : Promise.resolve(null),
  ]);

  const originalTitle = songTitle;
  const originalArtist = artistName || null;

  if (!songId) return;

  if (artistName === "Unknown Artist" || artistName === "Various Artists") {
    const cFetch = await customFetch(songTitle, artistName || ""); // were gonna use this again later when theres unsurity

    if (cFetch && typeof cFetch === "object") {
      artistName = cFetch.artistName ?? artistName;
      songTitle = cFetch.trackName ?? songTitle;
    }
    if (
      !artistName ||
      artistName === "Unknown Artist" ||
      artistName === "Various Artists"
    ) {
      const separators = / - |-| – | — | by |--|––|——/;
      if (!separators.test(songTitle)) {
        // Use youtube-search to scrape. we wont give up!!!!!!!!!!!!!!!!!

        const videos = await yt.search(songTitle, { limit: 2 });
        let videoTitle = videos[0].title;
        let definiteArtistName = videos[0].channel.name.replace(" - Topic", "");
        if (similarity(videoTitle, songTitle) > 0.6) {
          artistName = definiteArtistName;
        } else {
          artistName = definiteArtistName;
          // logic for later
          // if (similarity(videoTitle, songTitle) > 0.6) {
          // } else {
          //   // pinyin  const isChinese = /[\u4E00-\u9FFF]/.test(videoTitle);
          //   // hangul-js  const isKorean = /[\uAC00-\uD7AF]/.test(videoTitle);

          //   const isJap = /[\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF]/.test(
          //     videoTitle
          //   );

          //   const normalizedVideoTitle = isJap
          //     ? toRomaji(videoTitle)
          //     : videoTitle;

          //   if (similarity(normalizedVideoTitle, songTitle) > 0.7)
          //     artistName = definiteArtistName;
        }
      } else {
        const parts = songTitle.split(/\s[-–—]{1,2}\s/).map((p) => p.trim());
        if (parts.length >= 2) {
          const [p0, p1] = parts;

          const nonAscii = (s: string) => /[^\u0000-\u007f]/.test(s);
          if (nonAscii(p0) && !nonAscii(p1)) {
            artistName = p0;
            songTitle = p1;
          } else if (!nonAscii(p0) && nonAscii(p1)) {
            artistName = p1;
            songTitle = p0;
          } else {
            try {
              const tryA = await getAlbumFromTrack(p0, p1);
              if (tryA && (tryA.colName || tryA.res)) {
                artistName = p0;
                songTitle = p1;
              } else {
                const tryB = await getAlbumFromTrack(p1, p0);
                if (tryB && (tryB.colName || tryB.res)) {
                  artistName = p1;
                  songTitle = p0;
                } else {
                  artistName = p1;
                  songTitle = p0;
                }
              }
            } catch {
              artistName = p1;
              songTitle = p0;
            }
          }
        }
      }
    }
  }

  if (
    !songTitle ||
    songTitle.length === 0 ||
    songTitle === "Unknown Title" ||
    /untitled|unknown/i.test(songTitle)
  ) {
    try {
      const decoded = decodeURIComponent(songUri || "");
      const base = (decoded.split("/").pop() ?? "").replace(/\.[^/.]+$/, "");
      const cleaned = base.replace(/[^a-zA-Z0-9\s]/g, "").trim();
      if (cleaned) {
        songTitle = cleaned;
        let searchArtistName = artistName;
        if (
          !artistName ||
          artistName.length === 0 ||
          artistName === "Unknown Artist"
        ) {
          searchArtistName = " ";
        }

        const videos = await yt.search(searchArtistName + " " + cleaned, {
          limit: 2,
        });
        let videoTitle = videos[0].title;
        if (videoTitle) songTitle = videoTitle;
      }
    } catch {
      return;
    }
  }

  let mainAlRes = null;
  try {
    const tryBoth = await Promise.allSettled([
      getAlbumFromTrack(artistName || " ", songTitle),
      getAlbumFromTrack(songTitle, artistName || " "),
    ]);
    const resA = tryBoth[0].status === "fulfilled" ? tryBoth[0].value : null;
    const resB = tryBoth[1].status === "fulfilled" ? tryBoth[1].value : null;

    const score = (r: any) => (r && (r.colName || r.res) ? 1 : 0);
    const sA = score(resA);
    const sB = score(resB);
    if (sB > sA) {
      const prevArtist = artistName;
      artistName = songTitle;
      songTitle = prevArtist || "";
      mainAlRes = resB;
    } else {
      mainAlRes = resA;
    }
  } catch (err) {
    console.error("Error during swap/initial lookup:", err);
  }

  let album: string | null = existingData?.album || null;
  let imageUrl: string | null = existingData?.artwork || null;
  let allGenres: string[] = [];
  let releaseDate: string | null = existingData?.release_date || null;
  let popularity: number | null = null;
  let listeners: number | null = null;
  let mbid: string | null = null;
  let trackSmallInfo: string | null = null;
  let trackBigInfo: string | null = null;

  // 1) Process initial album metadata
  if (!album || hasFaultyUnicode(album) || album === "Unknown Album") {
    album = mainAlRes?.colName || null;
    if (mainAlRes?.res) {
      if (similarity(songTitle || "", mainAlRes.res.artistName || "") > 0.7) {
        if (
          mainAlRes.res.artistName.toLowerCase() !== artistName?.toLowerCase()
        ) {
          artistName = mainAlRes.res.artistName || songTitle;
          songTitle = mainAlRes.res.trackName || artistName;
        }
      }
      if (similarity(artistName || "", mainAlRes.res.artistName || "") < 0.3) {
        album = null;
      }
    }
  }

  // 2) Prepare parallel metadata tasks
  const metadataTasks = [];

  // Genres task
  const fetchGenres = async () => {
    if (existingData?.genres) {
      try {
        return JSON.parse(existingData.genres);
      } catch {
        return [];
      }
    }
    const genre = mainAlRes?.res
      ? mainAlRes.res.primaryGenreName.toLowerCase()
      : null;
    const aGenres = await getArtistGenres(artistName || " ", songTitle || " ");
    return Array.from(new Set([...(genre ? [genre] : []), ...aGenres]));
  };
  metadataTasks.push(
    fetchGenres()
      .then((g) => (allGenres = g))
      .catch((e) => console.error("Genre fetch failed", e))
  );

  // Popularity & Last.fm task
  const fetchLastFmAndYt = async () => {
    const ytPromise = yt
      .search(`${songTitle} ${artistName || ""}`, { limit: 2 })
      .catch(() => null);
    const lastfmUrl = `https://ws.audioscrobbler.com/2.0/?method=artist.gettoptags&artist=${encodeURIComponent(
      artistName || ""
    )}&api_key=${lastfmAPIKey}&format=json`;
    const lastfmPromise = fetch(lastfmUrl)
      .then((r) => r.json())
      .catch(() => null);

    const [videos, data] = await Promise.all([ytPromise, lastfmPromise]);

    if (videos && videos.length > 0) {
      popularity = videos[0].views ? Number(videos[0].views) : null;
    }

    if (data?.track && data.track.listeners) {
      mbid = data.track.artist?.mbid || null;
      album = album || data.track.album?.title || null;
      trackSmallInfo = data.track.wiki?.summary || null;
      trackBigInfo = data.track.wiki?.content || null;
      listeners = Number(data.track.listeners) || 0;

      if (typeof popularity === "number" && popularity > 1 && listeners > 1) {
        popularity = (popularity / listeners) * 100 * 1.25;
      }
    } else if (typeof popularity === "number") {
      popularity = popularity * 1.25;
    }
  };
  metadataTasks.push(
    fetchLastFmAndYt().catch((e) =>
      console.error("Popularity/LastFm fetch failed", e)
    )
  );

  // Lyrics
  let lyricsResult: string | null = null;
  const fetchLyricsTask = async () => {
    if (existingData?.lyrics && existingData.lyrics !== "none") return;
    try {
      const lyricsObj = await getLyrics(artistName || " ", songTitle || " ");
      let lyrics: string | null = lyricsObj?.lyrics || null;

      if (!lyrics) {
        const cFetch = await customFetch(songTitle, artistName || "");
        if (cFetch?.lyrics) lyrics = cFetch.lyrics;
      }

      if (typeof lyrics === "string") {
        const lines = lyrics
          .replace(/\\n/g, "\n")
          .split("\n")
          .filter(
            (line: string) =>
              !/(作词|作曲|Producer|Writer)\s*[:：]/i.test(line) &&
              !line.includes("[by:")
          )
          .map((line: string) => line.trim())
          .filter((line: string) => line.length > 0);

        const processedLines: string[] = [];
        const seenTimestamps = new Set<string>();

        for (const line of lines) {
          const tsMatch = line.match(/^\[(\d{2}:\d{2}\.\d{2,3})\]/);
          if (tsMatch) {
            const timestamp = tsMatch[1];
            if (seenTimestamps.has(timestamp)) {
              break;
            }
            seenTimestamps.add(timestamp);
          }
          processedLines.push(line);
        }
        lyricsResult = processedLines.join("\n");
      }
    } catch (e) {
      console.error("Lyrics fetch failed", e);
    }
  };
  metadataTasks.push(fetchLyricsTask());

  // Artwork task
  const fetchArtwork = async () => {
    if (imageUrl) return;

    // Try main result first
    if (mainAlRes?.res) {
      imageUrl = mainAlRes.res.artworkUrl100.replace("100x100", "1000x1000");
    } else {
      const newalRes = await getiTunesAlbumCover(
        artistName || " ",
        album || " "
      ).catch(() => null);
      if (newalRes?.image) {
        imageUrl = newalRes.image;
        releaseDate = releaseDate || newalRes.res?.releaseDate || null;
      } else {
        imageUrl = await getBandCampAlbumCover(
          artistName || " ",
          album || ""
        ).catch(() => null);
      }
    }
  };
  metadataTasks.push(fetchArtwork());

  await Promise.allSettled(metadataTasks);

  // 3) Release date if still missing
  if (!releaseDate && mainAlRes?.res) {
    releaseDate = mainAlRes.res.releaseDate || null;
  }

  // 4) Download and cache image
  let localUri: string | null = null;
  if (imageUrl && !existingData?.artwork) {
    try {
      localUri = await downloadImage(imageUrl);
    } catch (err) {
      console.warn(`Image download failed:`, err);
    }
  }

  // 5) Create palette
  let palette: string[] | null = null;
  if (existingData?.palette) {
    try {
      palette =
        typeof existingData.palette === "string"
          ? JSON.parse(existingData.palette)
          : existingData.palette;
    } catch {
      palette = null;
    }
  }
  if (!palette || (Array.isArray(palette) && palette.length === 0)) {
    const metaSource = existingData?.uri || localUri || null;
    if (metaSource) {
      try {
        const meta = await extractMetadata(metaSource, songTitle);
        if (meta?.palette?.length) palette = meta.palette;
      } catch (e) {
        console.warn("Palette extraction failed", e);
      }
    }
  }

  // 6) Save lyrics
  let lyricsPath: string | null = existingData?.lyrics || "none";
  if (lyricsResult) {
    try {
      const lyricsDir = `${(FileSystem as any).documentDirectory}lyrics/`;
      if (!isLyricsDirChecked) {
        const info = await (FileSystem as any).getInfoAsync(lyricsDir);
        if (!info.exists) {
          await (FileSystem as any).makeDirectoryAsync(lyricsDir, {
            intermediates: true,
          });
        }
        isLyricsDirChecked = true;
      }

      const fileUri = `${lyricsDir}${songId}.lrc`;
      await (FileSystem as any).writeAsStringAsync(fileUri, lyricsResult, {
        encoding: "utf8",
      } as any);
      lyricsPath = fileUri;
    } catch (e) {
      console.warn("Failed to save lyrics file:", e);
    }
  }

  listeners =
    typeof popularity === "number" && isFinite(popularity)
      ? Math.ceil(popularity)
      : listeners ||
        (typeof popularity === "number" ? Math.floor(popularity) : null);

  // Non-blocking comments fetch
  if (artistName && songTitle && songId) {
    fetchAndStoreSongComments(artistName, songTitle, songId).catch(() => null);
  }

  // 7) Store into database
  try {
    if (mbid && artistName) await upsertArtist({ name: artistName, mbid });
  } catch (err) {
    console.warn(`Failed to update artist MBID:`, err);
  }

  await storeSongInDB(
    songTitle.replace(/\.(opus|mp3|flac)$/i, ""),
    artistName || null,
    allGenres || null,
    releaseDate || null,
    album || songTitle,
    localUri,
    palette || null,
    songId || null,
    lyricsPath || "none",
    originalTitle,
    originalArtist,
    trackSmallInfo,
    trackBigInfo,
    listeners
  );
}

const fetchAndStoreSongComments = async (
  artistName: string,
  songTitle: string,
  songId: string
) => {
  try {
    const comments = await getSongComments(artistName, songTitle);

    if (comments && comments.length > 0) {
      const validComments = comments.filter(
        (
          comment
        ): comment is {
          user: string;
          text: string;
          profile?: string;
          date?: string;
        } =>
          comment !== undefined &&
          comment !== null &&
          typeof comment.user === "string" &&
          typeof comment.text === "string"
      );

      if (validComments.length > 0) {
        await storeSongComments(songId, artistName, validComments);
      }
    }
  } catch {}
};

export { fetchAndStoreSongMetadata };
