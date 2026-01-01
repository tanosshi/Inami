export const FM_CONFIG = {
  toggle: {
    title: "Enable or disable last.fm integration",
    settings: [
      {
        codename: "enable_fm",
        name: "Enable Last.fm Integration",
        description:
          "Integrate with Last.fm to scrobble your tracks and enhance your recommendations",
        emoji: "lastfm",
        customEmoji: "Entypo",
        type: "toggle",
        overrides: true,
        defaultValue: false,
      },
    ],
  },
  settings: {
    title: "Last.fm Settings",
    settings: [
      {
        codename: "fm_username",
        name: "Last.fm Username",
        description: "Your Last.fm username for recommendations",
        emoji: "supervised-user-circle",
        type: "action",
        defaultValue: undefined,
      },
      {
        codename: "fm_login",
        name: "Last.fm Login",
        description: "Log in to your Last.fm account to scrobble tracks",
        emoji: "login",
        type: "action",
        defaultValue: undefined,
      },
    ],
  },
};
