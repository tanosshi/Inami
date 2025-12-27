export const SETTINGS_CONFIG = {
  playback: {
    title: "Playback",
    settings: [
      {
        codename: "gapless_playback",
        name: "Gapless playback",
        description: "No silence between tracks",
        emoji: "queue-music",
        type: "toggle",
        defaultValue: false,
      },
      {
        codename: "fade",
        name: "Fade after song ends",
        description: "Smoothly fade out the song instead of stopping abruptly",
        emoji: "animation",
        type: "menu",
        defaultValue: true,
      },
      {
        codename: "sleep_timer",
        name: "Automatic Sleep timer",
        description:
          "Automatically set a sleep timer once a justified moment is found",
        emoji: "timer",
        type: "toggle",
        defaultValue: false,
      },
      {
        codename: "true_shuffle",
        name: "True Shuffle",
        description:
          "Shuffle songs in a truly random order instead of using an smart algorithm",
        emoji: "shuffle",
        type: "toggle",
        defaultValue: true,
      },
      {
        codename: "low_quality_audio",
        name: "Lower quality audio",
        description: "Stream at lower bitrate to save battery",
        emoji: "battery-3-bar",
        type: "toggle",
        defaultValue: false,
      },
      {
        codename: "tracking",
        name: "Tracking",
        description:
          "Disabling will disable recommendations, statistics and discovery while improving battery",
        emoji: "data-thresholding",
        type: "toggle",
        defaultValue: true,
      },
    ],
  },
  display: {
    title: "Display",
    settings: [
      {
        codename: "show_lyrics",
        name: "Show lyrics",
        description: "Display lyrics on player",
        emoji: "lyrics",
        type: "toggle",
        defaultValue: true,
      },
      {
        codename: "customize",
        name: "Customize",
        description: "Customize the app to your likings",
        emoji: "palette",
        type: "menu",
        defaultValue: null,
      },
    ],
  },
  features: {
    title: "Features",
    settings: [
      {
        codename: "lastfm",
        name: "Last.fm",
        description: "Settings related to last.fm",
        emoji: "track-changes",
        type: "menu",
        defaultValue: null,
      },
      {
        codename: "syncing",
        name: "Syncing",
        description:
          "Choose between staying online, syncing once in a while and staying offline",
        emoji: "cloud-sync",
        type: "menu",
        defaultValue: null,
      },
      {
        codename: "dlmusic",
        name: "Download Music",
        description: "Search and download music from various online sources",
        emoji: "download",
        type: "menu",
        defaultValue: null,
      },
      {
        codename: "fetch_id3",
        name: "Fetch ID3",
        description: "Automatically apply metadata tags to your local files",
        emoji: "image-search",
        type: "menu",
        defaultValue: null,
      },
      {
        codename: "discover",
        name: "Discovery",
        description: "Get recommended new music based on your taste",
        emoji: "music-video",
        type: "menu",
        defaultValue: null,
      },
      {
        codename: "search",
        name: "Search",
        description: "Search for music outside of your library",
        emoji: "zoom-in",
        type: "menu",
        defaultValue: null,
      },
    ],
  },
  storage: {
    title: "Storage",
    settings: [
      {
        codename: "compression",
        name: "Compression",
        description: "Compress cached images to save storage space",
        emoji: "photo-size-select-small",
        type: "menu",
        defaultValue: null,
      },
      {
        codename: "clear_cache",
        name: "Clear cache",
        description:
          "0 MB used (images and will be recached and music recommendations will be removed)", // todo remove the long comment we'll make a modal to delete specifics
        emoji: "delete-outline",
        type: "menu",
        defaultValue: null,
      },
    ],
  },
  about: {
    title: "About",
    settings: [
      {
        codename: "version",
        name: "Version",
        description: "0.0.1",
        emoji: "info-outline",
        type: "info",
        defaultValue: null,
      },
      {
        codename: "privacy_policy",
        name: "Privacy policy",
        description: "",
        emoji: "privacy-tip",
        type: "menu",
        defaultValue: null,
      },
      {
        codename: "terms_of_service",
        name: "Terms of service",
        description: "",
        emoji: "description",
        type: "menu",
        defaultValue: null,
      },
    ],
  },
};
