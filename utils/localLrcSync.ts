import * as FileSystem from "expo-file-system/legacy";
import { getDatabaseSafe } from "./database/databaseCore";
import { updateSong } from "./database/songOperations";

const { StorageAccessFramework } = FileSystem;

const CONCURRENCY = 3;
let syncStarted = false;

function extractFilenameFromContentUri(uri: string): string {
  try {
    const decoded = decodeURIComponent(uri);
    const parts = decoded.split("/");
    const lastPart = parts[parts.length - 1] ?? "";
    if (lastPart.includes(":")) {
      const pathPart = lastPart.split(":").pop();
      if (pathPart) {
        const segments = pathPart.split("/");
        return segments[segments.length - 1] ?? pathPart;
      }
    }
    return lastPart || "unknown";
  } catch {
    return "unknown";
  }
}

function getTreeUriFromSongUri(uri: string): string | null {
  try {
    const match = uri.match(/^(content:\/\/[^/]+\/tree\/)(.+)$/);
    if (!match) return null;
    const base = match[1];
    const rawPath = match[2];
    // ? primary%3AX%2F...%2Fdocument%2F...
    const documentMarker = rawPath.includes("%2Fdocument%2F")
      ? "%2Fdocument%2F"
      : rawPath.includes("/document/")
      ? "/document/"
      : null;
    const treeId = documentMarker ? rawPath.split(documentMarker)[0] : rawPath;
    if (!treeId) return null;
    return base + treeId;
  } catch {
    return null;
  }
}

export function getLrcUriFromSongUri(uri: string): string | null {
  if (!uri || typeof uri !== "string" || uri.trim() === "") return null;
  if (uri.startsWith("content://")) return null;

  const hadFilePrefix = uri.startsWith("file://");
  const path = hadFilePrefix ? uri.slice(7) : uri;
  const lastDot = path.lastIndexOf(".");
  const base = lastDot > 0 ? path.slice(0, lastDot) : path;
  const lrcPath = base + ".lrc";
  return hadFilePrefix ? "file://" + lrcPath : lrcPath;
}

async function readLrcFromContentUri(songUri: string): Promise<string | null> {
  const treeUri = getTreeUriFromSongUri(songUri);
  if (!treeUri) {
    console.log(
      "[Local LRC] readLrcFromContentUri: no tree URI for",
      songUri?.slice(0, 80)
    );
    return null;
  }

  const audioFilename = extractFilenameFromContentUri(songUri);
  const lastDot = audioFilename.lastIndexOf(".");
  const baseName =
    lastDot > 0 ? audioFilename.slice(0, lastDot) : audioFilename;
  const lrcFilename = baseName + ".lrc";

  try {
    const childUris = await StorageAccessFramework.readDirectoryAsync(treeUri);
    const lrcUri = (childUris as string[]).find(
      (u) => extractFilenameFromContentUri(u) === lrcFilename
    );
    if (!lrcUri) {
      console.log(
        "[Local LRC] readLrcFromContentUri: no",
        lrcFilename,
        "in folder",
        treeUri?.slice(0, 80)
      );
      return null;
    }

    const content = await StorageAccessFramework.readAsStringAsync(lrcUri, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    const trimmed = typeof content === "string" ? content.trim() : "";
    if (trimmed.length === 0) {
      console.log(
        "[Local LRC] readLrcFromContentUri: empty file",
        lrcUri?.slice(0, 80)
      );
      return null;
    }
    return trimmed;
  } catch (e) {
    console.log(
      "[Local LRC] readLrcFromContentUri: error",
      treeUri?.slice(0, 60),
      e
    );
    return null;
  }
}

export async function readLocalLrcContent(
  songUri: string
): Promise<string | null> {
  if (songUri.startsWith("content://")) {
    return readLrcFromContentUri(songUri);
  }

  const lrcUri = getLrcUriFromSongUri(songUri);
  if (!lrcUri) {
    console.log(
      "[Local LRC] readLocalLrcContent: no lrcUri for songUri",
      songUri?.slice(0, 80)
    );
    return null;
  }

  try {
    const info = await (FileSystem as any).getInfoAsync(lrcUri);
    if (!info?.exists || info.isDirectory) {
      console.log(
        "[Local LRC] readLocalLrcContent: file not found or is dir",
        lrcUri?.slice(0, 80)
      );
      return null;
    }

    const content = await (FileSystem as any).readAsStringAsync(lrcUri, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    const trimmed = typeof content === "string" ? content.trim() : "";
    if (trimmed.length === 0) {
      console.log(
        "[Local LRC] readLocalLrcContent: empty file",
        lrcUri?.slice(0, 80)
      );
      return null;
    }
    console.log(
      "[Local LRC] readLocalLrcContent: read",
      trimmed.length,
      "chars from",
      lrcUri?.slice(0, 80)
    );
    return trimmed;
  } catch (e) {
    console.log(
      "[Local LRC] readLocalLrcContent: read error",
      lrcUri?.slice(0, 80),
      e
    );
    return null;
  }
}

async function processSong(row: {
  id: string;
  uri: string;
}): Promise<"updated" | "noFile" | "error"> {
  const uri = row?.uri;
  if (!uri) return "noFile";
  try {
    const content = await readLocalLrcContent(uri);
    if (content) {
      await updateSong(row.id, { lyrics: content });
      return "updated";
    } else {
      await updateSong(row.id, { lyrics: "none_final" });
      return "noFile";
    }
  } catch {
    return "error";
  }
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

export async function syncLocalLrcOnStartup(): Promise<void> {
  if (syncStarted) return;
  syncStarted = true;

  console.log("[Local LRC] syncLocalLrcOnStartup started");
  const db = await getDatabaseSafe();
  if (!db) return;

  try {
    const rows: { id: string; uri: string; lyrics: string | null }[] =
      await db.getAllAsync(
        `SELECT id, uri, lyrics FROM songs WHERE (lyrics IS NULL OR lyrics = '' OR lyrics = 'none') AND lyrics != 'none_final' AND uri IS NOT NULL AND uri != ''`
      );
    console.log("[Local LRC] Found", rows?.length ?? 0, "songs without lyrics");

    const validRows = (rows ?? []).filter((r) => r?.uri);
    const batches = chunk(validRows, CONCURRENCY);
    let updated = 0;
    let noFile = 0;
    let errors = 0;

    for (const batch of batches) {
      const results = await Promise.all(batch.map((row) => processSong(row)));
      for (const r of results) {
        if (r === "updated") updated++;
        else if (r === "noFile") noFile++;
        else errors++;
      }
    }

    console.log(
      "[Local LRC] syncLocalLrcOnStartup done. Updated:",
      updated,
      "no .lrc file:",
      noFile,
      "errors:",
      errors
    );
  } catch (e) {
    console.log("[Local LRC] syncLocalLrcOnStartup error", e);
    throw e;
  }
}
