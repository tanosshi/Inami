// Credits to https://github.com/appit-online/youtube-search/tree/master?tab=readme-ov-file#license
// will be put in docs and removed from here later

import { searchVideo } from "./lib/search";

export function search(
  searchQuery: string,
  opts?: {
    duration?: "under" | "between" | "over" | string;
    limit?: number;
  }
) {
  return searchVideo(searchQuery, opts);
}
