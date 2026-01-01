export const SYNC_CONFIG = {
  toggle: {
    title: "Enable or disable syncing",
    settings: [
      {
        codename: "enable_sync",
        name: "Enable Syncing",
        description: "Sync your data across devices using cloud storage",
        emoji: "cloud-sync",
        type: "toggle",
        overrides: true,
        defaultValue: false,
      },
    ],
  },
  provider: {
    title: "Provider",
    settings: [
      {
        codename: "sync_google_drive",
        name: "Google Drive Sync",
        description: "Sync your data with Google Drive",
        emoji: "cloud",
        type: "action",
        defaultValue: undefined,
      },
      {
        codename: "sync_tanosshi",
        name: "tanos's server",
        description: "Sync your data with tanos's server (unreliable)",
        emoji: "people",
        type: "action",
        defaultValue: undefined,
      },
    ],
  },
  data: {
    title: "Data to Sync",
    data: [
      {
        codename: "sync_full",
        name: "Full Sync",
        description:
          "Sync your entire music library including all collected data",
        emoji: "open-in-full",
        type: "toggle",
        defaultValue: true,
      },
      {
        codename: "sync_music",
        name: "Music Sync",
        description: "Sync your music library, favorites and playlists",
        emoji: "library-music",
        type: "toggle",
        defaultValue: true,
      },
      {
        codename: "sync_playcounts",
        name: "Playcounts Sync",
        description: "Sync your music playcounts",
        emoji: "chart-bar",
        type: "toggle",
        defaultValue: true,
      },
      {
        codename: "sync_history",
        name: "History Sync",
        description: "Sync your music listening history",
        emoji: "history",
        type: "toggle",
        defaultValue: true,
      },
    ],
  },
};
