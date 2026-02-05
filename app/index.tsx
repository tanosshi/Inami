import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { Platform } from "react-native";
import { getLandingFinished, initDatabase } from "../utils/database";

export default function Index() {
  const [isChecking, setIsChecking] = useState(true);
  const [landingFinished, setLandingFinished] = useState(false);

  useEffect(() => {
    const checkLandingStatus = async () => {
      if (Platform.OS === "web") {
        setLandingFinished(true);
        setIsChecking(false);
        return;
      }

      try {
        await initDatabase();
        const finished = await getLandingFinished();
        setLandingFinished(finished);
      } catch (error) {
        console.error("Error checking landing status:", error);
        setLandingFinished(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkLandingStatus();
  }, []);

  if (isChecking) {
    return null;
  }

  return <Redirect href={(landingFinished ? "/(tabs)" : "/landing") as any} />;
}
