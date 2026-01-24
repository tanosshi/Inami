import userAgents from "../../userAgents";

function getRandomUserAgent() {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}
const userAgent = getRandomUserAgent();

async function getImageFromTumblr(
  tumblrUrl: string,
  name: string,
  mbid: string,
  wikidataId: string
) {
  console.log(
    `[ArtistMeta] Trying Tumblr fallback for artist: ${name} ${tumblrUrl}`
  );
  const blogIdentifier = tumblrUrl
    .replace("http://", "")
    .replace("https://", "");
  const apiUrl = `https://api.tumblr.com/v2/blog/${blogIdentifier}/avatar/512`;
  try {
    if (
      name.length <= 3 ||
      name.includes("mith") ||
      name.includes("'") ||
      name.includes("20")
    ) {
      return {
        mbid,
        wikidataId,
        imageUrl: null,
        name,
        source: "tumblr",
        error: "Probability of false positive too high for this name.",
      };
    }
    const res = await fetch(apiUrl, { headers: { "User-Agent": userAgent } });
    if (!res.ok) {
      return {
        mbid,
        wikidataId,
        imageUrl: null,
        name,
        source: "tumblr",
        error: `Tumblr fetch failed with status ${res.status}`,
      };
    }
    const imageUrl = (res as any).url || null;
    if (!imageUrl || imageUrl.includes("v2/blog")) {
      return {
        mbid,
        wikidataId,
        imageUrl: null,
        name,
        source: "tumblr",
        error: "Tumblr response did not include image URL",
      };
    }
    return {
      mbid,
      wikidataId,
      imageUrl,
      name,
      source: "tumblr",
      error: null,
    };
  } catch (err) {
    return {
      mbid,
      wikidataId,
      imageUrl: null,
      name,
      source: "tumblr",
      error: `Tumblr fetch failed: ${String(err)}`,
    };
  }
}

export { getImageFromTumblr };
