import { getSetting } from "./utils/database";
import {
  lastfmAPIKey as localKey,
  backupLastfmAPIKey as backupLastfmAPIKey,
} from "@/secrets.local";

export const getLastfmAPIKeys = async (): Promise<string[]> => {
  const keys = [localKey];
  try {
    const dbKey = await getSetting("fm_key");
    if (dbKey && dbKey.trim().length >= 3) {
      keys.unshift(dbKey);
    }
  } catch {}
  if (backupLastfmAPIKey) {
    keys.push(backupLastfmAPIKey);
  }
  return keys;
};

export const getLastfmAPIKey = async () => {
  const keys = await getLastfmAPIKeys();
  return keys[0];
};
