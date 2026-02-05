import { db, getDatabaseSafe, initDatabase } from "./databaseCore";

export interface TopItem {
  amount: number;
  mbid?: string;
  name: string;
  image?: string;
}

export interface Profile {
  id: number;
  username: string;
  profile_picture: string;
  country: string;
  playcount: string;
  artist_count: string;
  track_count: string;
  album_count: string;
  lastfm_url: string;
  aka?: string;
  top_artists?: TopItem[];
  top_tracks?: TopItem[];
  top_albums?: TopItem[];
}

export const getProfile = async (): Promise<Profile | null> => {
  const database = await getDatabaseSafe();
  const result: any = await database.getFirstAsync(
    `SELECT * FROM profile WHERE id = 1`
  );

  if (!result) return null;

  return {
    ...result,
    top_artists: result.top_artists ? JSON.parse(result.top_artists) : [],
    top_tracks: result.top_tracks ? JSON.parse(result.top_tracks) : [],
    top_albums: result.top_albums ? JSON.parse(result.top_albums) : [],
  };
};

export const getAllProfiles = async (): Promise<Profile[]> => {
  const database = await getDatabaseSafe();
  const results: any[] = await database.getAllAsync(`SELECT * FROM profile`);

  return results.map((result) => ({
    ...result,
    top_artists: result.top_artists ? JSON.parse(result.top_artists) : [],
    top_tracks: result.top_tracks ? JSON.parse(result.top_tracks) : [],
    top_albums: result.top_albums ? JSON.parse(result.top_albums) : [],
  }));
};

export const setTopItems = async (
  topArtists: TopItem[],
  topTracks: TopItem[],
  topAlbums: TopItem[]
) => {
  const database = await getDatabaseSafe();
  
  await database.runAsync(
    `UPDATE profile SET top_artists = ?, top_tracks = ?, top_albums = ? WHERE id = 1`,
    [
      JSON.stringify(topArtists),
      JSON.stringify(topTracks),
      JSON.stringify(topAlbums),
    ]
  );
};
