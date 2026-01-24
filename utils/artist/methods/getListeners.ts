import userAgents from "../../userAgents";

function getRandomUserAgent() {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

const userAgent = getRandomUserAgent();

async function fromLastFM(name: string): Promise<number | null> {
  name = name.replace(/\s+/g, "+");
  const url = `https://www.last.fm/music/${name}`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": userAgent },
    });

    const html = await res.text();

    const liMatches = [
      ...html.matchAll(
        /<li[^>]*class="[^"]*header-metadata-tnew-item[^"]*"[^>]*>([\s\S]*?)<\/li>/g
      ),
    ];

    for (const match of liMatches) {
      const block = match[1];

      if (/Listeners/i.test(block)) {
        const abbrMatch = block.match(/<abbr[^>]*title="([\d,]+)"/);
        if (abbrMatch) return parseInt(abbrMatch[1].replace(/,/g, ""), 10);
      }
    }

    return null;
  } catch {
    return null;
  }
}

async function fromSoundCloud(name: string): Promise<number | null> {
  const urlName = name.replace(/\s+/g, "-");
  const url = `https://soundcloud.com/${urlName}`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Mobile; Safari)",
      },
    });

    const html = await res.text();

    const match = html.match(/"followers_count":(\d+)/);
    if (match) {
      return parseInt(match[1], 10);
    }

    return null;
  } catch {
    return null;
  }
}

async function getListeners(name: string): Promise<number | null> {
  let lastfmListeners = await fromLastFM(name);
  if (lastfmListeners !== null) return lastfmListeners;
  let soundcloudListeners = await fromSoundCloud(name);
  if (soundcloudListeners !== null) return soundcloudListeners;

  return null;
}

export { getListeners };
