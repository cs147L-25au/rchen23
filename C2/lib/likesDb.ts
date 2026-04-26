// lib/likesDb.ts
// Supabase data access layer for feed post likes

import db from "../database/db";

export type FeedPostRow = {
  id: string;
  event_id: string;
  like_count: number;
  /** Present after migration; total comments + replies on this feed post. */
  comment_count?: number;
  created_at?: string;
};

type FeedPostLikeRow = {
  post_id: string;
  user_id: string;
  created_at?: string;
};

export async function getFeedPostsByEventIds(
  eventIds: string[]
): Promise<FeedPostRow[]> {
  if (eventIds.length === 0) return [];

  const { data, error } = await db
    .from("feed_posts")
    .select("id, event_id, like_count, comment_count, created_at")
    .in("event_id", eventIds);

  if (error) {
    console.error("Error fetching feed_posts:", error);
    throw error;
  }

  return data || [];
}

/**
 * Real like totals from feed_post_likes. Prefer this over feed_posts.like_count in the
 * UI: the denormalized column can drift; feed_post_likes is the source of truth.
 */
export async function getLikeCountByPostIds(
  postIds: string[]
): Promise<Record<string, number>> {
  if (postIds.length === 0) return {};

  const { data, error } = await db
    .from("feed_post_likes")
    .select("post_id")
    .in("post_id", postIds);

  if (error) {
    console.error("Error counting feed_post_likes:", error);
    throw error;
  }

  const counts: Record<string, number> = {};
  for (const row of data || []) {
    const id = (row as FeedPostLikeRow).post_id;
    counts[id] = (counts[id] || 0) + 1;
  }
  return counts;
}

/** Like count per event_id, derived from feed_post_likes (not feed_posts.like_count). */
export async function getLikeCountsForEventIds(
  eventIds: string[]
): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  if (eventIds.length === 0) return out;

  const posts = await getFeedPostsByEventIds(eventIds);
  const byPost = await getLikeCountByPostIds(posts.map((p) => p.id));
  posts.forEach((p) => {
    out[p.event_id] = byPost[p.id] ?? 0;
  });
  return out;
}

export async function getLikeStateForEvents(
  userId: string,
  eventIds: string[]
): Promise<{
  likeCounts: Record<string, number>;
  likedEventIds: Set<string>;
  postIdByEventId: Record<string, string>;
}> {
  const likeCounts: Record<string, number> = {};
  const likedEventIds = new Set<string>();
  const postIdByEventId: Record<string, string> = {};

  if (eventIds.length === 0) {
    return { likeCounts, likedEventIds, postIdByEventId };
  }

  const posts = await getFeedPostsByEventIds(eventIds);
  const eventIdByPostId: Record<string, string> = {};

  posts.forEach((post) => {
    postIdByEventId[post.event_id] = post.id;
    eventIdByPostId[post.id] = post.event_id;
    likeCounts[post.event_id] = 0;
  });

  const postIds = posts.map((post) => post.id);
  if (postIds.length === 0) {
    return { likeCounts, likedEventIds, postIdByEventId };
  }

  // One query: true counts (not feed_posts.like_count) + which posts this user liked
  const { data: likeRows, error } = await db
    .from("feed_post_likes")
    .select("post_id, user_id")
    .in("post_id", postIds);

  if (error) {
    console.error("Error fetching feed_post_likes:", error);
    throw error;
  }

  for (const row of likeRows || []) {
    const like = row as FeedPostLikeRow;
    const eventId = eventIdByPostId[like.post_id];
    if (!eventId) continue;
    likeCounts[eventId] = (likeCounts[eventId] ?? 0) + 1;
    if (like.user_id === userId) {
      likedEventIds.add(eventId);
    }
  }

  return { likeCounts, likedEventIds, postIdByEventId };
}

export async function ensureFeedPost(eventId: string): Promise<FeedPostRow> {
  const { data: existing, error: selectError } = await db
    .from("feed_posts")
    .select("id, event_id, like_count, comment_count, created_at")
    .eq("event_id", eventId)
    .maybeSingle();

  if (selectError) {
    console.error("Error checking feed_posts:", selectError);
    throw selectError;
  }

  if (existing) return existing as FeedPostRow;

  const { data: inserted, error: insertError } = await db
    .from("feed_posts")
    .insert({ event_id: eventId, like_count: 0, comment_count: 0 })
    .select("id, event_id, like_count, comment_count, created_at")
    .single();

  if (insertError) {
    console.error("Error inserting feed_post:", insertError);
    throw insertError;
  }

  return inserted as FeedPostRow;
}

export async function toggleLikeForEvent(params: {
  userId: string;
  eventId: string;
  isLiked: boolean;
  currentLikeCount?: number;
}): Promise<{ likeCount: number; isLiked: boolean }> {
  const { userId, eventId, isLiked, currentLikeCount } = params;
  const post = await ensureFeedPost(eventId);

  let newLikeCount =
    typeof currentLikeCount === "number" ? currentLikeCount : post.like_count;

  if (isLiked) {
    const { error: deleteError } = await db
      .from("feed_post_likes")
      .delete()
      .eq("post_id", post.id)
      .eq("user_id", userId);

    if (deleteError) {
      console.error("Error removing like:", deleteError);
      throw deleteError;
    }

    newLikeCount = Math.max(0, newLikeCount - 1);
  } else {
    const { error: insertError } = await db.from("feed_post_likes").insert({
      post_id: post.id,
      user_id: userId,
    });

    if (insertError && (insertError as any).code !== "23505") {
      console.error("Error adding like:", insertError);
      throw insertError;
    }

    newLikeCount = newLikeCount + 1;
  }

  const { error: updateError } = await db
    .from("feed_posts")
    .update({ like_count: newLikeCount })
    .eq("id", post.id);

  if (updateError) {
    console.error("Error updating like count:", updateError);
    throw updateError;
  }

  return { likeCount: newLikeCount, isLiked: !isLiked };
}

export type LikeProfile = {
  user_id: string;
  display_name: string | null;
  profile_pic: string | null;
};

export async function getLikesForEvent(eventId: string): Promise<LikeProfile[]> {
  const post = await ensureFeedPost(eventId);

  const { data, error } = await db
    .from("feed_post_likes")
    .select("user_id, profiles(display_name, profile_pic)")
    .eq("post_id", post.id);

  if (error) {
    console.error("Error fetching likes list:", error);
    throw error;
  }

  return (data || []).map((row: any) => ({
    user_id: row.user_id,
    display_name: row.profiles?.display_name ?? "User",
    profile_pic: row.profiles?.profile_pic ?? null,
  }));
}
