import { useState } from "react";
import * as FileSystem from "expo-file-system/legacy";
import { getLastfmAPIKeys } from "@/secrets";
import createProfile, { loadData } from "./createProfile";

const BASE_URL = "https://ws.audioscrobbler.com/2.0/";

interface LastfmTrack {
  name: string;
  artist: { "#text": string };
  album: { "#text": string };
  date?: { uts: string };
}

interface LastfmResponse {
  recenttracks: {
    track: LastfmTrack[];
    "@attr": {
      page: string;
      total: string;
      totalPages: string;
    };
  };
}

export const useLastfmDownloader = () => {
  const [data, setData] = useState<LastfmTrack[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [creatingProfile, setCreatingProfile] = useState(false);
  const [profileProgress, setProfileProgress] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const fetchPage = async (
    user: string,
    page: number,
    apiKey: string,
    options: { from?: string; to?: string } = {},
    retries = 3
  ): Promise<LastfmResponse> => {
    let url = `${BASE_URL}?method=user.getrecenttracks&user=${user}&api_key=${apiKey}&format=json&limit=200&page=${page}`;
    if (options.from) url += `&from=${options.from}`;
    if (options.to) url += `&to=${options.to}`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        if (res.status >= 500) {
          throw new Error(`Server error ${res.status}`);
        }
        const errorText = await res.text();
        throw new Error(
          `Last.fm API request failed: ${res.status} ${res.statusText} - ${errorText}`
        );
      }
      return res.json();
    } catch (err) {
      if (retries > 0) {
        console.log(`[LastFM] Retrying page ${page} (${retries} retries left)`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return fetchPage(user, page, apiKey, options, retries - 1);
      }
      throw err;
    }
  };

  const saveChunk = async (
    tracks: LastfmTrack[],
    user: string,
    part: number,
    isUpdate = false
  ) => {
    try {
      const dir = `${(FileSystem as any).documentDirectory}lastfm_data/`;
      try {
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      } catch {}

      const filename = isUpdate
        ? `${user}_scrobbles_update_${Date.now()}.json`
        : `${user}_scrobbles_part${part}.json`;

      const fileUri = dir + filename;
      const jsonContent = JSON.stringify(tracks, null, 2);

      await FileSystem.writeAsStringAsync(fileUri, jsonContent, {
        encoding: "utf8",
      } as any);

      console.log(`[LastFM] Saved chunk ${part} to ${fileUri}`);
    } catch (err) {
      console.error("[LastFM] Error saving chunk:", err);
    }
  };

  const downloadAll = async (user: string) => {
    setLoading(true);
    setError(null);
    const dir = `${(FileSystem as any).documentDirectory}lastfm_data/`;
    let apiKeys: string[] = [];

    try {
      apiKeys = await getLastfmAPIKeys();
    } catch {
      apiKeys = [""];
    }

    try {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(
        () => {}
      );
      const files = await FileSystem.readDirectoryAsync(dir);
      const partFiles = files
        .filter(
          (f) => f.startsWith(`${user}_scrobbles_part`) && f.endsWith(".json")
        )
        .sort((a, b) => {
          const partA = parseInt(a.match(/part(\d+)/)?.[1] || "0");
          const partB = parseInt(b.match(/part(\d+)/)?.[1] || "0");
          return partA - partB;
        });

      let part = 1;
      let resumeToTimestamp: string | undefined;
      let updateFromTimestamp: string | undefined;

      if (partFiles.length > 0) {
        const lastPartFile = partFiles[partFiles.length - 1];
        const firstPartFile = partFiles[0];

        try {
          const lastContent = await FileSystem.readAsStringAsync(
            dir + lastPartFile
          );
          const lastJson = JSON.parse(lastContent) as LastfmTrack[];
          const tracksWithDates = lastJson.filter((t) => t.date?.uts);
          if (tracksWithDates.length > 0) {
            const oldestTrack = tracksWithDates[tracksWithDates.length - 1];
            if (oldestTrack.date?.uts) {
              resumeToTimestamp = oldestTrack.date.uts;
            }
          }
          part = parseInt(lastPartFile.match(/part(\d+)/)?.[1] || "0") + 1;
        } catch (e) {
          console.error("[LastFM] Error reading last part for resume:", e);
        }

        try {
          const firstContent = await FileSystem.readAsStringAsync(
            dir + firstPartFile
          );
          const firstJson = JSON.parse(firstContent) as LastfmTrack[];
          const latestTrack = firstJson.find((t) => t.date?.uts);
          if (latestTrack?.date?.uts) {
            updateFromTimestamp = latestTrack.date.uts;
          }
        } catch (e) {
          console.error("[LastFM] Error reading first part for update:", e);
        }
      }

      console.log(
        `[LastFM] State: Resume Part=${part}, To=${resumeToTimestamp}, Update From=${updateFromTimestamp}`
      );

      if (updateFromTimestamp) {
        console.log("[LastFM] Checking for updates...");
        try {
          const updateRes = await fetchPage(user, 1, apiKeys[0], {
            from: (parseInt(updateFromTimestamp) + 1).toString(),
          });
          const totalUpdates = parseInt(updateRes.recenttracks["@attr"].total);

          if (totalUpdates > 0) {
            console.log(`[LastFM] Found ${totalUpdates} new tracks`);
            const updateTracksRaw = updateRes.recenttracks.track;
            const updateTracks = Array.isArray(updateTracksRaw)
              ? updateTracksRaw
              : updateTracksRaw
              ? [updateTracksRaw]
              : [];
            await saveChunk(updateTracks, user, 0, true);
          } else {
            console.log("[LastFM] No updates found");
          }
        } catch (e) {
          console.error("[LastFM] Update check failed:", e);
        }
      }

      // Only download history if this is the first download or we have a valid resume point
      if (partFiles.length === 0 || resumeToTimestamp) {
        console.log(`[LastFM] Starting history download from part ${part}`);

        let currentChunk: LastfmTrack[] = [];
        const chunkSize = 2000;

        let activeKeyIndex = 0;
        let firstPageRes: LastfmResponse | null = null;

        for (let i = 0; i < apiKeys.length; i++) {
          try {
            firstPageRes = await fetchPage(user, 1, apiKeys[i], {
              to: resumeToTimestamp,
            });
            activeKeyIndex = i;
            break;
          } catch (e) {
            console.warn(`[LastFM] Key ${i} failed:`, e);
          }
        }

        if (firstPageRes) {
          const totalPages = parseInt(
            firstPageRes.recenttracks["@attr"].totalPages
          );
          const newTracksRaw = firstPageRes.recenttracks.track;
          const newTracks = Array.isArray(newTracksRaw)
            ? newTracksRaw
            : newTracksRaw
            ? [newTracksRaw]
            : [];

          currentChunk = [...newTracks];
          if (currentChunk.length >= chunkSize) {
            await saveChunk(currentChunk, user, part);
            part++;
            currentChunk = [];
          }

          setProgress({ current: 1, total: totalPages });

          for (let i = 2; i <= totalPages; i++) {
            try {
              const pageData = await fetchPage(
                user,
                i,
                apiKeys[activeKeyIndex],
                {
                  to: resumeToTimestamp,
                }
              );
              const pageTracksRaw = pageData.recenttracks.track;
              const pageTracks = Array.isArray(pageTracksRaw)
                ? pageTracksRaw
                : pageTracksRaw
                ? [pageTracksRaw]
                : [];

              if (pageTracks.length > 0) {
                currentChunk = [...currentChunk, ...pageTracks];
              }

              if (currentChunk.length >= chunkSize) {
                await saveChunk(currentChunk, user, part);
                part++;
                currentChunk = [];
              }
              setProgress({ current: i, total: totalPages });
            } catch (err) {
              console.error(`[LastFM] Failed to fetch page ${i}:`, err);
              activeKeyIndex = (activeKeyIndex + 1) % apiKeys.length;
              console.log(`[LastFM] Rotating to key index ${activeKeyIndex}`);
            }

            await new Promise((resolve) => setTimeout(resolve, 200));
          }

          if (currentChunk.length > 0) {
            await saveChunk(currentChunk, user, part);
          } else if (totalPages > 0 && part === 1) {
            await saveChunk([], user, part);
          }
        } else {
          console.error("All API keys failed for history download");
        }
      } else {
        console.log(
          "[LastFM] Skipping history download - all data already downloaded"
        );
      }

      console.log("[LastFM] Download session complete");

      setCreatingProfile(true);
      setProfileProgress("Loading scrobble data...");
      const allData = await loadData();
      await createProfile(allData, (msg) => setProfileProgress(msg));
      setCreatingProfile(false);
      setProfileProgress("");
    } catch (err) {
      console.error("[LastFM] Fatal error in downloadAll:", err);
      setError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setLoading(false);
    }
  };

  return {
    downloadAll,
    data,
    progress,
    loading,
    creatingProfile,
    profileProgress,
    error,
  };
};
