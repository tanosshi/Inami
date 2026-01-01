export const NAV_STYLE_CONFIG = {
  toggle: {
    title: "Navigation Style",
    settings: [
      {
        codename: "bottom_nav",
        name: "Bottom Navigation",
        description: "Show Navigation at the bottom",
        type: "option",
        defaultValue: true,
        overrides: true,
      },
      {
        codename: "top_nav",
        name: "Top Navigation",
        description: "Show Navigation at the top",
        type: "option",
        defaultValue: false,
        overrides: true,
      },
    ],
  },
  bottom_nav: {
    title: "Bottom Navigation",
    settings: [
      {
        codename: "navToggle",
        name: "Navigation background",
        description: "Show a background for the navigation bar",
        emoji: "flip-to-front",
        type: "toggle",
        defaultValue: true,
      },
      {
        codename: "showNavTextToggle",
        name: "Show Navigation Text",
        description: "Display of labels in the navigation bar",
        emoji: "text-fields",
        type: "toggle",
        defaultValue: true,
      },
    ],
  },
  top_nav: {
    title: "Top Navigation",
    settings: [
      {
        codename: "demo",
        name: "demo",
        description: "demo",
        emoji: "help-outline",
        type: "action",
        defaultValue: true,
      },
    ],
  },
};
