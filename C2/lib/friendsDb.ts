import db from "../database/db";

export type FollowEdge = {
  follower_id: string;
  following_id: string;
};

export type FollowUser = {
  id: string;
  display_name: string | null;
  username: string | null;
  profile_pic: string | null;
};

/**
 * Get the count of followers for a user
 */
export async function getFollowersCount(userId: string): Promise<number> {
  if (!userId) return 0;
  try {
    const { count, error } = await db
      .from("friends")
      .select("*", { count: "exact", head: true })
      .eq("following_id", userId);

    if (error) {
      console.warn("Failed to get followers count:", error.message);
      return 0;
    }
    return count ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Get the count of users this user is following
 */
export async function getFollowingCount(userId: string): Promise<number> {
  if (!userId) return 0;
  try {
    const { count, error } = await db
      .from("friends")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", userId);

    if (error) {
      console.warn("Failed to get following count:", error.message);
      return 0;
    }
    return count ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Get list of followers for a user
 */
export async function getFollowers(userId: string): Promise<FollowUser[]> {
  if (!userId) return [];
  try {
    const { data, error } = await db
      .from("friends")
      .select(
        `
        follower_id,
        profiles!friends_follower_id_fkey (
          id,
          display_name,
          username,
          profile_pic
        )
      `,
      )
      .eq("following_id", userId);

    if (error) {
      console.warn("Failed to get followers:", error.message);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.profiles.id,
      display_name: row.profiles.display_name,
      username: row.profiles.username,
      profile_pic: row.profiles.profile_pic,
    }));
  } catch {
    return [];
  }
}

/**
 * Get list of users this user is following
 */
export async function getFollowing(userId: string): Promise<FollowUser[]> {
  if (!userId) return [];
  try {
    const { data, error } = await db
      .from("friends")
      .select(
        `
        following_id,
        profiles!friends_following_id_fkey (
          id,
          display_name,
          username,
          profile_pic
        )
      `,
      )
      .eq("follower_id", userId);

    if (error) {
      console.warn("Failed to get following:", error.message);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.profiles.id,
      display_name: row.profiles.display_name,
      username: row.profiles.username,
      profile_pic: row.profiles.profile_pic,
    }));
  } catch {
    return [];
  }
}

export async function getFollowingIds(
  followerId: string,
  targetIds: string[] = [],
): Promise<Set<string>> {
  if (!followerId) return new Set();

  try {
    let query = db
      .from("friends")
      .select("following_id")
      .eq("follower_id", followerId);

    if (targetIds.length > 0) {
      query = query.in("following_id", targetIds);
    }

    const { data, error } = await query;
    if (error) {
      // Table might not exist yet - fail silently
      console.warn("Friends table not available:", error.message);
      return new Set();
    }

    const ids = (data || []).map(
      (row: { following_id: string }) => row.following_id,
    );
    return new Set(ids);
  } catch (err) {
    console.warn("Failed to fetch following ids:", err);
    return new Set();
  }
}

export async function isFollowing(
  followerId: string,
  followingId: string,
): Promise<boolean> {
  if (!followerId || !followingId) return false;

  try {
    const { data, error } = await db
      .from("friends")
      .select("following_id")
      .eq("follower_id", followerId)
      .eq("following_id", followingId)
      .maybeSingle();

    if (error) {
      // Table might not exist yet - fail silently
      console.warn("Friends table not available:", error.message);
      return false;
    }

    return Boolean(data);
  } catch (err) {
    console.warn("Failed to check follow state:", err);
    return false;
  }
}

export async function followUser(
  followerId: string,
  followingId: string,
): Promise<boolean> {
  if (!followerId || !followingId) return false;
  if (followerId === followingId) return false; // Can't follow yourself

  try {
    // First check if already following
    const alreadyFollowing = await isFollowing(followerId, followingId);
    if (alreadyFollowing) return true;

    const { error } = await db
      .from("friends")
      .insert({ follower_id: followerId, following_id: followingId });

    if (error) {
      // Ignore duplicate key error (already following)
      if (error.code === "23505") return true;
      console.warn("Failed to follow user:", error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.warn("Failed to follow user:", err);
    return false;
  }
}

export async function unfollowUser(
  followerId: string,
  followingId: string,
): Promise<boolean> {
  if (!followerId || !followingId) return false;

  try {
    const { error } = await db
      .from("friends")
      .delete()
      .eq("follower_id", followerId)
      .eq("following_id", followingId);

    if (error) {
      console.warn("Failed to unfollow user:", error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.warn("Failed to unfollow user:", err);
    return false;
  }
}
