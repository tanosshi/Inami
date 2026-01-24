import * as FileSystem from "expo-file-system/legacy";

import userAgents from "../userAgents";
function getRandomUserAgent() {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}
const userAgent = getRandomUserAgent();

async function downloadImage(url: string): Promise<string> {
  console.log(`downloadImage: ${url}`);
  if (!url) throw new Error("No URL provided");

  const res = await fetch(url, { headers: { "User-Agent": userAgent } });
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

  const dir = (FileSystem as any).documentDirectory + "images/albumImages/";
  try {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  } catch {}

  const filename = `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}${ext}`;
  const fileUri = dir + filename;

  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString("base64");
  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: "base64",
  } as any);

  return fileUri;
}

export { downloadImage };
