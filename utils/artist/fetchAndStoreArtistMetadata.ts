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

  fetchAndStoreComments(name);

  const db = await getDatabaseSafe();
  const existingArtist = await db.getFirstAsync<{ listeners: number | null }>(
    "SELECT listeners FROM artists WHERE name = ? COLLATE NOCASE LIMIT 1",
    [name]
  );
  let listeners: number | null = null;
  if (
    !existingArtist ||
    existingArtist.listeners === null ||
    existingArtist.listeners === 0 ||
    existingArtist.listeners < 5
  ) {
    listeners = await getListeners(name);
  } else {
    listeners = existingArtist.listeners;
  }

  const linkifiedName = artistName
    .normalize("NFKD")
    .replace(/[&,]/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "")
    .toLowerCase();

  const bandcampResult = await getImageFromBandcamp(
    "https://" +
      linkifiedName.replaceAll("-", "").replaceAll(" ", "") +
      ".bandcamp.com",
    name,
    "zero",
    "zero"
  );
  if (bandcampResult.imageUrl && !bandcampResult.error) {
    await storeArtistInDB(
      name,
      bandcampResult.mbid || null,
      bandcampResult.wikidataId || null,
      bandcampResult.imageUrl,
      listeners
    );
    return bandcampResult;
  }

  const secondTrybandcampResult = await getImageFromBandcamp(
    "https://" +
      linkifiedName.replaceAll("-", "").replaceAll(" ", "").replace("i", "") +
      ".bandcamp.com",
    name,
    "zero",
    "zero"
  );
  if (secondTrybandcampResult.imageUrl && !secondTrybandcampResult.error) {
    await storeArtistInDB(
      name,
      secondTrybandcampResult.mbid || null,
      secondTrybandcampResult.wikidataId || null,
      secondTrybandcampResult.imageUrl,
      listeners
    );
    return secondTrybandcampResult;
  }

  const tumblrResult = await getImageFromTumblr(
    linkifiedName + ".tumblr.com",
    name,
    "zero",
    "zero"
  );
  if (tumblrResult.imageUrl && !tumblrResult.error) {
    await storeArtistInDB(
      name,
      tumblrResult.mbid || null,
      tumblrResult.wikidataId || null,
      tumblrResult.imageUrl,
      listeners
    );
    return tumblrResult;
  }

  try {
    const response = await fetch(
      `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(
        name
      )}&language=en&format=json&origin=*`,
      {
        headers: {
          "User-Agent": "Inami/1.0 (https://github.com/tanosshi/inami)",
        },
      }
    );

    const contentType = response.headers.get("content-type");

    if (!response.ok || !contentType?.includes("application/json")) {
      const errorText = await response.text();
      console.error(
        `Network error or non-JSON response for ${name}:`,
        errorText
      );
      return;
    }

    const data = await response.json();
    const WikiQID = data.search?.[0]?.id;

    console.log(`QID for ${name}: ` + WikiQID);
    if (!WikiQID) return;
    const imageResult = await getImageFromWikidata(name, WikiQID, WikiQID);
    if (imageResult?.imageUrl) {
      await storeArtistInDB(
        name,
        imageResult.mbid || null,
        imageResult.wikidataId || null,
        imageResult.imageUrl,
        listeners
      );
    }
    return imageResult;
  } catch {
    //  console.error("Fetch error:", e);
  }

  // Last resort: MBID lookup (Dangerously unreliable)
  try {
    // MBID + relations (consolidated)
    const { mbid, wikidataId, tumblrUrl, bandcampUrl } =
      await getMusicBrainzRelations(name);
    if (!mbid) {
      throw new Error(`No MBID found for artist: ${name}`);
    }

    // Wikidata image
    if (wikidataId) {
      try {
        const imageResult = await getImageFromWikidata(name, mbid, wikidataId);
        let localUri: string | null = null;
        try {
          localUri = await downloadImage(imageResult.imageUrl);
        } catch (err) {
          console.warn(
            `[ArtistMeta] Failed to download wikimedia image for ${name}:`,
            err
          );
        }
        await upsertArtist({
          name,
          mbid,
          wikidata_id: wikidataId,
          image_url: localUri || imageResult.imageUrl,
          fallback_url: imageResult.imageUrl,
          listeners,
        });
        console.log(`[ArtistMeta] Artist metadata stored in DB for ${name}`);
        return {
          mbid,
          wikidataId,
          imageUrl: localUri || imageResult.imageUrl,
          name,
        };
      } catch (wikidataErr) {
        console.error(
          `[ArtistMeta] Wikidata image fetch failed, trying Tumblr fallback...`,
          wikidataErr
        );
        // Bandcamp first
        if (bandcampUrl) {
          const bandcampResult = await getImageFromBandcamp(
            bandcampUrl,
            name,
            mbid,
            wikidataId
          );
          if (bandcampResult.imageUrl) {
            await storeArtistInDB(
              name,
              mbid || null,
              wikidataId || null,
              bandcampResult.imageUrl,
              listeners
            );
            return bandcampResult;
          }
        }
        // Then Tumblr
        if (tumblrUrl) {
          const tumblrRes = await getImageFromTumblr(
            tumblrUrl,
            name,
            mbid,
            wikidataId
          );
          if (tumblrRes.imageUrl) {
            await storeArtistInDB(
              name,
              mbid || null,
              wikidataId || null,
              tumblrRes.imageUrl,
              listeners
            );
          }
          return tumblrRes;
        }
        throw wikidataErr;
      }
    } else if (bandcampUrl) {
      // Bandcamp first
      const bandcampResult = await getImageFromBandcamp(
        bandcampUrl,
        name,
        mbid,
        wikidataId
      );
      if (bandcampResult.imageUrl) {
        await storeArtistInDB(
          name,
          mbid || null,
          wikidataId || null,
          bandcampResult.imageUrl,
          listeners
        );
        return bandcampResult;
      }
      // Then Tumblr
      if (tumblrUrl) {
        const tumblrRes = await getImageFromTumblr(
          tumblrUrl,
          name,
          mbid,
          wikidataId
        );
        if (tumblrRes.imageUrl) {
          await storeArtistInDB(
            name,
            mbid || null,
            wikidataId || null,
            tumblrRes.imageUrl,
            listeners
          );
        }
        return tumblrRes;
      }
      throw new Error(
        `No Wikidata, Tumblr, or Bandcamp relation found for artist: ${name}`
      );
    } else if (tumblrUrl) {
      // Only Tumblr left
      return await getImageFromTumblr(tumblrUrl, name, mbid, wikidataId);
    } else {
      throw new Error(
        `No Wikidata, Tumblr, or Bandcamp relation found for artist: ${name}`
      );
    }
  } catch (err) {
    console.error(
      `[ArtistMeta] Error fetching artist metadata for ${name}:`,
      err
    );
    return { error: String(err), name };
  }
}

const fetchAndStoreComments = async (artistName: string) => {
  try {
    console.log(`[ArtistMeta] Fetching comments for artist: ${artistName}`);
    const comments = await getComments(artistName);

    if (comments && comments.length > 0) {
      const validComments = comments.filter(
        (
          comment
        ): comment is { userName: string; text: string; profile?: string } =>
          comment !== undefined &&
          comment !== null &&
          typeof comment.userName === "string" &&
          typeof comment.text === "string"
      );

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
  batchSize = 2
) {
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
  }
}

export { fetchAndStoreArtistMetadata, fetchAndStoreArtistMetadataBatch };
