export const SEARCH_CONFIG = {
  toggle: {
    title: "Enable or disable global searching",
    settings: [
      {
        codename: "enable_search",
        name: "Enable Searching",
        description: "Search for music outside of your library",
        emoji: "manage-search",
        type: "toggle",
        overrides: true,
        defaultValue: false,
      },
    ],
  },
  data: {
    title: "Search Options",
    data: [
      {
        codename: "search_way",
        name: "Always search",
        description:
          "Search for music outside of your library even when there are similar titled songs available locally",
        emoji: "saved-search",
        type: "toggle",
        defaultValue: true,
      },
      {
        codename: "search_download",
        name: "Automatically download liked songs",
        description:
          "Download songs that you like from search results to your local library",
        emoji: "downloading",
        type: "toggle",
        defaultValue: true,
      },
    ],
  },
};
