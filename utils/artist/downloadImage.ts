import * as FileSystem from "expo-file-system/legacy";

import userAgents from "../userAgents";

function getRandomUserAgent() {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}
const userAgent = getRandomUserAgent();

function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = 7000
): Promise<Response> {
  return Promise.race([
    fetch(url, options),
    new Promise<Response>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Image download timeout after ${timeoutMs}ms`)),
        timeoutMs
      )
    ),
  ]);
}

async function downloadImage(url: string): Promise<string> {
  const res = await fetchWithTimeout(
    url,
    { headers: { "User-Agent": userAgent } },
    7000
  );
  if (!res.ok) {
    throw new Error(`Image download failed with status ${res.status}`);
  }

  const arrayBuffer = await res.arrayBuffer();

  const contentType =
    (res.headers && res.headers.get && res.headers.get("content-type")) || "";
  let ext = ".jpg";
  if (contentType.includes("png")) ext = ".png";
  else if (contentType.includes("webp")) ext = ".webp";
  else if (contentType.includes("gif")) ext = ".gif";
  else if (contentType.includes("jpeg")) ext = ".jpg";

  const relativePath = `images/artistImages/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}${ext}`;

  const fullUri = (FileSystem as any).documentDirectory + relativePath;
  const dir = (FileSystem as any).documentDirectory + "images/artistImages/";

  try {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  } catch {}

  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString("base64");
  await FileSystem.writeAsStringAsync(fullUri, base64, {
    encoding: "base64",
  } as any);

  return relativePath;
}

export { downloadImage };
