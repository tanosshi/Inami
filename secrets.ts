import { getSetting } from "./utils/database";
import { lastfmAPIKey as localKey } from "@/secrets.local";

export const getLastfmAPIKey = async () => {
  try {
    const dbKey = await getSetting("fm_key");
    if (dbKey && dbKey.trim().length < 3) return localKey;
    return dbKey || localKey;
  } catch {
    return localKey;
  }
};
