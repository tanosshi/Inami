export const METADATA_CONFIG = {
  toggle: {
    title: "Auto fetch Metadata",
    settings: [
      {
        codename: "enable_metadata_fetch",
        name: "Enable auto fetching music metadata",
        description:
          "Automatically fetch metadata for your imported music library",
        emoji: "magnifying-glass",
        type: "toggle",
        defaultValue: false,
        overrides: true,
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
        emoji: "image",
        type: "toggle",
        defaultValue: true,
      },
      {
        codename: "metadata_genres",
        name: "Genres",
        description: "Fetch genres and year",
        emoji: "tag",
        type: "toggle",
        defaultValue: true,
      },
      {
        codename: "metadata_names",
        name: "Names",
        description: "Fetch song title, artist and album names",
        emoji: "tag-faces",
        type: "toggle",
        defaultValue: true,
      },
      {
        codename: "metadata_lyrics",
        name: "Lyrics",
        description: "Lyrics will be downloaded as a separate .lrc file",
        emoji: "lyrics",
        type: "toggle",
        defaultValue: true,
      },
    ],
  },
};
