// lib/commentsDb.ts
// Supabase data access for feed post comments, replies, and comment likes
// (mirrors patterns in likesDb.ts; uses public.feed_post_comments, feed_post_comment_likes)

import db from "../database/db";
import { ensureFeedPost, type FeedPostRow } from "./likesDb";

// ---------- Types ----------

export type FeedPostCommentRow = {
  id: string;
  post_id: string;
  user_id: string;
  parent_comment_id: string | null;
  body: string;
  like_count: number;
  created_at: string;
  updated_at: string;
};

export type CommentWithProfile = FeedPostCommentRow & {
  display_name: string | null;
  profile_pic: string | null;
};

// ---------- Counts (by feed event) ----------

/**
 * Per-event comment totals from feed_posts.comment_count.
 * Events with no row yet are omitted (treat as 0 in the UI).
 */
export async function getCommentCountsByEventIds(
  eventIds: string[],
): Promise<Record<string, number>> {
  if (eventIds.length === 0) return {};

  const { data, error } = await db
    .from("feed_posts")
    .select("event_id, comment_count")
    .in("event_id", eventIds);

  if (error) {
    console.error("Error fetching comment_count:", error);
    throw error;
  }

  const out: Record<string, number> = {};
  (data || []).forEach((row: { event_id: string; comment_count: number | null }) => {
    out[row.event_id] = row.comment_count ?? 0;
  });
  return out;
}

// ---------- Profile merge (avoids PostgREST embed; works without profiles FK) ----------
// If you switch to .select("..., profiles(...)") on feed_post_comments after the
// profiles FK migration, use profiles!feed_post_comments_user_id_fkey(...) or you
// get PGRST201 (ambiguous: author vs paths through feed_post_comment_likes).

type ProfileFields = { display_name: string | null; profile_pic: string | null };

async function fetchProfilesByUserIds(
  userIds: string[],
): Promise<Map<string, ProfileFields>> {
  const unique = [...new Set(userIds)].filter(Boolean);
  const m = new Map<string, ProfileFields>();
  if (unique.length === 0) return m;

  const { data, error } = await db
    .from("profiles")
    .select("id, display_name, profile_pic")
    .in("id", unique);

  if (error) {
    console.error("Error fetching profiles for comments:", error);
    return m;
  }

  (data || []).forEach((p: any) => {
    m.set(p.id, {
      display_name: p.display_name ?? null,
      profile_pic: p.profile_pic ?? null,
    });
  });
  return m;
}

function mapCommentRow(
  row: any,
  profile: ProfileFields | undefined,
): CommentWithProfile {
  return {
    id: row.id,
    post_id: row.post_id,
    user_id: row.user_id,
    parent_comment_id: row.parent_comment_id,
    body: row.body,
    like_count: row.like_count ?? 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
    display_name: profile?.display_name ?? null,
    profile_pic: profile?.profile_pic ?? null,
  };
}

// ---------- List comments (with author profile) ----------

/**
 * All comments for a feed item (one screenful / thread; flat list, order oldest first).
 * Replies: filter client-side by parent_comment_id, or use tree helpers.
 */
export async function getCommentsForEvent(
  eventId: string,
): Promise<CommentWithProfile[]> {
  const post: FeedPostRow = await ensureFeedPost(eventId);

  const { data: rows, error } = await db
    .from("feed_post_comments")
    .select(
      "id, post_id, user_id, parent_comment_id, body, like_count, created_at, updated_at",
    )
    .eq("post_id", post.id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching feed_post_comments:", error);
    throw error;
  }

  const list = rows || [];
  const pmap = await fetchProfilesByUserIds(list.map((r: any) => r.user_id));
  return list.map((r: any) => mapCommentRow(r, pmap.get(r.user_id)));
}

export async function getCommentById(
  commentId: string,
): Promise<CommentWithProfile | null> {
  const { data, error } = await db
    .from("feed_post_comments")
    .select(
      "id, post_id, user_id, parent_comment_id, body, like_count, created_at, updated_at",
    )
    .eq("id", commentId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching comment:", error);
    throw error;
  }
  if (!data) return null;
  const pmap = await fetchProfilesByUserIds([(data as any).user_id]);
  return mapCommentRow(data, pmap.get((data as any).user_id));
}

// ---------- Create / update / delete ----------

export type AddCommentParams = {
  userId: string;
  eventId: string;
  body: string;
  parentCommentId?: string | null;
};

