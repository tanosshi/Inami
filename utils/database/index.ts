// Database Core
export {
  initDatabase,
  getDatabase,
  getDatabaseSafe,
  db,
  saveProfile,
  getProfileItem,
} from "./databaseCore";

// Song Operations
export {
  getAllSongs,
  getSongById,
  getLikedSongs,
  addSong,
  updateSong,
  deleteSong,
  toggleLikeSong,
  incrementPlayCount,
} from "./songOperations";

// Playlist Operations
export {
  getAllPlaylists,
  getPlaylistById,
  addPlaylist,
  updatePlaylist,
  deletePlaylist,
  getPlaylistSongs,
  addSongToPlaylist,
  removeSongFromPlaylist,
} from "./playlistOperations";

// Artist Operations
export { getAllArtists, getArtist, upsertArtist } from "./artistOperations";

// Artist Comment Operations
export {
  storeArtistComments,
  getArtistComments,
  getAllArtistComments,
  deleteArtistComments,
  type ArtistComment,
} from "./artistCommentOperations";

// Song Comment Operations
export {
  storeSongComments,
  getSongComments,
  getAllSongComments,
  deleteSongComments,
  type SongComment,
} from "./songCommentOperations";

// Database Utilities
export {
  clearDatabase,
  clearSongsDatabase,
  getStats,
  mergeDuplicateArtists,
} from "./databaseUtilities";

// AsyncStorage Helpers
export {
  saveToStorage,
  getFromStorage,
  removeFromStorage,
} from "./asyncStorageHelpers";

// Theme Settings
export {
  saveThemeSettings,
  getThemeSettings,
  saveThemeSetting,
} from "./themeSettings";

// General Settings
export {
  saveSetting,
  saveSettingsBatch,
  getSetting,
  getAllSettings,
  saveTextSetting,
} from "./generalSettings";

// Music Folders
export {
  getAllMusicFolders,
  getEnabledMusicFolders,
  addMusicFolder,
  removeMusicFolder,
  toggleMusicFolder,
  getMusicFolderByUri,
  type MusicFolder,
} from "./musicFolders";
