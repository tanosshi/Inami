import React, { useEffect, useState } from "react";
import { Platform } from "react-native";
import {
  initializeNotificationService,
  setupNotificationListeners,
} from "../utils/notificationService";

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const setupNotifications = async () => {
      try {
        const success = await initializeNotificationService();
        if (success) {
          const subscription = setupNotificationListeners();

          return () => {
            subscription?.remove();
          };
        }
        setIsInitialized(true);
      } catch (error) {
        console.error(error);
        setIsInitialized(true);
      }
    };

    const cleanup = setupNotifications();

    return () => {
      cleanup?.then((cleanupFn) => cleanupFn?.());
    };
  }, []);

  return <>{children}</>;
};

export default NotificationProvider;
