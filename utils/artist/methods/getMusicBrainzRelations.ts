import userAgents from "../../userAgents";

function getRandomUserAgent() {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}
const userAgent = getRandomUserAgent();

async function getMusicBrainzRelations(name: string) {
  const searchUrl = `https://musicbrainz.org/ws/2/artist?query=artist:${encodeURIComponent(
    name
  )}&fmt=json`;
  console.log(`[ArtistMeta] Searching MusicBrainz for: ${searchUrl}`);
  const searchRes = await fetch(searchUrl, {
    headers: { "User-Agent": userAgent },
  });
  if (!searchRes.ok) {
    const text = await searchRes.text().catch(() => "");
    throw new Error(
      `MusicBrainz search failed for "${name}" with status ${searchRes.status}: ${text}`
    );
  }
  const searchData = await searchRes.json();
  const mbid = searchData.artists?.[0]?.id || null;
  if (!mbid) {
    return { mbid: null, wikidataId: null, tumblrUrl: null, bandcampUrl: null };
  }

  const mbidUrl = `https://musicbrainz.org/ws/2/artist/${mbid}?inc=url-rels&fmt=json`;
  console.log(`[ArtistMeta] Fetching relations from: ${mbidUrl}`);
  const mbidRes = await fetch(mbidUrl, {
    headers: { "User-Agent": userAgent },
  });
  if (!mbidRes.ok) {
    const text = await mbidRes.text().catch(() => "");
    throw new Error(
      `MusicBrainz lookup failed for MBID ${mbid} with status ${mbidRes.status}: ${text}`
    );
  }
  const mbidData = await mbidRes.json();
  const wikidataRel = mbidData.relations?.find(
    (rel: any) => rel.type === "wikidata"
  );
  const tumblrRel = mbidData.relations?.find((rel: any) =>
    rel.url?.resource?.includes("tumblr")
  );
  const bandcampRel = mbidData.relations?.find((rel: any) =>
    rel.url?.resource?.includes("bandcamp")
  );

  return {
    mbid,
    wikidataId: wikidataRel ? wikidataRel.url.resource.split("/").pop() : null,
    tumblrUrl: tumblrRel ? tumblrRel.url.resource : null,
    bandcampUrl: bandcampRel ? bandcampRel.url.resource : null,
  };
}

export { getMusicBrainzRelations };
