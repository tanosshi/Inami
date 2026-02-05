import { getImageFromBandcamp } from "./methods/getImageFromBandcamp";
import { getMusicBrainzRelations } from "./methods/getMusicBrainzRelations";
import { downloadImage } from "./downloadImage";
import { storeArtistInDB } from "./storeArtistInDB";
import { getImageFromWikidata } from "./methods/getImageFromWikidata";
import { getImageFromTumblr } from "./methods/getImageFromTumblr";
import { getComments } from "./methods/getComments";
import {
  getDatabaseSafe,
  storeArtistComments,
  upsertArtist,
} from "../database";
import { getListeners } from "./methods/getListeners";
async function fetchAndStoreArtistMetadata(artistName: string) {
  console.log(
    `[ArtistMeta] Starting metadata fetch for artist(s): ${artistName}`
  );

  if (artistName === "Unknown Artist" || artistName === "Various Artists") {
    return;
  }

  const name = artistName.split(/[&,]/)[0].trim();
  const db = await getDatabaseSafe();

  const existingArtist = (await db.getFirstAsync(
    "SELECT listeners, image_url, mbid, wikidata_id FROM artists WHERE name = ? COLLATE NOCASE LIMIT 1",
    [name]
  )) as
    | {
        listeners: number | null;
        image_url: string | null;
        mbid: string | null;
        wikidata_id: string | null;
      }
    | undefined;

  // Skip if we already have complete data for this artist
  if (
    existingArtist?.image_url &&
    existingArtist?.listeners &&
    existingArtist?.listeners > 5
  ) {
    console.log(`[ArtistMeta] Skipping ${name} - already has complete data`);
    return;
  }

  // Start background/parallel tasks
  const backgroundTasks: Promise<any>[] = [];

  // Non-blocking comments fetch
  if (!existingArtist?.image_url) {
    backgroundTasks.push(fetchAndStoreComments(name).catch(() => null));
  }

  // Discovery Variables
  let listeners = existingArtist?.listeners || null;
  let finalMbid = existingArtist?.mbid || null;
  let finalWikidataId = existingArtist?.wikidata_id || null;
  let imageUrl = existingArtist?.image_url || null;

  // 1) Reliable Discovery Phase (Parallel)
  const discoveryTasks: Promise<any>[] = [];

  // Listeners task
  if (!listeners || listeners < 5) {
    discoveryTasks.push(
      getListeners(name)
        .then((l) => (listeners = l))
        .catch(() => null)
    );
  }

  // Relations and Knowledge Base task
  let mbRelations: any = null;
  discoveryTasks.push(
    getMusicBrainzRelations(name)
      .then((r) => (mbRelations = r))
      .catch(() => null)
  );

  // Wikidata search task
  let wikiQIDSearch: string | null = null;
  discoveryTasks.push(
    fetch(
      `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(
        name
      )}&language=en&format=json&origin=*`,
      {
        headers: {
          "User-Agent": "Inami/1.0 (https://github.com/tanosshi/inami)",
        },
      }
    )
      .then((r) => r.json())
      .then((data) => (wikiQIDSearch = data.search?.[0]?.id))
      .catch(() => null)
  );

  await Promise.allSettled(discoveryTasks);

  finalMbid = mbRelations?.mbid || finalMbid;
  finalWikidataId = mbRelations?.wikidataId || wikiQIDSearch || finalWikidataId;

  // 2) Image Extraction Phase
  const imageTasks = [];

  // If we have wikidataId, prioritize it
  if (finalWikidataId) {
    const qid = finalWikidataId;
    imageTasks.push(
      getImageFromWikidata(name, finalMbid || qid, qid).then((res) =>
        res?.imageUrl ? res : null
      )
    );
  }

  // Prepare fallback URLs
  const linkifiedName = artistName
    .normalize("NFKD")
    .replace(/[&,]/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "")
    .toLowerCase();

  const bcUrls = [
    mbRelations?.bandcampUrl,
    `https://${linkifiedName.replace(/[- ]/g, "")}.bandcamp.com`,
    `https://${linkifiedName.replace(/[- i]/g, "")}.bandcamp.com`,
  ].filter(Boolean);

  const tmblrUrls = [
    mbRelations?.tumblrUrl,
    `${linkifiedName.replace(/[- ]/g, "")}.tumblr.com`,
  ].filter(Boolean);

  // Add Bandcamp tasks
  bcUrls.forEach((url) => {
    imageTasks.push(
      getImageFromBandcamp(
        url,
        name,
        finalMbid || "zero",
        finalWikidataId || "zero"
      ).then((res) => (res?.imageUrl ? res : null))
    );
  });

  // Add Tumblr tasks
  tmblrUrls.forEach((url) => {
    imageTasks.push(
      getImageFromTumblr(
        url,
        name,
        finalMbid || "zero",
        finalWikidataId || "zero"
      ).then((res) => (res?.imageUrl ? res : null))
    );
  });

  const imageResults = await Promise.allSettled(imageTasks);
  const successfulResult = imageResults
    .filter(
      (r): r is PromiseFulfilledResult<any> =>
        r.status === "fulfilled" && !!r.value
    )
    .map((r) => r.value)
    .sort((a, b) => {
      // Prioritize Wikidata (usually highest quality)
      if (a.wikidataId && !b.wikidataId) return -1;
      if (!a.wikidataId && b.wikidataId) return 1;
      return 0;
    })[0];

  if (successfulResult) {
    imageUrl = successfulResult.imageUrl;
    finalMbid = successfulResult.mbid || finalMbid;
    finalWikidataId = successfulResult.wikidataId || finalWikidataId;

    // Try to download image locally if it's from Wikidata/external
    try {
      if (
        imageUrl &&
        (imageUrl.includes("wikimedia") || imageUrl.includes("wikidata"))
      ) {
        const localUri = await downloadImage(imageUrl).catch(() => null);
        if (localUri) imageUrl = localUri;
      }
    } catch {}

    await storeArtistInDB(
      name,
      finalMbid || null,
      finalWikidataId || null,
      imageUrl,
      listeners
    );

    return successfulResult;
  }

  // Final attempt if nothing found yet but we have MB relations?
  // (Removed redundant nested try-catch blocks and consolidated into previous logic)

  // Wait for background tasks before finishing
  await Promise.allSettled(backgroundTasks);

  return { mbid: finalMbid, wikidataId: finalWikidataId, imageUrl, name };
}

