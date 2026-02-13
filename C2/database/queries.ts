import db from "./db";

const SCORE_UNLOCK_COUNT = 10;

export interface Profile {
  id: string;
  display_name: string;
  profile_pic: string | null;
}

// Rating from v_user_ratings view
export type RatingPost = {
  rating_id: string;
  title_id: string;
  user_id: string;
  title: string;
  genres: string[];
  category: string;
  category_rank: number;
  global_rank: number;
  score: number | null;
  title_type: string;
  tmdb_id: number;
  tmdb_media_type: string;
  poster_path: string | null;
  review_title: string | null;
  review_body: string | null;
  watched_at: string | null;
  created_at: string;
  updated_at: string;
};

// Feed item from v_feed view
export type FeedEvent = {
  event_id: string;
  created_at: string;
  action_type: "ranked" | "bookmarked" | "unbookmarked";
  user_id: string;
  display_name: string;
  profile_pic: string | null;
  title_id: string;
  title: string;
  genres: string[];
  title_type: string;
  tmdb_id: number;
  tmdb_media_type: string;
  poster_path: string | null;
  // Rating fields (only present for action_type='ranked')
  rating_id: string | null;
  category: string | null;
  category_rank: number | null;
  global_rank: number | null;
  score: number | null;
  review_title: string | null;
  review_body: string | null;
};

// Legacy type for backward compatibility
export type FeedRating = RatingPost & {
  user_display_name: string;
  user_profile_pic: string | null;
};

type UserTypeCountMap = Map<string, Map<string, number>>;

const buildUserTypeCountMap = (
  rows: Array<{ user_id: string; title_type: string }>,
): UserTypeCountMap => {
  const map: UserTypeCountMap = new Map();
  rows.forEach((row) => {
    if (!row.user_id || !row.title_type) return;
    const userMap = map.get(row.user_id) ?? new Map<string, number>();
    userMap.set(row.title_type, (userMap.get(row.title_type) ?? 0) + 1);
    map.set(row.user_id, userMap);
  });
  return map;
};

const shouldShowScore = (
  userTypeCountMap: UserTypeCountMap,
  userId: string,
  titleType: string,
) => {
  const count = userTypeCountMap.get(userId)?.get(titleType) ?? 0;
  return count >= SCORE_UNLOCK_COUNT;
};

const maskScoresForRatings = (ratings: RatingPost[]): RatingPost[] => {
  const counts = buildUserTypeCountMap(ratings);
  return ratings.map((rating) => {
    if (!shouldShowScore(counts, rating.user_id, rating.title_type)) {
      return { ...rating, score: null };
    }
    return rating;
  });
};

const maskScoresForFeedEvents = (
  events: FeedEvent[],
  counts: UserTypeCountMap,
): FeedEvent[] =>
  events.map((event) => {
    if (
      event.action_type === "ranked" &&
      event.score !== null &&
      !shouldShowScore(counts, event.user_id, event.title_type)
    ) {
      return { ...event, score: null };
    }
    return event;
  });

const fetchUserTypeCounts = async (
  userIds: string[],
): Promise<UserTypeCountMap> => {
  if (userIds.length === 0) return new Map();
  const { data, error } = await db
    .from("v_user_ratings")
    .select("user_id, title_type")
    .in("user_id", userIds);

  if (error) {
    console.error("Error fetching rating counts:", error.message);
    return new Map();
  }
  return buildUserTypeCountMap(
    (data as Array<{ user_id: string; title_type: string }>) || [],
  );
};

// Fetch all ratings from v_user_ratings view
export const getAllRatings = async (): Promise<RatingPost[]> => {
  try {
    const { data, error } = await db
      .from("v_user_ratings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error details:", error.message);
      throw error;
    }
    const ratings = (data as RatingPost[]) || [];
    return maskScoresForRatings(ratings);
  } catch (error: any) {
    console.error("Error fetching ratings:", error?.message || error);
    return [];
  }
};

