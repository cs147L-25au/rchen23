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
  // Additional fields from search API
  overview?: string;
  vote_average?: number;
  vote_count?: number;
  release_date?: string; // Movie release date
  first_air_date?: string; // TV first air date
  // Person fields
  known_for_department?: string; // "Acting", "Directing", etc.
  gender?: number; // 1 = female, 2 = male, 0 = not specified
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

// Trending movie item
export interface TrendingMovie {
  id: number;
  title: string;
  poster_path: string | null;
  media_type: "movie" | "tv";
  overview: string;
  vote_average: number;
  vote_count: number;
}

// Detailed trending movie for the "See All" page
export interface TrendingMovieDetailed extends TrendingMovie {
  genres: string;
  runtime: string;
  release_date: string;
  release_timestamp: number; // For accurate sorting
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

  // Ensure genre mappings are loaded for displaying genres in search results
  await loadGenres();

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

// 3. Fetch trending movies from TMDB
export async function fetchTrendingMovies(
  timeWindow: "day" | "week" = "week"
): Promise<TrendingMovie[]> {
  const url = `https://api.themoviedb.org/3/trending/movie/${timeWindow}?api_key=${TMDB_API_KEY}&language=en-US`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`TMDB trending failed with status ${res.status}`);
    }

    const data = await res.json();
    const results = data.results ?? [];

    const now = new Date();
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    // Filter, sort by release date, and return only recent movies with poster images
    const filtered = results
      .filter((movie: any) => {
        if (!movie.poster_path) return false;
        if (!movie.release_date) return false;
        const releaseDate = new Date(movie.release_date);
        if (isNaN(releaseDate.getTime())) return false;
        // Must be released (not in future) and within last 2 years
        return releaseDate <= now && releaseDate >= twoYearsAgo;
      })
      .sort((a: any, b: any) => {
        const dateA = new Date(a.release_date).getTime();
        const dateB = new Date(b.release_date).getTime();
        return dateB - dateA; // Newest first
      })
      .slice(0, 10)
      .map((movie: any) => ({
        id: movie.id,
        title: movie.title ?? movie.name ?? "Unknown",
        poster_path: movie.poster_path,
        media_type: "movie" as const,
        overview: movie.overview ?? "",
        vote_average: movie.vote_average ?? 0,
        vote_count: movie.vote_count ?? 0,
      }));

    return filtered;
  } catch (err) {
    console.error("Failed to fetch trending movies:", err);
    return [];
  }
}

// 4. Fetch trending movies/TV with detailed info (genres, runtime)
// Supports pagination for infinite scroll
export async function fetchTrendingDetailed(
  page: number = 1,
  count: number = 20
): Promise<{ items: TrendingMovieDetailed[]; hasMore: boolean }> {
  // Ensure genre mappings are loaded
  await loadGenres();

  try {
    // Fetch both trending movies and TV shows with pagination
    const [moviesRes, tvRes] = await Promise.all([
      fetch(
        `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_API_KEY}&language=en-US&page=${page}`
      ),
      fetch(
        `https://api.themoviedb.org/3/trending/tv/week?api_key=${TMDB_API_KEY}&language=en-US&page=${page}`
      ),
    ]);

    const moviesData = moviesRes.ok
      ? await moviesRes.json()
      : { results: [], total_pages: 0 };
    const tvData = tvRes.ok
      ? await tvRes.json()
      : { results: [], total_pages: 0 };

    // Check if there are more pages
    const hasMore =
      page < Math.min(moviesData.total_pages ?? 1, tvData.total_pages ?? 1, 10); // Cap at 10 pages

    // Combine and mark media types
    const allItems = [
      ...(moviesData.results ?? []).map((m: any) => ({
        ...m,
        media_type: "movie",
      })),
      ...(tvData.results ?? []).map((t: any) => ({ ...t, media_type: "tv" })),
    ]
      .filter((item: any) => item.poster_path)
      .slice(0, count);

    // Fetch details for each item to get runtime
    const detailedItems = await Promise.all(
      allItems.map(async (item: any) => {
        try {
          const detailUrl = `https://api.themoviedb.org/3/${item.media_type}/${item.id}?api_key=${TMDB_API_KEY}&language=en-US`;
          const detailRes = await fetch(detailUrl);
          const details = detailRes.ok ? await detailRes.json() : null;

          // Get genres from detail response
          let genresStr = "";
          if (details?.genres && details.genres.length > 0) {
            genresStr = details.genres
              .slice(0, 3)
              .map((g: { name: string }) => g.name)
              .join(", ");
          }

          // Get runtime
          let runtimeStr = "";
          if (item.media_type === "movie" && details?.runtime) {
            runtimeStr = `${details.runtime} min`;
          } else if (item.media_type === "tv") {
            const episodeRuntime = details?.episode_run_time?.[0];
            if (episodeRuntime) {
              runtimeStr = `${episodeRuntime} min/ep`;
            } else if (details?.number_of_episodes) {
              runtimeStr = `${details.number_of_episodes} episodes`;
            }
          }

          // Get release date (format as Month Year)
          let releaseDateStr = "";
          let releaseTimestamp = 0;
          const rawDate =
            details?.release_date ?? details?.first_air_date ?? "";
          if (rawDate) {
            const date = new Date(rawDate);
            if (!isNaN(date.getTime())) {
              releaseDateStr = date.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              });
              releaseTimestamp = date.getTime();
            }
          }

          return {
            id: item.id,
            title: item.title ?? item.name ?? "Unknown",
            poster_path: item.poster_path,
            media_type: item.media_type as "movie" | "tv",
            overview: item.overview ?? "",
            vote_average: item.vote_average ?? 0,
            vote_count: item.vote_count ?? 0,
            genres: genresStr || "Genre unavailable",
            runtime: runtimeStr || "Runtime unavailable",
            release_date: releaseDateStr || "Date unavailable",
            release_timestamp: releaseTimestamp,
            _rawDate: rawDate, // For internal sorting
          };
        } catch {
          return {
            id: item.id,
            title: item.title ?? item.name ?? "Unknown",
            poster_path: item.poster_path,
            media_type: item.media_type as "movie" | "tv",
            overview: item.overview ?? "",
            vote_average: item.vote_average ?? 0,
            vote_count: item.vote_count ?? 0,
            genres: "Genre unavailable",
            runtime: "Runtime unavailable",
            release_date: "Date unavailable",
            release_timestamp: 0,
            _rawDate: "", // For internal sorting
          };
        }
      })
    );

    // Filter and sort by release date
    const now = new Date();
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    // Filter: only movies that are already released and within the last 2 years
    const filteredItems = detailedItems.filter((item) => {
      if (!item._rawDate) return false;
      const releaseDate = new Date(item._rawDate);
      if (isNaN(releaseDate.getTime())) return false;
      // Must be released (not in the future) and within last 2 years
      return releaseDate <= now && releaseDate >= twoYearsAgo;
    });

    // Sort by release date (newest first)
    filteredItems.sort((a, b) => {
      const dateA = a._rawDate ? new Date(a._rawDate).getTime() : 0;
      const dateB = b._rawDate ? new Date(b._rawDate).getTime() : 0;
      return dateB - dateA; // Descending order (newest first)
    });

    // Remove the _rawDate helper property before returning (keep release_timestamp for client sorting)
    const cleanedItems = filteredItems.map(
      ({ _rawDate, ...rest }) => rest
    ) as TrendingMovieDetailed[];

    return { items: cleanedItems, hasMore: hasMore && cleanedItems.length > 0 };
  } catch (err) {
    console.error("Failed to fetch detailed trending:", err);
    return { items: [], hasMore: false };
  }
}
