import { Platform } from "react-native";

let Notifications: any;
let NotificationAction: any;

if (Platform.OS !== "web") {
  try {
    const expoNotifications = require("expo-notifications");
    Notifications = expoNotifications.default || expoNotifications;
    NotificationAction = expoNotifications.NotificationAction;
  } catch (error) {
    console.error("Failed to import expo-notifications:", error);
  }
}

interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  uri: string;
  artwork?: string;
  is_liked: boolean;
  play_count: number;
}

let progressUpdateInterval: ReturnType<typeof setInterval> | null = null;

if (Platform.OS !== "web" && Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export const setupNotificationChannel = async () => {
  if (Platform.OS === "web" || !Notifications) return;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("playback", {
      name: "Playback Controls",
      importance: Notifications.AndroidImportance.LOW,
      sound: "default",
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
      enableLights: true,
      enableVibrate: false,
      showBadge: false,
    });
  }
};

export const setupNotificationCategory = async () => {
  if (Platform.OS === "web" || !Notifications || !NotificationAction) return;

  try {
    await Notifications.setNotificationCategoryAsync("playback", [
      NotificationAction({
        identifier: "previous",
        buttonTitle: "Previous",
        options: {
          opensAppToForeground: false,
        },
      }),
      NotificationAction({
        identifier: "play",
        buttonTitle: "Play",
        options: {
          opensAppToForeground: false,
        },
      }),
      NotificationAction({
        identifier: "pause",
        buttonTitle: "Pause",
        options: {
          opensAppToForeground: false,
        },
      }),
      NotificationAction({
        identifier: "next",
        buttonTitle: "Next",
        options: {
          opensAppToForeground: false,
        },
      }),
    ]);
  } catch (error) {
    console.error("Error setting up notification category:", error);
  }
};

export const createNotificationContent = (
  song: Song | null,
  isPlaying: boolean,
  position: number = 0,
  duration: number = 0
) => {
  if (!song || !Notifications) {
    return null;
  }

  const progress = duration > 0 ? position / duration : 0;
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.floor(progress * 100))
  );

  const content: any = {
    title: song.title,
    body: song.artist,
    data: {
      songId: song.id,
      type: "playback",
    },
    categoryIdentifier: "playback",
  };

  if (Platform.OS === "android") {
    const androidConfig: any = {
      channelId: "playback",
      smallIcon: "@mipmap/ic_launcher",
      color: "#000000",
      ongoing: true,
      autoCancel: false,
      priority: Notifications.AndroidNotificationPriority.LOW,
      visibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      showWhen: false,
      progress: {
        max: 100,
        current: progressPercent,
        indeterminate: false,
      },
      actions: buildNotificationActions(isPlaying),
    };

    if (song.artwork) {
      androidConfig.largeIcon = song.artwork;
    }

    content.android = androidConfig;
  }

  return content;
};

const buildNotificationActions = (isPlaying: boolean): any[] => {
  const actions: any[] = [
    {
      identifier: "previous",
      buttonTitle: "Previous",
    },
    {
      identifier: isPlaying ? "pause" : "play",
      buttonTitle: isPlaying ? "Pause" : "Play",
    },
    {
      identifier: "next",
      buttonTitle: "Next",
    },
  ];

  return actions;
};

export const showPlaybackNotification = async (
  song: Song | null,
  isPlaying: boolean,
  position: number = 0,
  duration: number = 0
) => {
  if (Platform.OS === "web" || !Notifications) return null;

  try {
    const content = createNotificationContent(
      song,
      isPlaying,
      position,
      duration
    );
    if (!content) return;

    await Notifications.scheduleNotificationAsync({
      content,
      trigger: null,
      identifier: "playback-notification",
    });

    startProgressUpdates();

    return "playback-notification";
  } catch (error) {
    console.error("Error showing playback notification:", error);
  }
};

