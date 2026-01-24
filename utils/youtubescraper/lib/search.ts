import _jp from "jsonpath";
import { ParserService } from "./parser.service";

const USER_AGENT =
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

const durationMap: Record<string, string> = {
  under: "EgQQARgB",
  // tslint:disable-next-line:object-literal-sort-keys
  between: "EgQQARgD",
  over: "EgQQARgC",
};

const rfc3986EncodeURIComponent = (str: string) =>
  encodeURIComponent(str).replace(/[!'()*]/g, escape);

export async function searchVideo(
  searchQuery: string,
  opts?: { duration?: "under" | "between" | "over" | string; limit?: number }
) {
  const YOUTUBE_URL = "https://www.youtube.com";

  const results = [];
  const options = { type: "video", limit: 0 };
  const limit = opts?.limit ?? 0;

  let spParam = "";
  if (opts?.duration) {
    spParam = durationMap[opts.duration] || opts.duration;
  }

  const url = `${YOUTUBE_URL}/results?q=${rfc3986EncodeURIComponent(
    searchQuery.trim()
  )}&hl=en${spParam ? "&sp=" + spParam : ""}`;

  const res = await fetch(url, {
    headers: {
      "user-agent": USER_AGENT,
    },
  });

  const html = await res.text();

  let data: any = null;
  try {
    const jsonStr = html
      .split("var ytInitialData = ")[1]
      .split(";</script>")[0];
    data = JSON.parse(jsonStr);
  } catch {
    return [];
  }

  const details = _jp.query(data, "$..itemSectionRenderer..contents[*]");
  _jp
    .query(data, "$..primaryContents..contents[*]")
    .forEach((i: any) => details.push(i));

  if (!details.length) {
    return [];
  }

  const parserService = new ParserService();

  for (const dataItem of details) {
    if (
      (options.limit > 0 && results.length >= options.limit) ||
      (limit > 0 && results.length >= limit)
    ) {
      break;
    }

    const parsed = parserService.parseVideo(dataItem);
    if (!parsed) {
      continue;
    }

    results.push(parsed);
  }

  return results;
}