const fetchAndStoreComments = async (artistName: string) => {
  try {
    console.log(`[ArtistMeta] Fetching comments for artist: ${artistName}`);
    const comments = await getComments(artistName);

    if (comments && comments.length > 0) {
      const validComments = comments
        .filter(
          (
            comment
          ): comment is {
            userName: string;
            text: string;
            profile?: string;
            date?: string;
          } =>
            comment !== undefined &&
            comment !== null &&
            typeof comment.userName === "string" &&
            typeof comment.text === "string"
        )
        .slice(0, 50);

      if (validComments.length > 0) {
        await storeArtistComments(artistName, validComments);
        console.log(
          `[ArtistMeta] Stored ${validComments.length} comments for ${artistName}`
        );
      } else {
        console.log(`[ArtistMeta] No valid comments found for ${artistName}`);
      }
    } else {
      console.log(`[ArtistMeta] No comments found for ${artistName}`);
    }
  } catch (error) {
    console.warn(
      `[ArtistMeta] Failed to fetch/store comments for ${artistName}:`,
      error
    );
  }
};

async function fetchAndStoreArtistMetadataBatch(
  artistNames: string[],
  batchSize = 1
) {
  console.log(
    `[ArtistMeta] Processing ${artistNames.length} artists in batches of ${batchSize}`
  );

  for (let i = 0; i < artistNames.length; i += batchSize) {
    const batch = artistNames.slice(i, i + batchSize);
    await Promise.allSettled(
      batch.map(async (artist) => {
        try {
          await fetchAndStoreArtistMetadata(artist);
        } catch (err) {
          console.warn(
            `[ArtistMeta] Failed fetching metadata for ${artist}:`,
            err
          );
        }
      })
    );

    // Add delay between batches to prevent memory buildup
    if (i + batchSize < artistNames.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  console.log(`[ArtistMeta] Completed batch processing`);
}

export { fetchAndStoreArtistMetadata, fetchAndStoreArtistMetadataBatch };
