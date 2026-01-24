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
import { toRomaji } from "wanakana";

// in the end push limits to all api calls to fill all gaps to keep it perfect. ; also make it use google at the end if alot of main data misses

async function fetchAndStoreSongMetadata(
  songTitle: string,
  artistName?: string,
  songId?: string,
  songUri?: string
) {
  const lastfmAPIKey = await getLastfmAPIKey();
  const originalTitle = songTitle;
  const originalArtist = artistName || null;

  if (!songId) return;

  const existingData = await getExistingSongData(songId);
  console.log(`Existing data:`, existingData);

  let successProbability = 100;
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
      if (
        !songTitle.includes(" - ") &&
        !songTitle.includes("-") &&
        !songTitle.includes(" – ") &&
        !songTitle.includes(" — ") &&
        !songTitle.includes(" by ") &&
        !songTitle.includes("--") &&
        !songTitle.includes("––") &&
        !songTitle.includes("——")
      ) {
        successProbability = 2;
        // Use youtube-search to scrape. we wont give up!!!!!!!!!!!!!!!!!
        console.log(`8No separator found in title: ${songTitle}`);

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
          successProbability -= 10;

          const nonAscii = (s: string) => /[^\u0000-\u007f]/.test(s);
          if (nonAscii(p0) && !nonAscii(p1)) {
            successProbability -= 10;
            artistName = p0;
            songTitle = p1;
            console.log(`1Parsed artist/title: ${artistName} -- ${songTitle}`);
          } else if (!nonAscii(p0) && nonAscii(p1)) {
            successProbability = 100;
            artistName = p1;
            songTitle = p0;
            console.log(`2Parsed artist/title: ${artistName} -- ${songTitle}`);
          } else {
            successProbability = 100;
            try {
              const tryA = await getAlbumFromTrack(p0, p1);
              if (tryA && (tryA.colName || tryA.res)) {
                successProbability = 100;
                artistName = p0;
                songTitle = p1;
                console.log(
                  `3Parsed artist/title (lookup success): ${artistName} -- ${songTitle}`
                );
              } else {
                const tryB = await getAlbumFromTrack(p1, p0);
                if (tryB && (tryB.colName || tryB.res)) {
                  successProbability = 100;
                  artistName = p1;
                  songTitle = p0;
                  console.log(
                    `4Parsed artist/title (lookup swapped success): ${artistName} -- ${songTitle}`
                  );
                } else {
                  successProbability = 100;
                  artistName = p1;
                  songTitle = p0;
                  console.log(
                    `5Fallback parsed artist/title: ${artistName} -- ${songTitle}`
                  );
                }
              }
            } catch {
              successProbability = 100;
              artistName = p1;
              songTitle = p0;
              console.log(
                `6Lookup error, fallback parsed artist/title: ${artistName} -- ${songTitle}`
              );
            }
          }
        }
      }
    } else {
      successProbability = 100;
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
    }
  } catch {}

  let album: string | null = null;
  let imageUrl: string | null = null;

  // 1) Get album name
  if (
    !existingData?.album ||
    hasFaultyUnicode(existingData.album) ||
    existingData.album === "Unknown Album"
  ) {
    console.log(`Album missing or has faulty unicode, fetching...`);
    const alRes = await getAlbumFromTrack(artistName || " ", songTitle);
    album = alRes?.colName;

    imageUrl = alRes?.res
      ? alRes?.res?.artworkUrl100.replace("100x100", "1000x1000")
      : null;

    if (similarity(songTitle || "", alRes?.res?.artistName || "") > 0.7) {
      if (
        alRes?.res?.artistName.toLocaleLowerCase() !==
        artistName?.toLocaleLowerCase()
      ) {
        console.log("Switched up order, proper fixing found.");
        artistName = alRes?.res?.artistName || songTitle;
        songTitle = alRes?.res?.trackName || artistName;
      }
    }

    if (similarity(artistName || "", alRes?.res?.artistName || "") < 0.3)
      album = null;

    console.log(`Found album: ${album}`);
  } else {
    console.log(`Album already exists and is clean: ${existingData.album}`);
    album = existingData.album;
  }

  // 2) Get cover art - only if missing
  let alRes = null;
  let newalRes = null;

  if (!existingData?.artwork) {
    console.log(`Cover art missing, fetching...`);

    if (artistName === "Various Artists" || artistName === "Unknown Artist")
      artistName = "";

    alRes = await getAlbumFromTrack(artistName || " ", songTitle);

    if (alRes?.res) {
      imageUrl = alRes.res.artworkUrl100.replace("100x100", "1000x1000");
      console.log(`Found iTunes cover from track search: ${imageUrl}`);
    } else {
      newalRes = await getiTunesAlbumCover(artistName || " ", album || " ");
      imageUrl = newalRes?.image || null;
    }

    // 2f) Get Bandcamp cover if iTunes not found
    if (!imageUrl || imageUrl.length === 0) {
      console.log(`No iTunes cover found, trying Bandcamp...`);
      imageUrl = await getBandCampAlbumCover(artistName || " ", album || "");
    }
  } else {
    console.log(`Cover art already exists: ${existingData.artwork}`);
  }

  // 3x) Get genre from leftover iTunes data
  let genre = alRes?.res ? alRes?.res.primaryGenreName.toLowerCase() : null;
  genre = newalRes?.res ? newalRes?.res.primaryGenreName.toLowerCase() : genre;
  console.log(`Found genre from iTunes: ${genre}`);

  // 3) Get genres from Last.fm
  let allGenres: string[] = [];
  if (!existingData?.genres) {
    console.log(`Fetching genres`);
    const aGenres: string[] = await getArtistGenres(
      artistName || " ",
      songTitle || " "
    );
    console.log(aGenres);
    allGenres = Array.from(new Set([...(genre ? [genre] : []), ...aGenres]));
  } else {
    console.log(`Genres already exist and are clean: ${existingData.genres}`);
    try {
      allGenres = JSON.parse(existingData.genres);
    } catch {
      allGenres = [];
    }
  }

  // 4x) Release date leftover from iTunes data
  let releaseDate: string | null = null;
  if (
    (!existingData?.release_date && alRes?.res) ||
    existingData?.release_date === null
  ) {
    console.log(`Release date missing or has faulty unicode, fetching...`);
    releaseDate = alRes?.res ? alRes?.res.releaseDate : null;
    releaseDate = newalRes?.res
      ? newalRes?.res.releaseDate.toLowerCase()
      : releaseDate;
    console.log(`Release date: ${releaseDate}`);
  } else {
    console.log(
      `Release date already exists and is clean: ${existingData?.release_date}`
    );
    releaseDate = existingData?.release_date || null;
  }

  // 3) Download and cache image
  let localUri: string | null = null;
  if (imageUrl && !existingData?.artwork) {
    try {
      localUri = await downloadImage(imageUrl);
    } catch (err) {
      console.warn(`Image download failed:`, err);
    }
  }

  // 4) Create palette
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

  if (
    (Array.isArray(palette) && palette.length === 0) ||
    !existingData?.palette
  ) {
    const metaSource = existingData?.uri || localUri || null;
    if (metaSource) {
      try {
        const meta = await extractMetadata(metaSource, songTitle);
        if (meta && meta.palette && meta.palette.length) palette = meta.palette;
      } catch {}
    }
  }

  // 5) Get lyrics -- ! Takes longest, slow api.
  let lyricsPath: string | null = "none";

  // logic makes no sense but keep it, double check works
  if (!existingData?.lyrics && existingData?.lyrics !== "none") {
    try {
      let lyrics: any =
        (await getLyrics(artistName || " ", songTitle || " ")) || null;

      if (lyrics === "null") {
        const cFetch = await customFetch(songTitle, artistName || "");
        if (cFetch && typeof cFetch === "object" && cFetch.lyrics) {
          lyrics = cFetch.lyrics;
        }
      }
      if (
        lyrics &&
        typeof lyrics === "string" &&
        (lyrics as string).length > 0
      ) {
        try {
          const lyricsDir = `${(FileSystem as any).documentDirectory}lyrics/`;
          try {
            await (FileSystem as any).getInfoAsync(lyricsDir);
          } catch {}
          try {
            await (FileSystem as any).makeDirectoryAsync(lyricsDir, {
              intermediates: true,
            });
          } catch {}

          const safeFileName = `${songId}.lrc`;
          const fileUri = `${lyricsDir}${safeFileName}`;
          await (FileSystem as any).writeAsStringAsync(fileUri, lyrics, {
            encoding: "utf8",
          } as any);
          lyricsPath = fileUri;
          console.log(`Saved lyrics to ${fileUri}`);
        } catch (e) {
          console.warn("Failed to save lyrics file:", e);
        }
      } else {
        console.log("No lyrics returned for", artistName, songTitle);
      }
    } catch (e) {
      console.warn("Error fetching lyrics:", e);
    }
  }

  // Q) Extras (Expect rate limits, we're just maximizing data here)
  // Q1) Popularity + extras if last fm works
  let popularity: number | null = null;
  let listeners: number | null = null;
  let mbid: string | null = null;
  let trackSmallInfo: string | null = null;
  let trackBigInfo: string | null = null;

  try {
    const videos = await yt.search(songTitle + " " + (artistName || ""), {
      limit: 2,
    });
    if (videos && videos.length > 0) {
      popularity = videos[0].views ? Number(videos[0].views) : null;
    }
  } catch {}

  const res = await fetch(
    `https://ws.audioscrobbler.com/2.0/?method=artist.gettoptags&artist=${encodeURIComponent(
      artistName || ""
    )}&api_key=${lastfmAPIKey}&format=json`
  );

  const data = await res.json();
  if (data.track && data.track.listeners) {
    mbid = data.track.artist?.mbid || null;
    album = data.track.album?.title || album;
    trackSmallInfo = data.track.wiki?.summary || null;
    trackBigInfo = data.track.wiki?.content || null;

    listeners = Number(data.track.listeners) || 0;
    if (typeof popularity === "number" && popularity > 1 && listeners > 1) {
      popularity = (popularity / listeners) * 100 * 1.25;
    }
  } else {
    if (typeof popularity === "number") popularity = popularity * 1.25;
  }

  listeners =
    typeof popularity === "number" && isFinite(popularity)
      ? Math.ceil(popularity)
      : Math.floor(Number(String(listeners)?.split(",").join(""))) ||
        popularity ||
        null;

  if (artistName && songTitle && songId)
    fetchAndStoreSongComments(artistName, songTitle, songId);

  // 6) Store metadata in DB
  try {
    if (mbid && artistName) await upsertArtist({ name: artistName, mbid });
  } catch (err) {
    console.warn(`Failed to update/insert artist MBID for ${artistName}:`, err);
  }

  await storeSongInDB(
    songTitle.replace(".opus", "").replace(".mp3", "").replace(".flac", ""),
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
    console.log(
      `[SongMeta] Fetching comments for song: ${songTitle} by ${artistName}`
    );
    const comments = await getSongComments(artistName, songTitle);

    if (comments && comments.length > 0) {
      const validComments = comments.filter(
        (
          comment
        ): comment is { user: string; text: string; profile?: string } =>
          comment !== undefined &&
          comment !== null &&
          typeof comment.user === "string" &&
          typeof comment.text === "string"
      );

      if (validComments.length > 0) {
        await storeSongComments(songId, artistName, validComments);
        console.log(
          `[SongMeta] Stored ${validComments.length} comments for ${songTitle}`
        );
      } else {
        console.log(`[SongMeta] No valid comments found for ${songTitle}`);
      }
    } else {
      console.log(`[SongMeta] No comments found for ${songTitle}`);
    }
  } catch (error) {
    console.warn(
      `[SongMeta] Failed to fetch/store comments for ${songTitle}:`,
      error
    );
  }
};

export { fetchAndStoreSongMetadata };
