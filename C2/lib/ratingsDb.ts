// lib/ratingsDb.ts
// Supabase data access layer for Beli-style rating system

import db from "../database/db";

// ============ Types ============

export type TitleType = "movie" | "tv" | "documentary" | "animated";
export type RatingCategory = "good" | "alright" | "bad";

export interface TitleInput {
  tmdb_id: number;
  tmdb_media_type: "movie" | "tv";
  title: string;
  genres: string[];
  title_type: TitleType;
  poster_path?: string | null;
}

export interface RatingRow {
  rating_id: string;
  title_id: string;
  title: string;
  genres: string[];
  category: RatingCategory;
  category_rank: number;
  global_rank: number;
  score: number | null;
  title_type: TitleType;
  tmdb_id: number;
  tmdb_media_type: "movie" | "tv";
  poster_path: string | null;
  review_title: string | null;
  review_body: string | null;
  watched_at: string | null;
}

export interface UpsertRatingPayload {
  title_id: string;
  category: RatingCategory;
  category_rank: number;
  review_title?: string | null;
  review_body?: string | null;
  user_comments?: string | null;
  watched_at?: string | null;
}

export interface Friend {
  id: string;
  name: string;
  user_id: string;
}

// ============ Title Functions ============

/**
 * Ensure a title exists in the database, creating it if necessary.
 * Returns the title_id.
 */
export async function ensureTitleExists(input: TitleInput): Promise<string> {
  const { tmdb_id, tmdb_media_type, title, genres, title_type, poster_path } =
    input;

  // Check if title already exists
  const { data: existing, error: selectError } = await db
    .from("titles")
    .select("id")
    .eq("tmdb_id", tmdb_id)
    .eq("tmdb_media_type", tmdb_media_type)
    .single();

  if (selectError && selectError.code !== "PGRST116") {
    // PGRST116 = no rows found, which is expected for new titles
    console.error("Error checking title:", selectError);
    throw selectError;
  }

  if (existing) {
    return existing.id;
  }

  // Insert new title
  const { data: inserted, error: insertError } = await db
    .from("titles")
    .insert({
      tmdb_id,
      tmdb_media_type,
      title,
      genres,
      title_type,
      poster_path,
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("Error inserting title:", insertError);
    throw insertError;
  }

  return inserted.id;
}

// ============ Rating Functions ============

/**
 * Fetch all ratings for a user, grouped by category.
 * Sorted by category_rank ascending within each category.
 */
export async function fetchUserRatingsByCategory(
  userId: string
): Promise<{ good: RatingRow[]; alright: RatingRow[]; bad: RatingRow[] }> {
  const { data, error } = await db
    .from("v_user_ratings")
    .select("*")
    .eq("user_id", userId)
    .order("category_rank", { ascending: true });

  if (error) {
    console.error("Error fetching user ratings:", error);
    throw error;
  }

  const result: { good: RatingRow[]; alright: RatingRow[]; bad: RatingRow[] } =
    {
      good: [],
      alright: [],
      bad: [],
    };

  for (const row of data || []) {
    const rating: RatingRow = {
      rating_id: row.rating_id || row.id,
      title_id: row.title_id,
      title: row.title,
      genres: row.genres || [],
      category: row.category as RatingCategory,
      category_rank: row.category_rank,
      global_rank: row.global_rank,
      score: row.score,
      title_type: row.title_type as TitleType,
      tmdb_id: row.tmdb_id,
      tmdb_media_type: row.tmdb_media_type,
      poster_path: row.poster_path,
      review_title: row.review_title,
      review_body: row.review_body,
      watched_at: row.watched_at,
    };

    if (rating.category === "good") {
      result.good.push(rating);
    } else if (rating.category === "alright") {
      result.alright.push(rating);
    } else if (rating.category === "bad") {
      result.bad.push(rating);
    }
  }

  // Sort each category by category_rank
  result.good.sort((a, b) => a.category_rank - b.category_rank);
  result.alright.sort((a, b) => a.category_rank - b.category_rank);
  result.bad.sort((a, b) => a.category_rank - b.category_rank);

  return result;
}

/**
 * Get total count of ratings for a user.
 */
export async function fetchTotalRatingCount(userId: string): Promise<number> {
  const { count, error } = await db
    .from("ratings")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching rating count:", error);
    throw error;
  }

  return count || 0;
}

/**
 * Upsert a rating at a specific rank.
 * Uses direct table operations instead of RPC for reliability.
 * Returns the rating_id.
 */
