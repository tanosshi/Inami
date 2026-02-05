/*
  - Only use web for UI.
  - All database operations are no-ops on web.
*/

// Database Core
export const initDatabase = async () => {};
export const getDatabase = () => null;
export const getDatabaseSafe = async () => null;
export const db = null;
export const saveProfile = async () => {};
export const getProfileItem = async () => null;

// Song Operations
export const getAllSongs = async () => [];
export const getSongById = async () => null;
export const getLikedSongs = async () => [];
export const addSong = async () => {};
export const updateSong = async () => {};
export const deleteSong = async () => {};
export const toggleLikeSong = async () => {};
export const incrementPlayCount = async () => {};

// Playlist Operations
export const getAllPlaylists = async () => [];
export const getPlaylistById = async () => null;
export const addPlaylist = async () => {};
export const updatePlaylist = async () => {};
export const deletePlaylist = async () => {};
export const getPlaylistSongs = async () => [];
export const addSongToPlaylist = async () => {};
export const removeSongFromPlaylist = async () => {};

// Artist Operations
export const getAllArtists = async () => [];
export const getArtist = async () => null;
export const upsertArtist = async () => {};

// Artist Comment Operations
export const storeArtistComments = async () => {};
export const getArtistComments = async () => [];
export const getAllArtistComments = async () => [];
export const deleteArtistComments = async () => {};
export type ArtistComment = any;

// Song Comment Operations
export const storeSongComments = async () => {};
export const getSongComments = async () => [];
export const getAllSongComments = async () => [];
export const deleteSongComments = async () => {};
export type SongComment = any;

// Listening History Operations
export const addListeningHistoryEntry = async () => {};
export const addListeningHistoryBatch = async () => {};
export const getListeningHistory = async () => [];
export const getListeningHistoryByArtist = async () => [];
export const getListeningHistoryByTrack = async () => [];
export const getListeningHistoryCount = async () => 0;
export const clearListeningHistory = async () => {};
export type ListeningHistoryEntry = any;

// Database Utilities
export const clearDatabase = async () => {};
export const clearSongsDatabase = async () => {};
export const getStats = async () => ({
  total_songs: 0,
  liked_songs: 0,
  total_playlists: 0,
  total_play_count: 0,
});
export const mergeDuplicateArtists = async () => {};

// AsyncStorage Helpers
export const saveToStorage = async () => {};
export const getFromStorage = async () => null;
export const removeFromStorage = async () => {};

// Theme Settings
export const saveThemeSettings = async () => {};
export const getThemeSettings = async () => ({});
export const saveThemeSetting = async () => {};

// General Settings
export const saveSetting = async () => {};
export const saveSettingsBatch = async () => {};
export const getSetting = async () => null;
export const getAllSettings = async () => ({});
export const saveTextSetting = async () => {};

// Music Folders
export const getAllMusicFolders = async () => [];
export const getEnabledMusicFolders = async () => [];
export const addMusicFolder = async () => {};
export const removeMusicFolder = async () => {};
export const toggleMusicFolder = async () => {};
export const getMusicFolderByUri = async () => null;
export type MusicFolder = any;
