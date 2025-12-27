export const METADATA_CONFIG = {
  toggle: {
    title: "Auto fetch Metadata",
    settings: [
      {
        codename: "enable_metadata_fetch",
        name: "Enable Auto fetching music metadata",
        description:
          "Automatically fetch metadata for your imported music library",
        emoji: "magnifying-glass",
        type: "toggle",
        defaultValue: false,
      },
    ],
  },
  sources: {
    title: "Sources",
    settings: [
      {
        codename: "metadata_source_x",
        name: "source name",
        description: "i have sources ready ill put them here later",
        emoji: "cloud",
        type: "toggle",
        defaultValue: true,
      },
    ],
  },
  settings: {
    title: "What to fetch?",
    data: [
      {
        codename: "metadata_artwork",
        name: "Artwork",
        description: "Fetch artwork",
        emoji: "",
        type: "toggle",
        defaultValue: true,
      },
      {
        codename: "metadata_genres",
        name: "Genres",
        description: "Fetch genres and year",
        emoji: "",
        type: "toggle",
        defaultValue: true,
      },
      {
        codename: "metadata_names",
        name: "Names",
        description: "Fetch song title, artist and album names",
        emoji: "",
        type: "toggle",
        defaultValue: true,
      },
      {
        codename: "metadata_lyrics",
        name: "Lyrics",
        description: "Lyrics will be downloaded as a separate .lrc file",
        emoji: "",
        type: "toggle",
        defaultValue: true,
      },
    ],
  },
};
