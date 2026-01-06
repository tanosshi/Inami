import React, { useEffect } from "react";
import { Platform } from "react-native";
import { setupAudio } from "../utils/audioSetup";

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  useEffect(() => {
    const initAudio = async () => {
      try {
        if (Platform.OS !== "web") {
          await setupAudio();
        }
      } catch (error) {
        console.error("Failed to initialize audio:", error);
      }
    };

    initAudio();
  }, []);

  return <>{children}</>;
};

export default NotificationProvider;
