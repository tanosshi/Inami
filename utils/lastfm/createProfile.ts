import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";
import ImageColors from "react-native-image-colors";
import { saveProfile, getProfileItem } from "../database/databaseCore";
import {
  setTopItems as saveTopItems,
  TopItem,
} from "../database/profileOperations";
import { getAllSongs, updateSong } from "../database/songOperations";
import { upsertArtist, getAllArtists } from "../database/artistOperations";
import {
  addListeningHistoryBatch,
  clearListeningHistory,
} from "../database/listeningHistoryOperations";
import { pastelify } from "../colorUtils";

export async function loadData() {
  console.log("Loading Last.fm data...");
  const dir = `${(FileSystem as any).documentDirectory}lastfm_data/`;

  try {
    const files = await FileSystem.readDirectoryAsync(dir);
    const validFiles = files.filter(
      (f) =>
        (f.includes("_scrobbles_part") || f.includes("_scrobbles_update_")) &&
        f.endsWith(".json")
    );

    const data: any[] = [];

    for (const name of validFiles) {
      const filePath = dir + name;
      const content = await FileSystem.readAsStringAsync(filePath);
      const jsonData = JSON.parse(content);
      if (Array.isArray(jsonData)) {
        data.push(...jsonData);
      }
    }

    console.log(
      "Loaded",
      data.length,
      "scrobbles from",
      validFiles.length,
      "files"
    );
    return data;
  } catch (err) {
    console.error("Failed to read lastfm_data directory:", err);
    return [];
  }
}

async function backfill(data: any[], onProgress?: (message: string) => void) {
  const report = (msg: string) => {
    console.log(msg);
    onProgress?.(msg);
  };

  report("Starting backfill process...");
  const songs = await getAllSongs();
  report(`Found ${songs.length} songs in library to check.`);

  const lastFmTracks: { [key: string]: any } = {};
  const lastFmArtists: { [key: string]: any } = {};

  data.forEach((scrobble: any) => {
    const artistName =
      typeof scrobble.artist === "string"
        ? scrobble.artist
        : scrobble.artist?.["#text"];
    const trackName = scrobble.name;
    const albumName =
      typeof scrobble.album === "string"
        ? scrobble.album
        : scrobble.album?.["#text"];

    const image =
      scrobble.image?.[3]?.["#text"] ||
      scrobble.image?.[scrobble.image.length - 1]?.["#text"] ||
      "";

    if (artistName && trackName) {
      const key = `${artistName.toLowerCase()} - ${trackName.toLowerCase()}`;
      if (!lastFmTracks[key]) {
        lastFmTracks[key] = {
          count: 0,
          mbid: scrobble.mbid,
          album_mbid: scrobble.album?.mbid,
          image: image,
          artist: artistName,
          track: trackName,
          album: albumName,
        };
      }
      lastFmTracks[key].count++;
      if (!lastFmTracks[key].mbid && scrobble.mbid)
        lastFmTracks[key].mbid = scrobble.mbid;
      if (!lastFmTracks[key].album_mbid && scrobble.album?.mbid)
        lastFmTracks[key].album_mbid = scrobble.album?.mbid;
      if (!lastFmTracks[key].image && image) lastFmTracks[key].image = image;
    }

    if (artistName && artistName !== "Unknown Artist") {
      const key = artistName.toLowerCase();
      if (!lastFmArtists[key]) {
        lastFmArtists[key] = {
          name: artistName,
          mbid: scrobble.artist?.mbid,
          image: image,
          count: 0,
        };
      }
      lastFmArtists[key].count++;
      if (!lastFmArtists[key].mbid && scrobble.artist?.mbid)
        lastFmArtists[key].mbid = scrobble.artist?.mbid;
    }
  });

  const downloadImage = async (url: string, prefix: string, id: string) => {
    if (!url) return undefined;
    try {
      const filename = `${prefix}_${id.replace(/[^a-zA-Z0-9]/g, "_")}.jpg`;
      const docDir = `${
        (FileSystem as any).documentDirectory
      }lastfm_data/images/`;

      await FileSystem.makeDirectoryAsync(docDir, {
        intermediates: true,
      }).catch(() => {});
      const fileUri = docDir + filename;
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.exists) return fileUri;

      const { uri } = await FileSystem.downloadAsync(url, fileUri);
      return uri;
    } catch {
      return undefined;
    }
  };

  report(`Processing ${songs.length} songs...`);
  let processedCount = 0;
  for (const song of songs) {
    const artist =
      (song as any).artist === "Unknown Artist" ? "" : (song as any).artist;
    const title = (song as any).title;

    let match = null;
    if (artist) {
      match = lastFmTracks[`${artist.toLowerCase()} - ${title.toLowerCase()}`];
    } else {
      const possibleKey = Object.keys(lastFmTracks).find((k) =>
        k.endsWith(` - ${title.toLowerCase()}`)
      );
      if (possibleKey) match = lastFmTracks[possibleKey];
    }

    if (match) {
      const updates: any = {};
      let hasUpdates = false;

      if ((song as any).artist === "Unknown Artist" && match.artist) {
        updates.artist = match.artist;
        hasUpdates = true;
      }

      if ((song as any).album === "Unknown Album" && match.album) {
        updates.album = match.album;
        hasUpdates = true;
      }

      if (!(song as any).mbid && match.mbid) {
        updates.mbid = match.mbid;
        hasUpdates = true;
      }
      if (!(song as any).album_mbid && match.album_mbid) {
        updates.album_mbid = match.album_mbid;
        hasUpdates = true;
      }

      if (match.count > ((song as any).play_count || 0)) {
        updates.play_count = match.count;
        hasUpdates = true;
      }

      if (!(song as any).artwork && match.image) {
        const downloaded = await downloadImage(
          match.image,
          "track",
          `${match.artist}-${match.track}`
        );
        if (downloaded) {
          updates.artwork = downloaded;
          hasUpdates = true;
        }
      }

      if (hasUpdates) {
        await updateSong((song as any).id, updates);
      }
    }
    processedCount++;
    if (processedCount % 100 === 0) {
      report(`Processed ${processedCount}/${songs.length} songs...`);
    }
  }
  report(`Finished processing ${songs.length} songs.`);

  const existingArtists = await getAllArtists();
  const existingArtistNames = new Set(
    existingArtists.map((a) => a.name.toLowerCase())
  );

  report("Updating artists...");
  let artistUpdateCount = 0;
  for (const key in lastFmArtists) {
    const data = lastFmArtists[key];
    if (existingArtistNames.has(data.name.toLowerCase())) {
      if (data.mbid || data.image) {
        let imageUrl = undefined;
        if (data.image) {
          imageUrl = await downloadImage(data.image, "artist", data.name);
        }

        await upsertArtist({
          name: data.name,
          mbid: data.mbid,
          image_url: imageUrl,
          listeners: data.count,
        });
        artistUpdateCount++;
      }
    }
  }
  report(`Updated ${artistUpdateCount} artists.`);
  report("Backfill complete.");
}

