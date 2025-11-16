import db from "./db";

export interface Profile {
  id: string;
  display_name: string;
  profile_pic: string | null;
}

export interface Post {
  id: string;
  created_at: string;
  user_id: string;
  movie_id: string;
  movie_name: string;
  action_type: "rating" | "text";
  like_count: number;
  comment_count: number;
  user?: Profile;
}

// Fetch all posts with user profiles
export const getAllPosts = async (): Promise<Post[]> => {
  try {
    const { data, error } = await db
      .from("posts")
      .select(
        `
        *,
        user:user_id(id, display_name, profile_pic)
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error details:", error.message);
      throw error;
    }
    console.log("Posts fetched successfully:", data);
    return (data as Post[]) || [];
  } catch (error: any) {
    console.error("Error fetching posts:", error?.message || error);
    return [];
  }
};

// Update post likes
export const updatePostLikes = async (
  postId: string,
  increment: number
): Promise<Post | null> => {
  try {
    const { data: postData } = await db
      .from("posts")
      .select("like_count")
      .eq("id", postId)
      .single();

    const currentLikes = (postData as any)?.like_count || 0;

    const { data, error } = await db
      .from("posts")
      .update({ like_count: currentLikes + increment })
      .eq("id", postId)
      .select()
      .single();

    if (error) throw error;
    return (data as Post) || null;
  } catch (error) {
    console.error("Error updating likes:", error);
    return null;
  }
};

// Create new post
export const createPost = async (
  userId: string,
  movieId: string,
  movieName: string,
  actionType: "rating" | "text"
): Promise<Post | null> => {
  try {
    const { data, error } = await db
      .from("posts")
      .insert([
        {
          user_id: userId,
          movie_id: movieId,
          movie_name: movieName,
          action_type: actionType,
          like_count: 0,
          comment_count: 0,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return (data as Post) || null;
  } catch (error) {
    console.error("Error creating post:", error);
    return null;
  }
};

// Get user posts
export const getMoviesByUser = async (userId: string): Promise<Post[]> => {
  try {
    const { data, error } = await db
      .from("posts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data as Post[]) || [];
  } catch (error) {
    console.error("Error fetching user movies:", error);
    return [];
  }
};
