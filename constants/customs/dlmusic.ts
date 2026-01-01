export const DLMUSIC_CONFIG = {
  toggle: {
    title: "Enable or disable music downloading",
    settings: [
      {
        codename: "enable_dlmusic",
        name: "Enable Downloading",
        description: "Download music from online sources",
        emoji: "download",
        type: "toggle",
        defaultValue: false,
        overrides: true,
      },
    ],
  },
  provider: {
    title: "Provider",
    settings: [
      {
        codename: "dlmusic_youtube",
        name: "YouTube Music",
        description: "Download music from YouTube Music (128kbps to 256kbps)",
        emoji: "youtube-searched-for",
        type: "action",
        defaultValue: undefined,
      },
      {
        codename: "dlmusic_flac",
        name: "FLAC source",
        description: "Download flac.... (slower but better quality)",
        emoji: "cloud-download",
        type: "action",
        defaultValue: undefined,
      },
    ],
  },
  ytmconfig: {
    title: "ytdl config",
    data: [
      {
        codename: "ytdl_config",
        name: "Set custom ytdl config",
        description: "Set your custom ytdl configuration here",
        emoji: "settings-applications",
        type: "toggle",
        defaultValue: true,
      },
    ],
  },
};
