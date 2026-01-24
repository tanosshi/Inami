import { upsertArtist } from "../database";
import { downloadImage } from "./downloadImage";

async function storeArtistInDB(
  name: string,
  mbid: string | null,
  wikidataId: string | null,
  imageUrl: string | null,
  listeners?: number | null
) {
  if (!imageUrl) return;
  try {
    let localUri: string | null = null;
    try {
      localUri = await downloadImage(imageUrl);
    } catch (err) {
      console.warn(`[ArtistMeta] Failed to download image for ${name}:`, err);
    }

    await upsertArtist({
      name: name.replace(" - Topic", ""),
      mbid: mbid || undefined,
      wikidata_id: wikidataId || undefined,
      image_url: localUri || imageUrl,
      fallback_url: imageUrl,
      listeners,
    });
    console.log(
      `[ArtistMeta] Stored artist ${name} in DB (image: ${
        localUri || imageUrl
      })`
    );
  } catch (err) {
    console.warn(`[ArtistMeta] Failed to store artist ${name} in DB:`, err);
  }
}

export { storeArtistInDB };
