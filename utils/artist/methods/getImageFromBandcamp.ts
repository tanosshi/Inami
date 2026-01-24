async function getImageFromBandcamp(
  bandcampUrl: string,
  name: string,
  mbid: string,
  wikidataId: string
) {
  console.log(
    `[ArtistMeta] Trying Bandcamp fallback for artist: ${name} ${bandcampUrl}`
  );

  try {
    const { getDatabaseSafe } = await import("../../database");
    const { validateImageExists } = await import("../../imageValidation");
    const db = await getDatabaseSafe();
    const existing: any = await db.getFirstAsync(
      "SELECT image_url, fallback_url FROM artists WHERE name = ? COLLATE NOCASE",
      [name]
    );
    if (existing && existing.image_url) {
      const img = String(existing.image_url);
      let exists = false;
      if (img.startsWith("http")) {
        exists = true;
      } else {
        try {
          exists = await validateImageExists(img);
        } catch {
          exists = false;
        }
      }
      console.log(exists);
    }
  } catch (e) {
    console.warn(`[ArtistMeta] DB pre-check for Bandcamp fetch failed:`, e);
  }

  if (name.length <= 3) {
    return {
      mbid,
      wikidataId,
      imageUrl: null,
      name,
      source: "tumblr",
      error: "Probability of false positive too high for short name.",
    };
  }
  if (!bandcampUrl) {
    return {
      mbid,
      wikidataId,
      imageUrl: null,
      name,
      source: "bandcamp",
      error: "No Bandcamp URL found for artist.",
    };
  }
  try {
    const res = await fetch(bandcampUrl);
    const text = await res.text();
    if (text.includes("bio-pic placeholder")) {
      return {
        mbid,
        wikidataId,
        imageUrl: null,
        name,
        source: "bandcamp",
        error: "Bandcamp page contains bio-pic placeholder.",
      };
    }
    const match = text.match(/<meta property="og:image" content="([^"]+)"/);
    if (match && match[1]) {
      return {
        mbid,
        wikidataId,
        imageUrl: match[1],
        name,
        source: "bandcamp",
        error: null,
      };
    } else {
      return {
        mbid,
        wikidataId,
        imageUrl: null,
        name,
        source: "bandcamp",
        error: "No og:image found on Bandcamp page.",
      };
    }
  } catch (err) {
    return {
      mbid,
      wikidataId,
      imageUrl: null,
      name,
      source: "bandcamp",
      error: `Bandcamp fetch failed: ${String(err)}`,
    };
  }
}

export { getImageFromBandcamp };