const startProgressUpdates = () => {
  if (progressUpdateInterval) {
    clearInterval(progressUpdateInterval);
    progressUpdateInterval = null;
  }

  progressUpdateInterval = setInterval(async () => {
    try {
      const playerStore =
        require("../store/playerStore").usePlayerStore.getState();
      const { currentSong, isPlaying, position, duration } = playerStore;

      if (currentSong && isPlaying) {
        const content = createNotificationContent(
          currentSong,
          isPlaying,
          position,
          duration
        );
        if (content) {
          await Notifications.scheduleNotificationAsync({
            content,
            trigger: null,
            identifier: "playback-notification",
          });
        }
      } else {
        stopProgressUpdates();
      }
    } catch (error) {
      console.error("Error updating notification progress:", error);
    }
  }, 1000);
};

const stopProgressUpdates = () => {
  if (progressUpdateInterval) {
    clearInterval(progressUpdateInterval);
    progressUpdateInterval = null;
  }
};

export const hidePlaybackNotification = async () => {
  if (Platform.OS === "web" || !Notifications) return;

  try {
    stopProgressUpdates();
    await Notifications.dismissNotificationAsync("playback-notification");
  } catch (error) {
    console.error("Error hiding playback notification:", error);
  }
};

export const updateNotificationState = async (
  currentSong?: Song | null,
  isPlaying?: boolean,
  position?: number,
  duration?: number
) => {
  if (currentSong === undefined || isPlaying === undefined) {
    try {
      const playerStore =
        require("../store/playerStore").usePlayerStore.getState();
      currentSong = playerStore.currentSong;
      isPlaying = playerStore.isPlaying;
      position = playerStore.position;
      duration = playerStore.duration;
    } catch (error) {
      console.error("Failed to get player state:", error);
      return;
    }
  }

  if (currentSong && isPlaying) {
    await showPlaybackNotification(
      currentSong,
      isPlaying,
      position || 0,
      duration || 0
    );
  } else {
    await hidePlaybackNotification();
  }
};

export const handleNotificationAction = async (action: any) => {
  let playerStore;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    playerStore = require("../store/playerStore").usePlayerStore.getState();
  } catch (error) {
    console.error("Failed to get player store:", error);
    return;
  }

  try {
    switch (action.identifier) {
      case "play":
        if (!playerStore.isPlaying) {
          await playerStore.togglePlayPause();
        }
        break;
      case "pause":
        if (playerStore.isPlaying) {
          await playerStore.togglePlayPause();
        }
        break;
      case "next":
        await playerStore.playNext();
        break;
      case "previous":
        await playerStore.playPrevious();
        break;
      default:
        console.log("Unknown notification action:", action.identifier);
    }

    await updateNotificationState();
  } catch (error) {
    console.error("Error handling notification action:", error);
  }
};

export const setupNotificationListeners = () => {
  if (Platform.OS === "web" || !Notifications) return null;

  const subscription = Notifications.addNotificationResponseReceivedListener(
    async (response: any) => {
      const { actionIdentifier } = response;

      if (
        actionIdentifier &&
        actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER
      ) {
        const action: any = {
          identifier: actionIdentifier,
          buttonTitle: actionIdentifier,
        };

        await handleNotificationAction(action);
      }
    }
  );

  return subscription;
};

export const requestNotificationPermissions = async () => {
  if (Platform.OS === "web" || !Notifications) return true;

  try {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === "granted";
  } catch (error) {
    console.error("Error requesting notification permissions:", error);
    return false;
  }
};

export const initializeNotificationService = async () => {
  if (Platform.OS === "web") {
    console.log("Notifications disabled on web");
    return true;
  }

  try {
    await setupNotificationChannel();
    await setupNotificationCategory();

    const hasPermission = await requestNotificationPermissions();

    if (hasPermission) {
      console.log("Notification service initialized successfully");
      return true;
    } else {
      console.log("Notification permission denied");
      return false;
    }
  } catch (error) {
    console.error("Error initializing notification service:", error);
    return false;
  }
};

export default {
  setupNotificationChannel,
  setupNotificationCategory,
  showPlaybackNotification,
  hidePlaybackNotification,
  updateNotificationState,
  handleNotificationAction,
  setupNotificationListeners,
  requestNotificationPermissions,
  initializeNotificationService,
};
