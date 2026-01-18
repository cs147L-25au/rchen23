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
  review_title: string | null;
  review_body: string | null;
  watched_at: string | null;
  created_at: string;
  updated_at: string;
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
