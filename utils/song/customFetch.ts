async function customFetch(
  title: string,
  artist: string,
  url?: string
): Promise<any> {
  let lrcURL = url || "https://lyrics.lewdhutao.my.eu.org/v2/youtube/lyrics";
  async function doFetch(params: any): Promise<any> {
    let param = `?${params}`;

    const response = await fetch(lrcURL + param, {
      method: "GET",
    });

    const data = await response.json();
    return data.data;
  }

  let params = new URLSearchParams({ title, artist }).toString();

  const finalDataUrl = await doFetch(params);

  if (
    !finalDataUrl ||
    !finalDataUrl.trackName ||
    !finalDataUrl.artistName ||
    finalDataUrl?.respone?.includes("404") ||
    finalDataUrl?.respone?.includes("429")
  ) {
    params = new URLSearchParams({ title }).toString();

    const finalDataUrl = await doFetch(params);
    if (
      !finalDataUrl ||
      !finalDataUrl.trackName ||
      !finalDataUrl.artistName ||
      finalDataUrl?.respone?.includes("404") ||
      finalDataUrl?.respone?.includes("429")
    ) {
      return null;
    }
    return {
      artistName: finalDataUrl.artistName,
      trackName: finalDataUrl.trackName,
      artworkUrl: finalDataUrl.artworkUrl.replaceAll("120-", "1200-"),
      lyrics: finalDataUrl.lyrics,
    };
  }

  return {
    artistName: finalDataUrl.artistName,
    trackName: finalDataUrl.trackName,
    artworkUrl: finalDataUrl.artworkUrl.replaceAll("120-", "1200-"),
    lyrics: finalDataUrl.lyrics,
  };
}

async function metadataFetch(title: string, artist: string): Promise<any> {
  const data = await customFetch(
    title,
    artist,
    "https://lyrics.lewdhutao.my.eu.org/v2/youtube/metadata"
  );
  return {
    artistName: data?.artistName || null,
    trackName: data?.trackName || null,
    artworkUrl: data?.artworkUrl || null,
  };
}

export { customFetch, metadataFetch };