async function importListeningHistory(
  data: any[],
  onProgress?: (message: string) => void
) {
  const report = (msg: string) => {
    console.log(msg);
    onProgress?.(msg);
  };

  report("Preparing listening history entries...");

  await clearListeningHistory("lastfm");

  const uniqueMap = new Map<string, any>();

  data.forEach((scrobble: any) => {
    const artistName =
      typeof scrobble.artist === "string"
        ? scrobble.artist
        : scrobble.artist?.["#text"] || "Unknown Artist";
    const trackName = scrobble.name || "Unknown Track";
    const albumName =
      typeof scrobble.album === "string"
        ? scrobble.album
        : scrobble.album?.["#text"] || "Unknown Album";

    const timestamp = scrobble.date?.uts
      ? parseInt(scrobble.date.uts)
      : Date.now() / 1000;

    const artworkUrl =
      scrobble.image?.[3]?.["#text"] ||
      scrobble.image?.[scrobble.image.length - 1]?.["#text"] ||
      undefined;

    const uniqueKey = `${artistName.toLowerCase()}|${trackName.toLowerCase()}|${timestamp}`;

    if (!uniqueMap.has(uniqueKey)) {
      uniqueMap.set(uniqueKey, {
        artist: artistName,
        track: trackName,
        album: albumName,
        timestamp: timestamp,
        mbid: scrobble.mbid || undefined,
        album_mbid: scrobble.album?.mbid || undefined,
        artwork: artworkUrl,
        source: "lastfm",
      });
    }
  });

  const historyEntries = Array.from(uniqueMap.values());

  report(
    `Importing ${
      historyEntries.length
    } unique scrobbles to listening history (${
      data.length - historyEntries.length
    } duplicates removed)...`
  );

  const batchSize = 2000;

  let processed = 0;
  for (let i = 0; i < historyEntries.length; i += batchSize) {
    const batch = historyEntries.slice(i, i + batchSize);
    await addListeningHistoryBatch(batch);

    processed += batch.length;

    // Smooth counter animation

    report(`Imported ${processed}/${historyEntries.length} scrobbles...`);
  }

  report(
    `Successfully imported ${historyEntries.length} scrobbles to listening history.`
  );
}

