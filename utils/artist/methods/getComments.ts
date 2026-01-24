import userAgents from "../../userAgents";

function getRandomUserAgent() {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}
const userAgent = getRandomUserAgent();

function extract(html: string) {
  // Match complete shout blocks instead of splitting
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
    const icon = iconMatch?.[1].replace(/avatar\d+s/, "avatar34s") ?? "";

    // comment
    const textMatch = block.match(
      /<div class="shout-body">\s*<p>\s*([\s\S]*?)\s*<\/p>/
    );
    let text = textMatch?.[1] ?? "";

    // comment date later

    text = text
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!text || !user || user.length < 4) return;
    const result: Record<string, string> = {
      userName: user,
      text: text
        .replaceAll("&#39;", "'")
        .replaceAll("&quot;", '"')
        .replaceAll("&amp;", "&")
        .replaceAll("&lt;", "<")
        .replaceAll("&gt;", ">")
        .replace("\\", "")
        .replaceAll("\\'", "'")
        .replaceAll("&#34;", '"'),
      profile: icon,
    };
    Object.keys(result).forEach((k) => {
      if ((result as any)[k] === undefined) delete (result as any)[k];
    });
    return result;
  });
}

async function getComments(name: string) {
  name = name.replace(/\s+/g, "+");
  const url = `https://www.last.fm/music/${name}/+shoutbox?sort=popular`;

  const res = await fetch(url, {
    headers: { "User-Agent": userAgent },
  });

  const html = await res.text();
  return extract(html);
}

export { getComments };