export async function addComment(
  params: AddCommentParams,
): Promise<CommentWithProfile> {
  const { userId, eventId, body, parentCommentId } = params;
  const trimmed = body.trim();
  if (trimmed.length === 0) {
    throw new Error("Comment body is empty");
  }

  const post = await ensureFeedPost(eventId);

  const { data: inserted, error } = await db
    .from("feed_post_comments")
    .insert({
      post_id: post.id,
      user_id: userId,
      body: trimmed,
      parent_comment_id: parentCommentId ?? null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error inserting comment:", error);
    throw error;
  }

  const full = await getCommentById(inserted.id);
  if (!full) {
    throw new Error("Failed to load comment after insert");
  }
  return full;
}

export async function updateCommentBody(params: {
  userId: string;
  commentId: string;
  body: string;
}): Promise<void> {
  const trimmed = params.body.trim();
  if (trimmed.length === 0) {
    throw new Error("Comment body is empty");
  }

  const { error } = await db
    .from("feed_post_comments")
    .update({ body: trimmed })
    .eq("id", params.commentId)
    .eq("user_id", params.userId);

  if (error) {
    console.error("Error updating comment:", error);
    throw error;
  }
}

export async function deleteComment(params: {
  userId: string;
  commentId: string;
}): Promise<void> {
  const { error } = await db
    .from("feed_post_comments")
    .delete()
    .eq("id", params.commentId)
    .eq("user_id", params.userId);

  if (error) {
    console.error("Error deleting comment:", error);
    throw error;
  }
}

// ---------- Comment likes (triggers keep feed_post_comments.like_count in sync) ----------

/**
 * For the given comment ids, return which ones `userId` has liked.
 */
export async function getLikedCommentIdsForUser(
  userId: string,
  commentIds: string[],
): Promise<Set<string>> {
  const liked = new Set<string>();
  if (commentIds.length === 0) return liked;

  const { data, error } = await db
    .from("feed_post_comment_likes")
    .select("comment_id")
    .eq("user_id", userId)
    .in("comment_id", commentIds);

  if (error) {
    console.error("Error fetching comment likes:", error);
    throw error;
  }

  (data || []).forEach((row: { comment_id: string }) => {
    if (row.comment_id) liked.add(row.comment_id);
  });
  return liked;
}

/**
 * Like or unlike a comment. DB trigger updates `feed_post_comments.like_count`.
 * Pass `isLiked: true` to remove a like, `false` to add (same convention as likesDb.toggleLikeForEvent).
 */
export async function toggleLikeForComment(params: {
  userId: string;
  commentId: string;
  isLiked: boolean;
}): Promise<{ likeCount: number; isLiked: boolean }> {
  const { userId, commentId, isLiked } = params;

  if (isLiked) {
    const { error: deleteError } = await db
      .from("feed_post_comment_likes")
      .delete()
      .eq("comment_id", commentId)
      .eq("user_id", userId);

    if (deleteError) {
      console.error("Error removing comment like:", deleteError);
      throw deleteError;
    }
  } else {
    const { error: insertError } = await db.from("feed_post_comment_likes").insert({
      comment_id: commentId,
      user_id: userId,
    });

    if (insertError && (insertError as { code?: string }).code !== "23505") {
      console.error("Error adding comment like:", insertError);
      throw insertError;
    }
  }

  const { data: row, error: readError } = await db
    .from("feed_post_comments")
    .select("like_count")
    .eq("id", commentId)
    .single();

  if (readError) {
    console.error("Error reading comment like_count:", readError);
    throw readError;
  }

  return {
    likeCount: row?.like_count ?? 0,
    isLiked: !isLiked,
  };
}

export type CommentLikeProfile = {
  user_id: string;
  display_name: string | null;
  profile_pic: string | null;
};

export async function getLikesForComment(
  commentId: string,
): Promise<CommentLikeProfile[]> {
  const { data: likes, error } = await db
    .from("feed_post_comment_likes")
    .select("user_id")
    .eq("comment_id", commentId);

  if (error) {
    console.error("Error fetching comment likes list:", error);
    throw error;
  }

  const rows = likes || [];
  const pmap = await fetchProfilesByUserIds(
    rows.map((r: { user_id: string }) => r.user_id),
  );
  return rows.map((row: { user_id: string }) => {
    const p = pmap.get(row.user_id);
    return {
      user_id: row.user_id,
      display_name: p?.display_name ?? "User",
      profile_pic: p?.profile_pic ?? null,
    };
  });
}

/**
 * For one feed event, load all comments and the set of comment ids the user liked
 * (convenience for feed rows).
 */
export async function getCommentStateForEvent(
  userId: string,
  eventId: string,
): Promise<{
  comments: CommentWithProfile[];
  likedCommentIds: Set<string>;
  postId: string;
}> {
  const post = await ensureFeedPost(eventId);
  const comments = await getCommentsForEvent(eventId);
  const ids = comments.map((c) => c.id);
  const likedCommentIds = await getLikedCommentIdsForUser(userId, ids);
  return { comments, likedCommentIds, postId: post.id };
}