async function setTopItems(
  data: any[],
  onProgress?: (message: string) => void
) {
  if (!data || data.length === 0) return null;

  onProgress?.("Calculating top items...");

  const artistStats: {
    [key: string]: { listnes: number; mbid: string; imageUrl: string };
  } = {};
  const trackStats: {
    [key: string]: { listnes: number; mbid: string; imageUrl: string };
  } = {};
  const albumStats: {
    [key: string]: { listnes: number; mbid: string; imageUrl: string };
  } = {};

  data.forEach((scrobble: any) => {
    const artistName =
      typeof scrobble.artist === "string"
        ? scrobble.artist
        : scrobble.artist?.["#text"] || "Unknown Artist";
    const trackName = scrobble.name || "Unknown Track";
    const albumName =
      typeof scrobble.album === "string"
        ? scrobble.album
        : scrobble.album?.["#text"] || "Unknown Album";

    const artistMbid = scrobble.artist?.mbid || "";
    const trackMbid = scrobble.mbid || "";
    const albumMbid = scrobble.album?.mbid || "";

    const image =
      scrobble.image?.[3]?.["#text"] ||
      scrobble.image?.[scrobble.image.length - 1]?.["#text"] ||
      "";

    if (artistName !== "Unknown Artist") {
      if (!artistStats[artistName]) {
        artistStats[artistName] = {
          listnes: 0,
          mbid: artistMbid,
          imageUrl: image,
        };
      }
      artistStats[artistName].listnes++;
      if (!artistStats[artistName].mbid && artistMbid) {
        artistStats[artistName].mbid = artistMbid;
      }
      if (!artistStats[artistName].imageUrl && image) {
        artistStats[artistName].imageUrl = image;
      }
    }

    if (trackName !== "Unknown Track") {
      const compositeKey = `${artistName} - ${trackName}`;
      if (!trackStats[compositeKey]) {
        trackStats[compositeKey] = {
          listnes: 0,
          mbid: trackMbid,
          imageUrl: image,
        };
      }
      trackStats[compositeKey].listnes++;
      if (!trackStats[compositeKey].mbid && trackMbid) {
        trackStats[compositeKey].mbid = trackMbid;
      }
      if (!trackStats[compositeKey].imageUrl && image) {
        trackStats[compositeKey].imageUrl = image;
      }
    }

    if (albumName !== "Unknown Album") {
      const compositeKey = `${artistName} - ${albumName}`;
      if (!albumStats[compositeKey]) {
        albumStats[compositeKey] = {
          listnes: 0,
          mbid: albumMbid,
          imageUrl: image,
        };
      }
      albumStats[compositeKey].listnes++;
      if (!albumStats[compositeKey].mbid && albumMbid) {
        albumStats[compositeKey].mbid = albumMbid;
      }
      if (!albumStats[compositeKey].imageUrl && image) {
        albumStats[compositeKey].imageUrl = image;
      }
    }
  });

  const downloadImage = async (url: string, prefix: string, id: string) => {
    if (!url) return undefined;
    try {
      const filename = `${prefix}_${id.replace(/[^a-zA-Z0-9]/g, "_")}.jpg`;
      const docDir = `${
        (FileSystem as any).documentDirectory
      }lastfm_data/images/`;

      await FileSystem.makeDirectoryAsync(docDir, {
        intermediates: true,
      }).catch(() => {});

      const fileUri = docDir + filename;

      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.exists) {
        return fileUri;
      }

      const { uri } = await FileSystem.downloadAsync(url, fileUri);
      return uri;
    } catch (e) {
      console.warn("Failed to download image from", url, e);
      return undefined; // Fallback to no image
    }
  };

  onProgress?.("Saving top artists...");
  const topArtists: TopItem[] = await Promise.all(
    Object.entries(artistStats)
      .sort(([, a], [, b]) => b.listnes - a.listnes)
      .slice(0, 5)
      .map(async ([name, stats]) => ({
        name: name,
        amount: stats.listnes,
        mbid: stats.mbid || undefined,
        image: await downloadImage(stats.imageUrl, "artist", name),
      }))
  );

  onProgress?.("Saving top tracks...");
  const topTracks: TopItem[] = await Promise.all(
    Object.entries(trackStats)
      .sort(([, a], [, b]) => b.listnes - a.listnes)
      .slice(0, 10)
      .map(async ([key, stats]) => {
        const parts = key.split(" - ");
        const name = parts.length > 1 ? parts.slice(1).join(" - ") : key;
        return {
          name: name,
          amount: stats.listnes,
          mbid: stats.mbid || undefined,
          image: await downloadImage(stats.imageUrl, "track", key),
        };
      })
  );

  onProgress?.("Saving top albums...");
  const topAlbums: TopItem[] = await Promise.all(
    Object.entries(albumStats)
      .sort(([, a], [, b]) => b.listnes - a.listnes)
      .slice(0, 5)
      .map(async ([key, stats]) => {
        const parts = key.split(" - ");
        const name = parts.length > 1 ? parts.slice(1).join(" - ") : key;
        return {
          name: name,
          amount: stats.listnes,
          mbid: stats.mbid || undefined,
          image: await downloadImage(stats.imageUrl, "album", key),
        };
      })
  );

  await saveTopItems(topArtists, topTracks, topAlbums);
}

