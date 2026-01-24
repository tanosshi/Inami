import userAgents from "../../userAgents";

function getRandomUserAgent() {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}
const userAgent = getRandomUserAgent();

async function getImageFromWikidata(
  name: string,
  mbid: string,
  wikidataId: string
) {
  const wikidataApiUrl = `https://www.wikidata.org/wiki/Special:EntityData/${wikidataId}.json`;
  console.log(`[ArtistMeta] Fetching Wikidata entity from: ${wikidataApiUrl}`);
  try {
    const wikidataRes = await fetch(wikidataApiUrl, {
      headers: { "User-Agent": userAgent },
    });
    if (!wikidataRes.ok) {
      const errorText = await wikidataRes.text();
      console.error(`[ArtistMeta] Wikidata fetch failed:`, errorText);
      throw new Error(
        `Wikidata fetch failed with status ${wikidataRes.status}: ${errorText}`
      );
    }
    const wikidataData = await wikidataRes.json();
    const entity = wikidataData.entities[wikidataId];
    const imageClaim = entity?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
    if (!imageClaim)
      throw new Error(`No image found in Wikidata for ID: ${wikidataId}`);
    console.log(`[ArtistMeta] Found image filename: ${imageClaim}`);
    const imageUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(
      imageClaim
    )}`;
    console.log(`[ArtistMeta] Final image URL: ${imageUrl}`);

    return {
      mbid: mbid,
      wikidataId: wikidataId,
      imageUrl: imageUrl,
      name,
      source: "wikimedia",
      error: null,
    };
  } catch (err) {
    console.error(`[ArtistMeta] Error fetching Wikidata image:`, err);
    throw err;
  }
}

export { getImageFromWikidata };