// Fetch feed from v_feed view (includes ratings + bookmarks)
// Excludes the current user's own events (they see those in Recent Activity instead)
export const getFeedEvents = async (
  excludeUserId?: string | null,
): Promise<FeedEvent[]> => {
  try {
    let query = db
      .from("v_feed")
      .select("*")
      .order("created_at", { ascending: false });

    // Exclude the current user's own events from the main feed
    if (excludeUserId) {
      query = query.neq("user_id", excludeUserId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching feed:", error.message);
      throw error;
    }

    const events = (data as FeedEvent[]) || [];
    const userIds = [...new Set(events.map((event) => event.user_id))];
    const counts = await fetchUserTypeCounts(userIds);
    return maskScoresForFeedEvents(events, counts);
  } catch (error: any) {
    console.error("Error fetching feed events:", error?.message || error);
    return [];
  }
};

// Fetch feed events for a specific user
export const getUserFeedEvents = async (
  userId: string,
): Promise<FeedEvent[]> => {
  try {
    const { data, error } = await db
      .from("v_feed")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching user feed events:", error.message);
      throw error;
    }

    const events = (data as FeedEvent[]) || [];
    const counts = await fetchUserTypeCounts([userId]);
    return maskScoresForFeedEvents(events, counts);
  } catch (error: any) {
    console.error("Error fetching user feed events:", error?.message || error);
    return [];
  }
};

// Legacy function - fetch ratings with user profiles (for backward compatibility)
export const getFeedRatings = async (): Promise<FeedRating[]> => {
  try {
    // Get all ratings
    const { data: ratings, error: ratingsError } = await db
      .from("v_user_ratings")
      .select("*")
      .order("created_at", { ascending: false });

    if (ratingsError) throw ratingsError;
    if (!ratings || ratings.length === 0) return [];

    const maskedRatings = maskScoresForRatings(ratings as RatingPost[]);

    // Get unique user IDs
    const userIds = [...new Set(maskedRatings.map((r: any) => r.user_id))];

    // Fetch profiles for all users
    const { data: profiles, error: profilesError } = await db
      .from("profiles")
      .select("id, display_name, profile_pic")
      .in("id", userIds);

    if (profilesError) throw profilesError;

    // Create a map of user_id -> profile
    const profileMap = new Map<string, Profile>();
    (profiles || []).forEach((p: Profile) => {
      profileMap.set(p.id, p);
    });

    // Combine ratings with profile info
    const feedRatings: FeedRating[] = maskedRatings.map((rating: any) => {
      const profile = profileMap.get(rating.user_id);
      return {
        ...rating,
        user_display_name: profile?.display_name || "User",
        user_profile_pic: profile?.profile_pic || null,
      };
    });

    return feedRatings;
  } catch (error: any) {
    console.error("Error fetching feed ratings:", error?.message || error);
    return [];
  }
};

// Get ratings for a specific user
export const getUserRatings = async (userId: string): Promise<RatingPost[]> => {
  try {
    const { data, error } = await db
      .from("v_user_ratings")
      .select("*")
      .eq("user_id", userId)
      .order("global_rank", { ascending: true });

    if (error) throw error;
    const ratings = (data as RatingPost[]) || [];
    return maskScoresForRatings(ratings);
  } catch (error) {
    console.error("Error fetching user ratings:", error);
    return [];
  }
};

// Get user profile
export const getProfile = async (userId: string): Promise<Profile | null> => {
  try {
    const { data, error } = await db
      .from("profiles")
      .select("id, display_name, profile_pic")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data as Profile;
  } catch (error) {
    console.error("Error fetching profile:", error);
    return null;
  }
};

// Update profile
export const updateProfile = async (
  userId: string,
  updates: Partial<Profile>,
): Promise<Profile | null> => {
  try {
    const { data, error } = await db
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return data as Profile;
  } catch (error) {
    console.error("Error updating profile:", error);
    return null;
  }
};
