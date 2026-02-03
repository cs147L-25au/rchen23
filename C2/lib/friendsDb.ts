import db from "../database/db";

export type FollowEdge = {
  follower_id: string;
  following_id: string;
};

export async function getFollowingIds(
  followerId: string,
  targetIds: string[] = [],
): Promise<Set<string>> {
  if (!followerId) return new Set();

  let query = db
    .from("friends")
    .select("following_id")
    .eq("follower_id", followerId);

  if (targetIds.length > 0) {
    query = query.in("following_id", targetIds);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Failed to fetch following ids:", error);
    return new Set();
  }

  const ids = (data || []).map(
    (row: { following_id: string }) => row.following_id,
  );
  return new Set(ids);
}

export async function isFollowing(
  followerId: string,
  followingId: string,
): Promise<boolean> {
  if (!followerId || !followingId) return false;
  const { data, error } = await db
    .from("friends")
    .select("following_id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .maybeSingle();

  if (error) {
    console.error("Failed to check follow state:", error);
    return false;
  }

  return Boolean(data);
}

export async function followUser(
  followerId: string,
  followingId: string,
): Promise<boolean> {
  if (!followerId || !followingId) return false;
  const { error } = await db
    .from("friends")
    .upsert(
      { follower_id: followerId, following_id: followingId } as FollowEdge,
      { onConflict: "follower_id,following_id" },
    );

  if (error) {
    console.error("Failed to follow user:", error);
    return false;
  }

  return true;
}

export async function unfollowUser(
  followerId: string,
  followingId: string,
): Promise<boolean> {
  if (!followerId || !followingId) return false;
  const { error } = await db
    .from("friends")
    .delete()
    .eq("follower_id", followerId)
    .eq("following_id", followingId);

  if (error) {
    console.error("Failed to unfollow user:", error);
    return false;
  }

  return true;
}
