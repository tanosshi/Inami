export const DLMUSIC_CONFIG = {
  toggle: {
    title: "Enable or disable music downloading",
    settings: [
      {
        codename: "enable_dlmusic",
        name: "Enable Downloading",
        description: "Download music from online sources",
        emoji: "",
        type: "toggle",
        defaultValue: false,
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
        emoji: "",
        type: "action",
        defaultValue: undefined,
      },
      {
        codename: "dlmusic_flac",
        name: "FLAC source",
        description: "Download flac.... (slower but better quality)",
        emoji: "",
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
        description:
          "set here like headers or whatever you want ill put mine here later",
        emoji: "",
        type: "toggle",
        defaultValue: true,
      },
    ],
  },
};
