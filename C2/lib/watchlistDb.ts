// lib/watchlistDb.ts
// Supabase data access layer for Watchlist/Bookmark feature

import db from "../database/db";
import { ensureTitleExists, getCurrentUserId, TitleType } from "./ratingsDb";

// ============ Types ============

export interface WatchlistRow {
  id: string;
  user_id: string;
  title_id: string;
  created_at: string;
}

export interface WatchlistInput {
  tmdb_id: number;
  tmdb_media_type: "movie" | "tv";
  title: string;
  genres: string[];
  title_type: TitleType;
  poster_path?: string | null;
  release_year?: number | null;
}

// ============ Watchlist Functions ============

/**
 * Check if a title is in the user's watchlist
 */
export async function isInWatchlist(
  userId: string,
  titleId: string
): Promise<boolean> {
  const { data, error } = await db
    .from("watchlist")
    .select("id")
    .eq("user_id", userId)
    .eq("title_id", titleId)
    .maybeSingle();

  if (error) {
    console.error("Error checking watchlist:", error);
    return false;
  }

  return data !== null;
}

/**
 * Check if a title is in the user's watchlist by TMDB ID
 */
export async function isInWatchlistByTmdb(
  userId: string,
  tmdbId: number,
  tmdbMediaType: "movie" | "tv"
): Promise<{ inWatchlist: boolean; titleId: string | null }> {
  // First find the title_id
  const { data: title } = await db
    .from("titles")
    .select("id")
    .eq("tmdb_id", tmdbId)
    .eq("tmdb_media_type", tmdbMediaType)
    .maybeSingle();

  if (!title) {
    return { inWatchlist: false, titleId: null };
  }

  const inWatchlist = await isInWatchlist(userId, title.id);
  return { inWatchlist, titleId: title.id };
}

/**
 * Add a title to the user's watchlist
 * Feed events are created by database trigger OR manually here
 */
export async function addToWatchlist(
  userId: string,
  titleId: string
): Promise<WatchlistRow> {
  // Insert into watchlist
  const { data: watchlistRow, error: watchlistError } = await db
    .from("watchlist")
    .insert({
      user_id: userId,
      title_id: titleId,
    })
    .select()
    .single();

  if (watchlistError) {
    if ((watchlistError as any).code === "23505") {
      const { data: existing, error: existingError } = await db
        .from("watchlist")
        .select("*")
        .eq("user_id", userId)
        .eq("title_id", titleId)
        .single();

      if (existingError) {
        console.error("Error fetching existing watchlist row:", existingError);
        throw existingError;
      }

      return existing as WatchlistRow;
    }
    console.error("Error adding to watchlist:", watchlistError);
    throw watchlistError;
  }

  // Create feed event for bookmark_added
  // Note: If you have a database trigger, comment out this section
  try {
    await db.from("feed_events").insert({
      user_id: userId,
      title_id: titleId,
      event_type: "bookmark_added",
      watchlist_id: watchlistRow.id,
    });
  } catch (feedError) {
    console.error(
      "Error creating feed event (may be handled by trigger):",
      feedError
    );
    // Don't throw - watchlist was added successfully
  }

  return watchlistRow;
}

/**
 * Remove a title from the user's watchlist
 * Also creates a feed_events entry for the removal
 */
export async function removeFromWatchlist(
  userId: string,
  titleId: string
): Promise<void> {
  // Get the watchlist row first (for feed event reference)
  const { data: existing } = await db
    .from("watchlist")
    .select("id")
    .eq("user_id", userId)
    .eq("title_id", titleId)
    .maybeSingle();

  // Delete from watchlist
  const { error: deleteError } = await db
    .from("watchlist")
    .delete()
    .eq("user_id", userId)
    .eq("title_id", titleId);

  if (deleteError) {
    console.error("Error removing from watchlist:", deleteError);
    throw deleteError;
  }

  // Create feed event for bookmark_removed
  const { error: feedError } = await db.from("feed_events").insert({
    user_id: userId,
    title_id: titleId,
    event_type: "bookmark_removed",
    watchlist_id: existing?.id || null,
  });

  if (feedError) {
    console.error("Error creating feed event for removal:", feedError);
    // Don't throw - watchlist was removed successfully
  }
}

/**
 * Toggle watchlist status for a title
 * Returns the new watchlist state
 */
export async function toggleWatchlist(
  userId: string,
  titleId: string
): Promise<{ inWatchlist: boolean; watchlistId?: string }> {
  const currentlyInWatchlist = await isInWatchlist(userId, titleId);

  if (currentlyInWatchlist) {
    await removeFromWatchlist(userId, titleId);
    return { inWatchlist: false };
  } else {
    const row = await addToWatchlist(userId, titleId);
    return { inWatchlist: true, watchlistId: row.id };
  }
}

/**
 * Toggle watchlist by TMDB ID (creates title if needed)
 */
export async function toggleWatchlistByTmdb(
  input: WatchlistInput
): Promise<{ inWatchlist: boolean; titleId: string; watchlistId?: string }> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  // Ensure title exists in database
  const titleId = await ensureTitleExists({
    tmdb_id: input.tmdb_id,
    tmdb_media_type: input.tmdb_media_type,
    title: input.title,
    genres: input.genres,
    title_type: input.title_type,
    poster_path: input.poster_path,
    release_year: input.release_year,
  });

  const result = await toggleWatchlist(userId, titleId);
  return { ...result, titleId };
}

/**
 * Get user's full watchlist
 */
export async function getUserWatchlist(userId: string): Promise<any[]> {
  const { data, error } = await db
    .from("watchlist")
    .select(
      `
      id,
      user_id,
      title_id,
      created_at,
      titles (
        id,
        tmdb_id,
        tmdb_media_type,
        title,
        genres,
        title_type,
        poster_path,
        release_year
      )
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching watchlist:", error);
    return [];
  }

  return data || [];
}

/*
 * MANUAL TEST PLAN:
 *
 * 1. Add bookmark from mediaDetails:
 *    - Navigate to a movie/show detail page
 *    - Tap the "Watchlist" button
 *    - Verify: watchlist row exists in Supabase
 *    - Verify: feed shows "[User] bookmarked [Title]" post
 *
 * 2. Remove bookmark from mediaDetails:
 *    - On same detail page, tap "Watchlist" button again
 *    - Verify: watchlist row is removed
 *    - Verify: feed shows "[User] unbookmarked [Title]" post
 *
 * 3. Bookmark from feed:
 *    - On feed, tap bookmark icon on any post
 *    - Verify: same behavior as above
 *
 * 4. Feed display:
 *    - Score badge only shows for action_type='ranked' with score != null
 *    - Bookmarked posts show user avatar + "[User] bookmarked [Title]"
 *    - Unbookmarked posts show "[User] unbookmarked [Title]"
 */
