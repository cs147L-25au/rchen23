// lib/likesDb.ts
// Supabase data access layer for feed post likes

import db from "../database/db";

export type FeedPostRow = {
  id: string;
  event_id: string;
  like_count: number;
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
    .select("id, event_id, like_count, created_at")
    .in("event_id", eventIds);

  if (error) {
    console.error("Error fetching feed_posts:", error);
    throw error;
  }

  return data || [];
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
    likeCounts[post.event_id] = post.like_count || 0;
  });

  const postIds = posts.map((post) => post.id);
  if (postIds.length === 0) {
    return { likeCounts, likedEventIds, postIdByEventId };
  }

  const { data: likes, error } = await db
    .from("feed_post_likes")
    .select("post_id")
    .eq("user_id", userId)
    .in("post_id", postIds);

  if (error) {
    console.error("Error fetching feed_post_likes:", error);
    throw error;
  }

  (likes || []).forEach((like: FeedPostLikeRow) => {
    const eventId = eventIdByPostId[like.post_id];
    if (eventId) likedEventIds.add(eventId);
  });

  return { likeCounts, likedEventIds, postIdByEventId };
}

async function ensureFeedPost(eventId: string): Promise<FeedPostRow> {
  const { data: existing, error: selectError } = await db
    .from("feed_posts")
    .select("id, event_id, like_count, created_at")
    .eq("event_id", eventId)
    .maybeSingle();

  if (selectError) {
    console.error("Error checking feed_posts:", selectError);
    throw selectError;
  }

  if (existing) return existing as FeedPostRow;

  const { data: inserted, error: insertError } = await db
    .from("feed_posts")
    .insert({ event_id: eventId, like_count: 0 })
    .select("id, event_id, like_count, created_at")
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
