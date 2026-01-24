export const PLAYER_STYLE_CONFIG = {
  style: {
    title: "Player Style",
    settings: [
      {
        codename: "favor_lyrics",
        name: "Big Favour Lyrics View",
        description: "A rounded big panel to focus on lyrics",
        type: "toggle",
        defaultValue: true,
      },
      {
        codename: "default_ytm",
        name: "YouTube Music Style",
        description: "Copy the YouTube Music/Samsung Music player style",
        type: "toggle",
        defaultValue: true,
      },
    ],
  },
  options: {
    title: "Options",
    settings: [
      {
        codename: "rounded_progress_bar",
        name: "Rounded progress bar",
        description: "Show a rounded progress bar in the player",
        type: "toggle",
        defaultValue: true,
      },
    ],
  },
};
