export const FM_CONFIG = {
  toggle: {
    title: "Enable or disable last.fm integration",
    settings: [
      {
        codename: "enable_fm",
        name: "Enable Last.fm Integration",
        description:
          "Integrate with Last.fm to scrobble your tracks and enhance your recommendations",
        emoji: "",
        type: "toggle",
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
        emoji: "",
        type: "action",
        defaultValue: undefined,
      },
      {
        codename: "fm_login",
        name: "Last.fm Login",
        description: "Log in to your Last.fm account to scrobble tracks",
        emoji: "",
        type: "action",
        defaultValue: undefined,
      },
    ],
  },
};
