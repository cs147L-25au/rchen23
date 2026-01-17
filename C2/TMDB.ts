// upload API key
const TMDB_API_KEY = "b6a79cf2e43d2d321e6bba3ca5b02c63";

// Search result item from /search/multi
export interface TMDBMediaResult {
  id: number;
  media_type: "movie" | "tv" | "person";
  name?: string; // TV or person
  title?: string; // Movie
  poster_path?: string | null;
  profile_path?: string | null;
  genre_ids?: number[];
}

// Genre mapping cache
let movieGenreMap: Record<number, string> = {};
let tvGenreMap: Record<number, string> = {};
let genresLoaded = false;

// Types for details view
interface TMDBCastMember {
  name: string;
  character?: string;
}

interface TMDBCrewMember {
  name: string;
  job: string;
}

// What MovieDetailsScreen cares about
export interface TMDBDetailsData {
  posterUrl: string | null;
  title: string;
  year: string;
  overview: string;
  runtimeMinutes?: number;
  rating?: number;
  director?: string;
  topCast: string[];
}

export interface TMDBSearchResponse {
  results: TMDBMediaResult[];
}

// helper to build image URL
export function getPosterUrl(
  posterPath?: string | null,
  profilePath?: string | null
): string | null {
  const path = posterPath ?? profilePath ?? null;
  if (!path) return null;
  // w342 is good for detail, not too huge
  return `https://image.tmdb.org/t/p/w342${path}`;
}

// Load genre mappings from TMDB
async function loadGenres(): Promise<void> {
  if (genresLoaded) return;

  try {
    const [movieRes, tvRes] = await Promise.all([
      fetch(
        `https://api.themoviedb.org/3/genre/movie/list?api_key=${TMDB_API_KEY}&language=en-US`
      ),
      fetch(
        `https://api.themoviedb.org/3/genre/tv/list?api_key=${TMDB_API_KEY}&language=en-US`
      ),
    ]);

    if (movieRes.ok) {
      const movieData = await movieRes.json();
      movieData.genres?.forEach((g: { id: number; name: string }) => {
        movieGenreMap[g.id] = g.name;
      });
    }

    if (tvRes.ok) {
      const tvData = await tvRes.json();
      tvData.genres?.forEach((g: { id: number; name: string }) => {
        tvGenreMap[g.id] = g.name;
      });
    }

    genresLoaded = true;
  } catch (err) {
    console.error("Failed to load TMDB genres:", err);
  }
}

// Convert genre IDs to names
export function getGenreNames(
  genreIds: number[],
  mediaType: "movie" | "tv"
): string[] {
  const map = mediaType === "movie" ? movieGenreMap : tvGenreMap;
  return genreIds
    .map((id) => map[id] || movieGenreMap[id] || tvGenreMap[id])
    .filter(Boolean);
}

// Search for a movie/TV show by name and return genres
export async function getGenresForTitle(title: string): Promise<string> {
  if (!title || title.trim().length === 0) {
    return "Genres unavailable";
  }

  try {
    // Ensure genres are loaded
    await loadGenres();

    // Search for the title
    const results = await searchTMDB(title);

    // Find the first movie or TV result
    const match = results.find(
      (r) => r.media_type === "movie" || r.media_type === "tv"
    );

    if (!match || !match.genre_ids || match.genre_ids.length === 0) {
      return "Genres unavailable";
    }

    const genreNames = getGenreNames(
      match.genre_ids,
      match.media_type as "movie" | "tv"
    );
    return genreNames.length > 0 ? genreNames.join(", ") : "Genres unavailable";
  } catch (err) {
    console.error("Failed to get genres for:", title, err);
    return "Genres unavailable";
  }
}

// 1. search API: /search/multi
export async function searchTMDB(query: string): Promise<TMDBMediaResult[]> {
  if (!query || query.trim().length === 0) {
    return [];
  }

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

// 2. detail API: /movie/{id}?append_to_response=credits OR /tv/{id}?append_to_response=credits
export async function fetchDetails(
  id: number,
  mediaType: "movie" | "tv"
): Promise<TMDBDetailsData> {
  const baseUrl =
    mediaType === "movie"
      ? `https://api.themoviedb.org/3/movie/${id}`
      : `https://api.themoviedb.org/3/tv/${id}`;

  const url = `${baseUrl}?api_key=${TMDB_API_KEY}&language=en-US&append_to_response=credits`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`TMDB details failed with status ${res.status}`);
  }

  const data = await res.json();

  // title and year
  const title =
    data.title ?? data.name ?? data.original_title ?? data.original_name ?? "";

  const dateStr = data.release_date ?? data.first_air_date ?? "";
  const year = dateStr ? dateStr.slice(0, 4) : "";

  // poster
  const posterUrl = getPosterUrl(data.poster_path, null);

  // rating (TMDB vote_average is /10)
  const rating =
    typeof data.vote_average === "number" ? data.vote_average : undefined;

  // runtime (movies: runtime, tv: episode_run_time[0])
  let runtimeMinutes: number | undefined = undefined;
  if (typeof data.runtime === "number") {
    runtimeMinutes = data.runtime;
  } else if (
    Array.isArray(data.episode_run_time) &&
    data.episode_run_time.length > 0
  ) {
    runtimeMinutes = data.episode_run_time[0];
  }

  // director (crew[].job === "Director", fallback "Executive Producer")
  let director: string | undefined = undefined;
  if (data.credits && Array.isArray(data.credits.crew)) {
    const dirEntry: TMDBCrewMember | undefined = data.credits.crew.find(
      (crewMember: TMDBCrewMember) =>
        crewMember.job === "Director" || crewMember.job === "Executive Producer"
    );
    if (dirEntry) {
      director = dirEntry.name;
    }
  }

  // cast (top ~5 names)
  let topCast: string[] = [];
  if (data.credits && Array.isArray(data.credits.cast)) {
    topCast = data.credits.cast
      .slice(0, 5)
      .map((castMember: TMDBCastMember) => castMember.name);
  }

  return {
    posterUrl,
    title,
    year,
    overview: data.overview ?? "",
    runtimeMinutes,
    rating,
    director,
    topCast,
  };
}
