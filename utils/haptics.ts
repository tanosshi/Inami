import * as Haptics from "expo-haptics";
import { getSetting } from "../utils/database";

let hapticsCache: boolean | null = null;

export const triggerHaptic = async (
  style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Soft
) => {
  try {
    if (hapticsCache === null) {
      const hapticsEnabled = await getSetting("haptics");
      hapticsCache = hapticsEnabled !== false;
    }

    if (hapticsCache) await Haptics.impactAsync(style);
  } catch (error) {
    console.debug(error);
  }
};

export const clearHapticsCache = () => {
  hapticsCache = null;
};
