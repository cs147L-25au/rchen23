// lib/ratingsDb.ts
// Supabase data access layer for Beli-style rating system

import db from "../database/db";

// ============ Types ============

export type TitleType = "movie" | "tv" | "documentary";
export type RatingCategory = "good" | "alright" | "bad";

export interface TitleInput {
  tmdb_id: number;
  tmdb_media_type: "movie" | "tv";
  title: string;
  genres: string[];
  title_type: TitleType;
  poster_path?: string | null;
  release_year?: number | null;
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

// ============ Utility Functions ============

/**
 * Format a score for display.
 * Shows 1 decimal place normally, but 2 decimals if the second digit is non-zero.
 * Examples: 9.67 → "9.67", 9.70 → "9.7", 10.00 → "10.0"
 */
export function formatScore(score: number | null): string {
  if (score === null) return "—";

  // Round to 2 decimal places first
  const rounded = Math.round(score * 100) / 100;

  // Check if second decimal is non-zero
  const secondDecimal = Math.round((rounded * 100) % 10);

  if (secondDecimal === 0) {
    // Show 1 decimal place (e.g., 9.7, 10.0)
    return rounded.toFixed(1);
  } else {
    // Show 2 decimal places (e.g., 9.67, 9.33)
    return rounded.toFixed(2);
  }
}

// ============ Title Functions ============

/**
 * Ensure a title exists in the database, creating it if necessary.
 * Returns the title_id.
 */
export async function ensureTitleExists(input: TitleInput): Promise<string> {
  const {
    tmdb_id,
    tmdb_media_type,
    title,
    genres,
    title_type,
    poster_path,
    release_year,
  } = input;

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
      release_year,
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
  userId: string,
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
 * Get total count of ratings for a user by title_type.
 */
export async function fetchTitleTypeRatingCount(
  userId: string,
  titleType: TitleType,
): Promise<number> {
  // Use v_user_ratings view which has title_type from the titles table
  const { count, error } = await db
    .from("v_user_ratings")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("title_type", titleType);

  if (error) {
    console.error("Error fetching title_type rating count:", error);
    throw error;
  }

  return count || 0;
}

/**
 * Upsert a rating at a specific rank.
 * Properly shifts existing ratings and recalculates all ranks.
 * Returns the rating_id.
 */
export async function upsertRatingAtRank(
  payload: UpsertRatingPayload,
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

  let ratingId: string;

  if (existingRating) {
    // If moving within same category, need to handle differently
    if (existingRating.category === category) {
      // Remove from old position by setting rank very high temporarily
      await db
        .from("ratings")
        .update({ category_rank: 999999 })
        .eq("id", existingRating.id);
    } else {
      // Moving to different category - shift old category ranks down
      await db
        .from("ratings")
        .update({ category_rank: 999999 })
        .eq("id", existingRating.id);

      // Reorder old category
      await reorderCategoryRanks(userId, existingRating.category);
    }
  }

  // Shift existing ratings in target category to make room
  // All items at position >= category_rank need to move down by 1
  const { data: ratingsToShift } = await db
    .from("ratings")
    .select("id, category_rank")
    .eq("user_id", userId)
    .eq("category", category)
    .gte("category_rank", category_rank)
    .neq("category_rank", 999999)
    .order("category_rank", { ascending: false });

  if (ratingsToShift && ratingsToShift.length > 0) {
    // Shift each rating down by 1, starting from highest rank to avoid conflicts
    for (const rating of ratingsToShift) {
      await db
        .from("ratings")
        .update({ category_rank: rating.category_rank + 1 })
        .eq("id", rating.id);
    }
  }

  if (existingRating) {
    // Update existing rating with new position
    const { data, error } = await db
      .from("ratings")
      .update({
        category,
        category_rank,
        global_rank: 1, // Will be recalculated
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
    ratingId = data.id;
  } else {
    // Insert new rating
    const { data, error } = await db
      .from("ratings")
      .insert({
        user_id: userId,
        title_id,
        category,
        category_rank,
        global_rank: 1, // Will be recalculated
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
    ratingId = data.id;
  }

  // Recalculate all global ranks for this user
  await recalculateGlobalRanks(userId);

  return ratingId;
}

/**
 * Reorder category ranks to be sequential (1, 2, 3, ...)
 */
async function reorderCategoryRanks(
  userId: string,
  category: RatingCategory,
): Promise<void> {
  const { data: ratings } = await db
    .from("ratings")
    .select("id, category_rank")
    .eq("user_id", userId)
    .eq("category", category)
    .neq("category_rank", 999999)
    .order("category_rank", { ascending: true });

  if (!ratings) return;

  for (let i = 0; i < ratings.length; i++) {
    const newRank = i + 1;
    if (ratings[i].category_rank !== newRank) {
      await db
        .from("ratings")
        .update({ category_rank: newRank })
        .eq("id", ratings[i].id);
    }
  }
}

/**
 * Calculate evenly distributed score within a category range.
 * @param index - 0-based index within the category (0 = best in category)
 * @param count - total items in the category
 * @param maxScore - top score for category (e.g., 10.0 for good)
 * @param minScore - bottom score for category (e.g., 7.0 for good)
 * @returns score rounded to 2 decimal places
 */
function calculateCategoryScore(
  index: number,
  count: number,
  maxScore: number,
  minScore: number,
): number {
  if (count === 1) {
    return maxScore; // Single item gets top score
  }
  const range = maxScore - minScore;
  const score = maxScore - (index * range) / (count - 1);
  // Round to 2 decimal places for storage
  return Math.round(score * 100) / 100;
}

/**
 * Recalculate global ranks and scores for all ratings.
 * Order: all "good" by category_rank, then all "alright", then all "bad"
 *
 * Score ranges per category:
 * - Good: 10.0 to 7.0
 * - Alright: 6.9 to 4.0
 * - Bad: 3.9 to 1.0
 *
 * Scores are evenly distributed within each category.
 * Scores are only set when user has >= 10 total ratings for that title_type.
 */
async function recalculateGlobalRanks(userId: string): Promise<void> {
  // Use v_user_ratings view so we can access title_type
  const { data: ratingRows, error } = await db
    .from("v_user_ratings")
    .select("rating_id, category, category_rank, title_type")
    .eq("user_id", userId)
    .neq("category_rank", 999999)
    .order("category_rank", { ascending: true });

  if (error) {
    console.error("Error fetching ratings for score recalculation:", error);
    return;
  }

  const rows = ratingRows || [];
  const good = rows.filter((r) => r.category === "good");
  const alright = rows.filter((r) => r.category === "alright");
  const bad = rows.filter((r) => r.category === "bad");

  const totalByType = new Map<TitleType, number>();
  const goodCountByType = new Map<TitleType, number>();
  const alrightCountByType = new Map<TitleType, number>();
  const badCountByType = new Map<TitleType, number>();

  const allRatings = [...good, ...alright, ...bad];
  for (const rating of allRatings) {
    const type = rating.title_type as TitleType;
    totalByType.set(type, (totalByType.get(type) || 0) + 1);
  }
  for (const rating of good) {
    const type = rating.title_type as TitleType;
    goodCountByType.set(type, (goodCountByType.get(type) || 0) + 1);
  }
  for (const rating of alright) {
    const type = rating.title_type as TitleType;
    alrightCountByType.set(type, (alrightCountByType.get(type) || 0) + 1);
  }
  for (const rating of bad) {
    const type = rating.title_type as TitleType;
    badCountByType.set(type, (badCountByType.get(type) || 0) + 1);
  }

  // Score ranges for each category
  const SCORE_RANGES = {
    good: { max: 10.0, min: 7.0 },
    alright: { max: 6.9, min: 4.0 },
    bad: { max: 3.9, min: 1.0 },
  };

  let globalRank = 1;
  const goodIndexByType = new Map<TitleType, number>();
  const alrightIndexByType = new Map<TitleType, number>();
  const badIndexByType = new Map<TitleType, number>();

  // Update good ratings
  for (let i = 0; i < good.length; i++) {
    const type = good[i].title_type as TitleType;
    const index = goodIndexByType.get(type) || 0;
    const count = goodCountByType.get(type) || 0;
    const score = calculateCategoryScore(
      index,
      count,
      SCORE_RANGES.good.max,
      SCORE_RANGES.good.min,
    );
    goodIndexByType.set(type, index + 1);

    await db
      .from("ratings")
      .update({ global_rank: globalRank, score })
      .eq("id", good[i].rating_id);

    globalRank++;
  }

  // Update alright ratings
  for (let i = 0; i < alright.length; i++) {
    const type = alright[i].title_type as TitleType;
    const index = alrightIndexByType.get(type) || 0;
    const count = alrightCountByType.get(type) || 0;
    const score = calculateCategoryScore(
      index,
      count,
      SCORE_RANGES.alright.max,
      SCORE_RANGES.alright.min,
    );
    alrightIndexByType.set(type, index + 1);

    await db
      .from("ratings")
      .update({ global_rank: globalRank, score })
      .eq("id", alright[i].rating_id);

    globalRank++;
  }

  // Update bad ratings
  for (let i = 0; i < bad.length; i++) {
    const type = bad[i].title_type as TitleType;
    const index = badIndexByType.get(type) || 0;
    const count = badCountByType.get(type) || 0;
    const score = calculateCategoryScore(
      index,
      count,
      SCORE_RANGES.bad.max,
      SCORE_RANGES.bad.min,
    );
    badIndexByType.set(type, index + 1);

    await db
      .from("ratings")
      .update({ global_rank: globalRank, score })
      .eq("id", bad[i].rating_id);

    globalRank++;
  }
}

// ============ Watch With Functions ============

/**
 * Set the friends a user watched a title with.
 * Replaces any existing watch-with entries for this rating.
 */
export async function setWatchedWith(
  ratingId: string,
  friendIds: string[],
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
  name: string,
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