async function createProfile(
  data: any[],
  onProgress?: (message: string) => void
) {
  console.log("createProfile called with data length:", data?.length || 0);
  if (!data) return null;

  const report = (msg: string) => {
    console.log(msg);
    onProgress?.(msg);
  };

  const artistCount: { [key: string]: number } = {};
  const trackCount: { [key: string]: number } = {};
  const albumCount: { [key: string]: number } = {};

  data.forEach((scrobble: any) => {
    const artist =
      typeof scrobble.artist === "string"
        ? scrobble.artist
        : scrobble.artist?.["#text"] || "Unknown Artist";
    const track = scrobble.name || "Unknown Track";
    const album =
      typeof scrobble.album === "string"
        ? scrobble.album
        : scrobble.album?.["#text"] || "Unknown Album";

    if (artist && artist !== "Unknown Artist")
      artistCount[artist] = (artistCount[artist] || 0) + 1;
    if (track && track !== "Unknown Track")
      trackCount[track] = (trackCount[track] || 0) + 1;
    if (album && album !== "Unknown Album")
      albumCount[album] = (albumCount[album] || 0) + 1;
  });

  const totalScrobbles = data.length;
  const uniqueArtists = Object.keys(artistCount).length;
  const uniqueTracks = Object.keys(trackCount).length;
  const uniqueAlbums = Object.keys(albumCount).length;

  try {
    const currentProfile = (await getProfileItem()) || {
      username: "",
      profile_picture: "",
      country: "",
      lastfm_url: "",
      aka: "",
    };

    let primaryColor = "#a3e635";
    let rawColor = "#a3e635";

    if (currentProfile.profile_picture) {
      try {
        report("Extracting colors from profile picture...");
        const result = await ImageColors.getColors(
          currentProfile.profile_picture,
          {
            fallback: "#a3e635",
            cache: true,
            key: currentProfile.profile_picture,
          }
        );

        let extractedColor = "#a4cde0ff";
        if (Platform.OS === "ios") {
          extractedColor = (result as any).primary;
        } else {
          extractedColor = (result as any).dominant;
        }
        rawColor = extractedColor;
        primaryColor = pastelify(extractedColor);
      } catch (e) {
        console.log("Failed to extract colors:", e);
      }
    }

    report("Saving profile stats...");
    await saveProfile({
      username: currentProfile.username,
      profile_picture: currentProfile.profile_picture,
      country: currentProfile.country,
      lastfm_url: currentProfile.lastfm_url,
      aka: currentProfile.aka,
      playcount: totalScrobbles.toString(),
      artist_count: uniqueArtists.toString(),
      track_count: uniqueTracks.toString(),
      album_count: uniqueAlbums.toString(),
      primary_color: primaryColor,
      raw_color: rawColor,
    });

    report("Running first backfill pass...");
    await backfill(data, onProgress);
    report("Running second backfill pass...");
    await backfill(data, onProgress);

    report("Importing listening history...");
    await importListeningHistory(data, onProgress);

    report("Setting top items...");
    await setTopItems(data, onProgress);

    report("Profile creation complete!");

    return {
      success: true,
      stats: {
        playcount: totalScrobbles,
        artist_count: uniqueArtists,
        track_count: uniqueTracks,
        album_count: uniqueAlbums,
      },
    };
  } catch (error) {
    console.error("Error saving profile stats:", error);
    return { success: false, error };
  }
}

export default createProfile;
