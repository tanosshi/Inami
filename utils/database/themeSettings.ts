import { getDatabaseSafe } from "./databaseCore";

export const saveThemeSettings = async (
  theme: string,
  navToggle: boolean,
  showNavTextToggle: boolean
) => {
  const database = await getDatabaseSafe();

  const existing: any = await database.getFirstAsync(
    "SELECT id, theme, nav_toggle, show_nav_text_toggle FROM settings_theme WHERE id = 1"
  );

  const isBool = (v: any) => typeof v === "boolean";
  const isValidTheme = (v: any) => typeof v === "string" && v.length > 0;

  const themeValue = isValidTheme(theme) ? theme : existing?.theme ?? "Black";

  if (existing) {
    const navToggleValue = isBool(navToggle)
      ? navToggle
        ? 1
        : 0
      : existing.nav_toggle;
    const showNavTextToggleValue = isBool(showNavTextToggle)
      ? showNavTextToggle
        ? 1
        : 0
      : existing.show_nav_text_toggle;
    await database.runAsync(
      `UPDATE settings_theme 
       SET theme = ?, nav_toggle = ?, show_nav_text_toggle = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = 1`,
      [themeValue, navToggleValue, showNavTextToggleValue]
    );
  } else {
    const navToggleValue = isBool(navToggle) ? (navToggle ? 1 : 0) : 1;
    const showNavTextToggleValue = isBool(showNavTextToggle)
      ? showNavTextToggle
        ? 1
        : 0
      : 1;
    await database.runAsync(
      `INSERT INTO settings_theme (id, theme, nav_toggle, show_nav_text_toggle) 
       VALUES (1, ?, ?, ?)`,
      [themeValue, navToggleValue, showNavTextToggleValue]
    );
  }
};

export const getThemeSettings = async () => {
  try {
    const database = await getDatabaseSafe();
    const settings: any = await database.getFirstAsync(
      "SELECT * FROM settings_theme WHERE id = 1"
    );

    if (!settings) {
      return null;
    }

    return {
      theme: settings.theme || "Black",
      navToggle: settings.nav_toggle === 1,
      showNavTextToggle: settings.show_nav_text_toggle === 1,
      updatedAt: settings.updated_at,
    };
  } catch (error) {
    console.warn("Could not fetch theme settings:", error);
    return null;
  }
};

export const saveThemeSetting = async (settingName: string, value: boolean) => {
  try {
    const database = await getDatabaseSafe();

    const existing: any = await database.getFirstAsync(
      "SELECT theme, nav_toggle, show_nav_text_toggle FROM settings_theme WHERE id = 1"
    );

    if (existing) {
      let updateQuery = "";
      let updateValues = [];

      switch (settingName) {
        case "navToggle":
          updateQuery = `UPDATE settings_theme 
           SET nav_toggle = ?, updated_at = CURRENT_TIMESTAMP 
           WHERE id = 1`;
          updateValues = [value ? 1 : 0];
          break;
        case "showNavTextToggle":
          updateQuery = `UPDATE settings_theme 
           SET show_nav_text_toggle = ?, updated_at = CURRENT_TIMESTAMP 
           WHERE id = 1`;
          updateValues = [value ? 1 : 0];
          break;
        default:
          throw new Error(`Unknown theme setting: ${settingName}`);
      }

      await database.runAsync(updateQuery, updateValues);
    } else {
      const navToggleValue = settingName === "navToggle" ? (value ? 1 : 0) : 1;
      const showNavTextToggleValue =
        settingName === "showNavTextToggle" ? (value ? 1 : 0) : 1;

      await database.runAsync(
        `INSERT INTO settings_theme (id, theme, nav_toggle, show_nav_text_toggle) 
         VALUES (1, ?, ?, ?)`,
        ["Black", navToggleValue, showNavTextToggleValue]
      );
    }
  } catch (error) {
    console.warn(`Could not save theme setting ${settingName}:`, error);
    throw error;
  }
};
