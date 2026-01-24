import userAgents from "../../userAgents";

function getRandomUserAgent() {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}
const userAgent = getRandomUserAgent();

function extract(html: string) {
  const shoutRegex =
    /<li[^>]*class="[^"]*shout-list-item[^"]*"[^>]*>([\s\S]*?)<\/li>/g;
  const shouts = [...html.matchAll(shoutRegex)];

  return shouts.map((match) => {
    const block = match[1];

    // user
    const userMatch = block.match(/class="link-block-target"[^>]*>\s*([^<]+)/);
    const user = userMatch?.[1].trim() ?? "";

    // pfp
    const iconMatch = block.match(/<img[^>]+src="([^"]+avatar[^"]+)"/);
    const icon = iconMatch?.[1] ?? "";

    // comment
    const textMatch = block.match(
      /<div class="shout-body">\s*<p>\s*([\s\S]*?)\s*<\/p>/
    );
    let text = textMatch?.[1] ?? "";

    text = text
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!text || !user || user.length < 4) return;
    const result: Record<string, string> = {
      user: user,
      text: text
        .replaceAll("&#39;", "'")
        .replaceAll("&quot;", '"')
        .replaceAll("&amp;", "&")
        .replaceAll("&lt;", "<")
        .replaceAll("&gt;", ">")
        .replace("\\", "")
        .replaceAll("\\'", "'"),
      profile: icon,
    };
    Object.keys(result).forEach((k) => {
      if ((result as any)[k] === undefined) delete (result as any)[k];
    });
    return result;
  });
}

// we'll use ytm another day
async function getSongComments(artist: string, song: string) {
  artist = artist.replace(/\s+/g, "+");
  song = song.replace(/\s+/g, "+");
  const url = `https://www.last.fm/music/${artist}/_/${song}/+shoutbox?sort=popular`;

  const res = await fetch(url, {
    headers: { "User-Agent": userAgent },
  });

  const html = await res.text();
  return extract(html);
}

export { getSongComments };
