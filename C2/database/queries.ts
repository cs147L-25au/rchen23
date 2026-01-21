import db from "./db";

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
    return (data as RatingPost[]) || [];
  } catch (error: any) {
    console.error("Error fetching ratings:", error?.message || error);
    return [];
  }
};

// Fetch feed from v_feed view (includes ratings + bookmarks)
export const getFeedEvents = async (): Promise<FeedEvent[]> => {
  try {
    const { data, error } = await db
      .from("v_feed")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching feed:", error.message);
      throw error;
    }

    return (data as FeedEvent[]) || [];
  } catch (error: any) {
    console.error("Error fetching feed events:", error?.message || error);
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

    // Get unique user IDs
    const userIds = [...new Set(ratings.map((r: any) => r.user_id))];

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
    const feedRatings: FeedRating[] = ratings.map((rating: any) => {
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
    return (data as RatingPost[]) || [];
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
  updates: Partial<Profile>
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