export async function upsertRatingAtRank(
  payload: UpsertRatingPayload
): Promise<string> {
  const {
    title_id,
    category,
    category_rank,
    review_title,
    review_body,
    user_comments,
    watched_at,
  } = payload;

  // Get current user
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  // Check if user already has a rating for this title
  const { data: existingRating } = await db
    .from("ratings")
    .select("id, category, category_rank")
    .eq("user_id", userId)
    .eq("title_id", title_id)
    .single();

  // Calculate global_rank based on category and category_rank
  // Good ratings are ranked first, then alright, then bad
  const { data: categoryCounts } = await db
    .from("ratings")
    .select("category")
    .eq("user_id", userId);

  let goodCount = 0;
  let alrightCount = 0;

  if (categoryCounts) {
    for (const r of categoryCounts) {
      if (r.category === "good") goodCount++;
      else if (r.category === "alright") alrightCount++;
    }
  }

  let global_rank: number;
  if (category === "good") {
    global_rank = category_rank;
  } else if (category === "alright") {
    global_rank = goodCount + category_rank;
  } else {
    // bad
    global_rank = goodCount + alrightCount + category_rank;
  }

  if (existingRating) {
    // Update existing rating
    const { data, error } = await db
      .from("ratings")
      .update({
        category,
        category_rank,
        global_rank,
        review_title: review_title || null,
        review_body: review_body || null,
        user_comments: user_comments || null,
        watched_at: watched_at || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingRating.id)
      .select("id")
      .single();

    if (error) {
      console.error("Error updating rating:", error);
      throw error;
    }

    return data.id;
  } else {
    // Insert new rating
    const { data, error } = await db
      .from("ratings")
      .insert({
        user_id: userId,
        title_id,
        category,
        category_rank,
        global_rank,
        review_title: review_title || null,
        review_body: review_body || null,
        user_comments: user_comments || null,
        watched_at: watched_at || null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error inserting rating:", error);
      throw error;
    }

    return data.id;
  }
}

// ============ Watch With Functions ============

/**
 * Set the friends a user watched a title with.
 * Replaces any existing watch-with entries for this rating.
 */
export async function setWatchedWith(
  ratingId: string,
  friendIds: string[]
): Promise<void> {
  // Delete existing entries
  const { error: deleteError } = await db
    .from("rating_watch_with")
    .delete()
    .eq("rating_id", ratingId);

  if (deleteError) {
    console.error("Error deleting watch-with entries:", deleteError);
    throw deleteError;
  }

  // Insert new entries if any
  if (friendIds.length > 0) {
    const entries = friendIds.map((friendId) => ({
      rating_id: ratingId,
      friend_id: friendId,
    }));

    const { error: insertError } = await db
      .from("rating_watch_with")
      .insert(entries);

    if (insertError) {
      console.error("Error inserting watch-with entries:", insertError);
      throw insertError;
    }
  }
}

/**
 * Get friends a rating was watched with.
 */
export async function getWatchedWith(ratingId: string): Promise<Friend[]> {
  const { data, error } = await db
    .from("rating_watch_with")
    .select("friend_id, friends(id, name)")
    .eq("rating_id", ratingId);

  if (error) {
    console.error("Error fetching watch-with:", error);
    throw error;
  }

  return (data || []).map((row: any) => ({
    id: row.friends.id,
    name: row.friends.name,
    user_id: "",
  }));
}

// ============ Friends Functions ============

/**
 * Fetch all friends for a user.
 */
export async function fetchFriends(userId: string): Promise<Friend[]> {
  const { data, error } = await db
    .from("friends")
    .select("id, name, user_id")
    .eq("user_id", userId)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching friends:", error);
    throw error;
  }

  return (data || []).map((row) => ({
    id: row.id,
    name: row.name,
    user_id: row.user_id,
  }));
}

/**
 * Create a new friend for a user.
 */
export async function createFriend(
  userId: string,
  name: string
): Promise<Friend> {
  const { data, error } = await db
    .from("friends")
    .insert({ user_id: userId, name })
    .select("id, name, user_id")
    .single();

  if (error) {
    console.error("Error creating friend:", error);
    throw error;
  }

  return {
    id: data.id,
    name: data.name,
    user_id: data.user_id,
  };
}

// ============ User Functions ============

/**
 * Get the current authenticated user ID.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const {
    data: { user },
  } = await db.auth.getUser();
  return user?.id || null;
}
