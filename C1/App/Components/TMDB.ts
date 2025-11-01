// upload API key
const TMDB_API_KEY = "b6a79cf2e43d2d321e6bba3ca5b02c63"; // replace with your key for now

export interface TMDBMediaResult {
  id: number;
  media_type: "movie" | "tv" | "person";
  name?: string; // for TV / person
  title?: string; // for movie
  poster_path?: string | null;
  profile_path?: string | null; // for people
}

export interface TMDBSearchResponse {
  results: TMDBMediaResult[];
}

export async function searchTMDB(query: string): Promise<TMDBMediaResult[]> {
  if (!query || query.trim().length === 0) {
    return [];
  }

  // encodeURIComponent is important so "star wars" doesn't break the URL
  const url = `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&language=en-US&include_adult=false&query=${encodeURIComponent(
    query.trim()
  )}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`TMDB search failed with status ${res.status}`);
  }

  const data: TMDBSearchResponse = await res.json();
  return data.results;
}

// TMDB gives you just "/abc123.jpg". This builds a full usable image URL.
export function getPosterUrl(
  posterPath?: string | null,
  profilePath?: string | null
): string | null {
  const path = posterPath ?? profilePath ?? null;
  if (!path) return null;
  // w185 is a good small-ish size for list items
  return `https://image.tmdb.org/t/p/w185${path}`;
}
