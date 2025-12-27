export const DISCOVERY_CONFIG = {
  toggle: {
    title: "Enable or disable discovery features",
    settings: [
      {
        codename: "enable_discovery",
        name: "Enable Discovery",
        description: "Discover new music and recommendations",
        emoji: "compass",
        type: "toggle",
        defaultValue: false,
      },
    ],
  },
  data: {
    title: "Discover",
    data: [
      {
        codename: "discovery_lastfm",
        name: "Cached Last.fm stats",
        description:
          "Expand your cached data used for discovery recommendations",
        emoji: "",
        type: "action",
        defaultValue: true,
      },
      {
        codename: "discovery_refresh",
        name: "Refresh Discoveries",
        description: "Refresh your discovery recommendations",
        emoji: "",
        type: "action",
        defaultValue: true,
      },
      {
        codename: "discovery_exclude",
        name: "Exclude",
        description:
          "Exclude certain songs or artists from discovery recommendations",
        emoji: "",
        type: "action",
        defaultValue: true,
      },
    ],
  },
};
