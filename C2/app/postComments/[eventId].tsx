import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fetchTmdbPosterPath, getPosterUrl } from "../../TMDB";
import Header from "../../components/Header";
import LikesModal, { type LikeUser } from "../../components/LikesModal";
import { RatingModal, type TMDBTitleData } from "../../components/RatingModal";
import NavBar, { NAVBAR_HEIGHT } from "../../components/NavBar";
import db from "../../database/db";
import { FeedEvent, getFeedEventByEventId } from "../../database/queries";
import {
  addComment,
  getCommentsForEvent,
  getCommentStateForEvent,
  toggleLikeForComment,
  type CommentWithProfile,
} from "../../lib/commentsDb";
import {
  getLikeCountsForEventIds,
  getLikesForEvent,
  getLikeStateForEvents,
  toggleLikeForEvent,
} from "../../lib/likesDb";
import { getCurrentUserId, type TitleType } from "../../lib/ratingsDb";
import {
  isInWatchlistByTmdb,
  toggleWatchlistByTmdb,
} from "../../lib/watchlistDb";

const DEFAULT_PROFILE_PIC = require("../../assets/anon_pfp.png");
const DEFAULT_PROFILE_URL_REMOTE =
  "https://eagksfoqgydjaqoijjtj.supabase.co/storage/v1/object/public/RC_profile/profile_pic.png";

/** Matches comment / feed accent in design references */
const C_ACTION = "#2D5A61";
const C_MUTED = "#8E8E93";
const C_DIVIDER = "#E5E5EA";

/** Compact post header poster slot (~135×200); `contain` shows full art without side crop */
const POSTER_FRAME_W = 175.5;
const POSTER_FRAME_H = 260;

function paramStr(v: string | string[] | undefined): string {
  if (v == null) return "";
  const s = Array.isArray(v) ? v[0] : v;
  return typeof s === "string" ? s : "";
}

function formatShortTime(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Same idea as `FeedBar` — relative time for the activity row. */
function formatFeedTimestamp(dateString: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function actionVerb(
  t: FeedEvent["action_type"],
): "ranked" | "bookmarked" | "removed" {
  if (t === "bookmarked") return "bookmarked";
  if (t === "unbookmarked") return "removed";
  return "ranked";
}

function titleTypeIconName(titleType: string) {
  switch (titleType) {
    case "tv":
      return "tv-outline" as const;
    case "documentary":
      return "film-outline" as const;
    default:
      return "videocam-outline" as const;
  }
}

/** `titles.tmdb_media_type` / TMDB — documentary rows still use `movie` in the API. */
function tmdbApiMediaType(m: string): "movie" | "tv" {
  return m.toLowerCase() === "tv" ? "tv" : "movie";
}

function feedTitleTypeToTitleType(ft: string | undefined | null): TitleType {
  if (ft === "tv") return "tv";
  if (ft === "documentary") return "documentary";
  return "movie";
}

function buildCommentList(
  comments: CommentWithProfile[],
): CommentWithProfile[] {
  const roots = comments
    .filter((c) => !c.parent_comment_id)
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
  const out: CommentWithProfile[] = [];
  for (const r of roots) {
    out.push(r);
    const kids = comments
      .filter((c) => c.parent_comment_id === r.id)
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
    out.push(...kids);
  }
  const seen = new Set(out.map((c) => c.id));
  for (const c of comments) {
    if (!seen.has(c.id)) out.push(c);
  }
  return out;
}

export default function PostCommentsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    eventId?: string | string[];
    title?: string | string[];
  }>();
  const eventIdStr = paramStr(params.eventId);
  const feedTitle = paramStr(params.title);

  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [input, setInput] = useState("");
  const [replyingTo, setReplyingTo] = useState<CommentWithProfile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [myProfilePic, setMyProfilePic] = useState<string | null>(null);
  const [sourcePost, setSourcePost] = useState<FeedEvent | null>(null);
  const [postLikeCount, setPostLikeCount] = useState(0);
  const [postLiked, setPostLiked] = useState(false);
  const [resolvedPosterPath, setResolvedPosterPath] = useState<string | null>(
    null,
  );
  const [likesModalVisible, setLikesModalVisible] = useState(false);
  const [likesModalLoading, setLikesModalLoading] = useState(false);
  const [likesModalUsers, setLikesModalUsers] = useState<LikeUser[]>([]);

  /** Current user has a Beli rating for this title (seen + ranked) — not the same as watchlist. */
  const [hasRated, setHasRated] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);

  const loadUserTitleStatus = useCallback(
    async (uid: string, row: FeedEvent) => {
      try {
        const mt = tmdbApiMediaType(row.tmdb_media_type);
        const [wl, ratingRes] = await Promise.all([
          isInWatchlistByTmdb(uid, row.tmdb_id, mt),
          db
            .from("v_user_ratings")
            .select("rating_id")
            .eq("user_id", uid)
            .eq("tmdb_id", row.tmdb_id)
            .eq("tmdb_media_type", mt)
            .maybeSingle(),
        ]);
        setInWatchlist(wl.inWatchlist);
        setHasRated(!!ratingRes.data);
      } catch (e) {
        console.error("PostComments title status:", e);
      }
    },
    [],
  );

  const load = useCallback(async () => {
    if (!eventIdStr) return;
    setLoading(true);
    setResolvedPosterPath(null);
    try {
      const uid = await getCurrentUserId();
      setUserId(uid);

      const [feedRow, likeCounts] = await Promise.all([
        getFeedEventByEventId(eventIdStr),
        getLikeCountsForEventIds([eventIdStr]),
      ]);
      setSourcePost(feedRow);
      setPostLikeCount(likeCounts[eventIdStr] ?? 0);

      if (uid && feedRow) {
        await loadUserTitleStatus(uid, feedRow);
      } else {
        setHasRated(false);
        setInWatchlist(false);
      }

      if (feedRow?.tmdb_id) {
        const raw = feedRow.poster_path;
        const hasDbPoster = typeof raw === "string" && raw.trim().length > 0;
        if (!hasDbPoster) {
          const mt: "movie" | "tv" =
            (feedRow.tmdb_media_type || "movie").toLowerCase() === "tv"
              ? "tv"
              : "movie";
          try {
            const fromApi = await fetchTmdbPosterPath(feedRow.tmdb_id, mt);
            if (fromApi) setResolvedPosterPath(fromApi);
          } catch (e) {
            console.warn("PostComments TMDB poster fallback:", e);
          }
        }
      }

      if (uid) {
        const { data: me } = await db
          .from("profiles")
          .select("profile_pic")
          .eq("id", uid)
          .maybeSingle();
        const raw = me?.profile_pic;
        setMyProfilePic(
          !raw || raw === DEFAULT_PROFILE_URL_REMOTE ? null : raw,
        );
        const [{ comments: list, likedCommentIds }, likeState] =
          await Promise.all([
            getCommentStateForEvent(uid, eventIdStr),
            getLikeStateForEvents(uid, [eventIdStr]),
          ]);
        setComments(list);
        setLikedIds(likedCommentIds);
        setPostLiked(likeState.likedEventIds.has(eventIdStr));
      } else {
        setMyProfilePic(null);
        const list = await getCommentsForEvent(eventIdStr);
        setComments(list);
        setLikedIds(new Set());
        setPostLiked(false);
      }
    } catch (e) {
      console.error("PostComments load", e);
      Alert.alert("Error", "Could not load comments");
    } finally {
      setLoading(false);
    }
  }, [eventIdStr, loadUserTitleStatus]);

  useFocusEffect(
    useCallback(() => {
      if (eventIdStr) load();
    }, [eventIdStr, load]),
  );

  const flatComments = useMemo(() => buildCommentList(comments), [comments]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !eventIdStr) return;
    const uid = userId || (await getCurrentUserId());
    if (!uid) {
      Alert.alert("Sign in", "Please sign in to comment");
      return;
    }
    setPosting(true);
    try {
      await addComment({
        userId: uid,
        eventId: eventIdStr,
        body: text,
        parentCommentId: replyingTo?.id,
      });
      setInput("");
      setReplyingTo(null);
      await load();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not post comment");
    } finally {
      setPosting(false);
    }
  };

  const openMediaFromPost = useCallback(
    (item: FeedEvent) => {
      router.push({
        pathname: "/(tabs)/mediaDetails",
        params: {
          id: item.tmdb_id.toString(),
          mediaType: item.tmdb_media_type,
          title: item.title,
        },
      });
    },
    [router],
  );

  const handlePostLike = useCallback(async () => {
    if (!eventIdStr) return;
    const uid = userId || (await getCurrentUserId());
    if (!uid) {
      Alert.alert("Sign in", "Please sign in to like posts");
      return;
    }
    const wasLiked = postLiked;
    setPostLiked(!wasLiked);
    setPostLikeCount((c) => c + (wasLiked ? -1 : 1));
    try {
      const r = await toggleLikeForEvent({
        userId: uid,
        eventId: eventIdStr,
        isLiked: wasLiked,
        currentLikeCount: postLikeCount,
      });
      setPostLiked(r.isLiked);
      setPostLikeCount(r.likeCount);
    } catch (e) {
      console.error(e);
      setPostLiked(wasLiked);
      setPostLikeCount((c) => c + (wasLiked ? 1 : -1));
      load();
      Alert.alert("Error", "Could not update like");
    }
  }, [eventIdStr, userId, postLiked, postLikeCount, load]);

  const handleOpenPostLikes = useCallback(async () => {
    if (!eventIdStr) return;
    setLikesModalVisible(true);
    setLikesModalLoading(true);
    setLikesModalUsers([]);
    try {
      const users = await getLikesForEvent(eventIdStr);
      setLikesModalUsers(
        users.map((u) => ({
          id: u.user_id,
          displayName: u.display_name || "User",
          profilePic: u.profile_pic,
        })),
      );
    } catch (e) {
      console.error("Post likes list:", e);
      setLikesModalUsers([]);
    } finally {
      setLikesModalLoading(false);
    }
  }, [eventIdStr]);

  const openRatingModal = useCallback(() => {
    if (!userId) {
      Alert.alert("Sign in", "Please sign in to rate titles");
      return;
    }
    setRatingModalVisible(true);
  }, [userId]);

  const handlePostBookmark = useCallback(async () => {
    if (!userId) {
      Alert.alert("Sign in", "Please sign in to bookmark");
      return;
    }
    if (!sourcePost) return;
    if (watchlistLoading) return;
    setWatchlistLoading(true);
    try {
      const r = await toggleWatchlistByTmdb({
        tmdb_id: sourcePost.tmdb_id,
        tmdb_media_type: tmdbApiMediaType(sourcePost.tmdb_media_type),
        title: sourcePost.title,
        genres: sourcePost.genres || [],
        title_type: feedTitleTypeToTitleType(sourcePost.title_type),
        poster_path: sourcePost.poster_path,
        release_year: null,
      });
      setInWatchlist(r.inWatchlist);
    } catch (e) {
      console.error("Bookmark toggle", e);
      Alert.alert("Error", "Could not update watchlist");
    } finally {
      setWatchlistLoading(false);
    }
  }, [userId, sourcePost, watchlistLoading]);

  const handleRatingSuccess = useCallback(() => {
    setRatingModalVisible(false);
    if (userId && sourcePost) {
      void loadUserTitleStatus(userId, sourcePost);
    } else {
      setHasRated(true);
    }
  }, [userId, sourcePost, loadUserTitleStatus]);

  const ratingTmdbData: TMDBTitleData | null = useMemo(() => {
    if (!sourcePost) return null;
    const poster =
      resolvedPosterPath && resolvedPosterPath.trim()
        ? resolvedPosterPath
        : sourcePost.poster_path;
    return {
      tmdb_id: sourcePost.tmdb_id,
      tmdb_media_type: tmdbApiMediaType(sourcePost.tmdb_media_type),
      title: sourcePost.title,
      genres: sourcePost.genres || [],
      poster_path: poster,
      release_year: null,
    };
  }, [sourcePost, resolvedPosterPath]);

  const handleLikeComment = async (comment: CommentWithProfile) => {
    const uid = userId || (await getCurrentUserId());
    if (!uid) {
      Alert.alert("Sign in", "Please sign in to like comments");
      return;
    }
    const isLiked = likedIds.has(comment.id);
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (isLiked) next.delete(comment.id);
      else next.add(comment.id);
      return next;
    });
    setComments((rows) =>
      rows.map((c) =>
        c.id === comment.id
          ? { ...c, like_count: (c.like_count ?? 0) + (isLiked ? -1 : 1) }
          : c,
      ),
    );
    try {
      const r = await toggleLikeForComment({
        userId: uid,
        commentId: comment.id,
        isLiked,
      });
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (r.isLiked) next.add(comment.id);
        else next.delete(comment.id);
        return next;
      });
      setComments((rows) =>
        rows.map((c) =>
          c.id === comment.id ? { ...c, like_count: r.likeCount } : c,
        ),
      );
    } catch (e) {
      console.error(e);
      load();
      Alert.alert("Error", "Could not update like");
    }
  };

  const listHeader = useMemo(() => {
    if (loading) {
      return (
        <View>
          <View style={styles.opLoadingCard}>
            <ActivityIndicator size="large" color={C_ACTION} />
          </View>
          <Text style={styles.commentsSectionTitle}>Comments</Text>
        </View>
      );
    }

    const item = sourcePost;
    const dbOrResolvedPath =
      item &&
      (item.poster_path && String(item.poster_path).trim()
        ? item.poster_path
        : resolvedPosterPath);
    const posterUri = item
      ? getPosterUrl(dbOrResolvedPath ?? null, null, "w500")
      : null;
    const displayTitle = item?.title || feedTitle || "Post";
    const name = item?.display_name || "User";
    const genreText =
      item && item.genres && item.genres.length > 0
        ? item.genres.slice(0, 2).join(", ")
        : "Movie";
    return (
      <View>
        <View style={styles.originalPostCard}>
          {item ? (
            <Pressable
              style={styles.opTopRow}
              onPress={() => openMediaFromPost(item)}
            >
              <Image
                source={
                  item.profile_pic && item.profile_pic.trim()
                    ? { uri: item.profile_pic }
                    : DEFAULT_PROFILE_PIC
                }
                style={styles.opAvatar}
              />
              <View style={styles.opTextBlock}>
                <Text style={styles.opActionLine} numberOfLines={3}>
                  <Text style={styles.opName}>{name}</Text>
                  <Text style={styles.opVerb}>
                    {" "}
                    {actionVerb(item.action_type)}{" "}
                  </Text>
                  <Text style={styles.opTitleEm}>{item.title}</Text>
                </Text>
                <View style={styles.opMetaRow}>
                  <Ionicons
                    name={titleTypeIconName(item.title_type || "movie")}
                    size={14}
                    color={C_MUTED}
                  />
                  <Text style={styles.opMetaText}> {genreText}</Text>
                </View>
                {item.action_type === "ranked" &&
                  item.review_body &&
                  item.review_body.length > 0 && (
                    <Text style={styles.opReview} numberOfLines={2}>
                      {item.review_body}
                    </Text>
                  )}
              </View>
            </Pressable>
          ) : (
            <View style={styles.opFallbackRow}>
              <Text style={styles.opFallbackTitle} numberOfLines={2}>
                {displayTitle}
              </Text>
              <Text style={styles.opFallbackHint}>
                Original activity could not be loaded.
              </Text>
            </View>
          )}

          <Pressable
            onPress={() => (item ? openMediaFromPost(item) : undefined)}
            style={({ pressed }) => [
              styles.posterFrame,
              item && pressed ? styles.posterPressed : null,
            ]}
            disabled={!item}
          >
            {posterUri ? (
              <Image
                source={{ uri: posterUri }}
                style={styles.posterImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.posterPhInner}>
                <Ionicons name="image-outline" size={40} color={C_MUTED} />
              </View>
            )}
          </Pressable>

          {postLikeCount > 0 ? (
            <Pressable
              onPress={handleOpenPostLikes}
              style={styles.opLikesCountRow}
            >
              <Text style={styles.opLikeCountText}>
                {postLikeCount} {postLikeCount === 1 ? "like" : "likes"}
              </Text>
            </Pressable>
          ) : null}
          <View style={styles.opActionsRow}>
            <View style={styles.opLeftActions}>
              <Pressable onPress={handlePostLike} style={styles.opIconBtn}>
                <Ionicons
                  name={postLiked ? "heart" : "heart-outline"}
                  size={24}
                  color={postLiked ? "#D81B60" : "#333"}
                />
              </Pressable>
              <Pressable style={styles.opIconBtn}>
                <Ionicons name="paper-plane-outline" size={22} color="#333" />
              </Pressable>
            </View>
            {userId && item ? (
              <View style={styles.opRightActions}>
                {hasRated ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color={C_ACTION}
                  />
                ) : (
                  <Pressable
                    onPress={openRatingModal}
                    style={styles.opIconBtn}
                    hitSlop={6}
                  >
                    <Ionicons
                      name="add-circle-outline"
                      size={24}
                      color="#333"
                    />
                  </Pressable>
                )}
                <Pressable
                  onPress={handlePostBookmark}
                  disabled={watchlistLoading}
                  style={styles.opIconBtn}
                  hitSlop={6}
                >
                  {watchlistLoading ? (
                    <ActivityIndicator size="small" color={C_ACTION} />
                  ) : (
                    <Ionicons
                      name={inWatchlist ? "bookmark" : "bookmark-outline"}
                      size={22}
                      color={inWatchlist ? C_ACTION : "#333"}
                    />
                  )}
                </Pressable>
              </View>
            ) : null}
          </View>
          {item ? (
            <Text style={styles.opTimestamp}>
              {formatFeedTimestamp(item.created_at)}
            </Text>
          ) : null}
        </View>

        <Text style={styles.commentsSectionTitle}>Comments</Text>
      </View>
    );
  }, [
    loading,
    sourcePost,
    feedTitle,
    postLiked,
    postLikeCount,
    resolvedPosterPath,
    openMediaFromPost,
    handlePostLike,
    handleOpenPostLikes,
    userId,
    hasRated,
    inWatchlist,
    watchlistLoading,
    openRatingModal,
    handlePostBookmark,
  ]);

  const renderComment = ({ item }: { item: CommentWithProfile }) => {
    const depth = item.parent_comment_id ? 1 : 0;
    return (
      <View style={[styles.commentRow, depth ? styles.commentRowReply : null]}>
        <Image
          source={
            item.profile_pic && item.profile_pic.trim()
              ? { uri: item.profile_pic }
              : DEFAULT_PROFILE_PIC
          }
          style={styles.commentAvatar}
        />
        <View style={styles.commentBody}>
          <View style={styles.commentHeader}>
            <Text style={styles.commentName}>
              {item.display_name || "User"}
            </Text>
            <Text style={styles.commentTime}>
              {formatShortTime(item.created_at)}
            </Text>
          </View>
          <Text style={styles.commentText}>{item.body}</Text>
          <View style={styles.commentActions}>
            <Pressable
              onPress={() => handleLikeComment(item)}
              style={styles.iconHit}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons
                name={likedIds.has(item.id) ? "heart" : "heart-outline"}
                size={20}
                color={likedIds.has(item.id) ? "#D81B60" : C_ACTION}
              />
            </Pressable>
            {item.like_count > 0 ? (
              <Text style={styles.likeCountSmall}>{item.like_count}</Text>
            ) : null}
            <Pressable
              onPress={() => setReplyingTo(item)}
              style={styles.replyPress}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Text style={styles.replyText}>Reply</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  if (!eventIdStr) {
    return (
      <View style={styles.page}>
        <Text style={styles.missingText}>Invalid post</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.missingBack}>Go back</Text>
        </Pressable>
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <Pressable onPress={() => router.push("/(tabs)/settings")}>
        <Header />
      </Pressable>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 8 : 0}
      >
        <View style={styles.topBar}>
          <Pressable
            style={styles.backRow}
            onPress={() => router.back()}
            hitSlop={10}
          >
            <Ionicons name="chevron-back" size={22} color={C_MUTED} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        </View>

        <FlatList
          data={flatComments}
          keyExtractor={(c) => c.id}
          renderItem={renderComment}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={
            loading ? null : (
              <Text style={styles.emptyText}>
                No comments yet. Be the first to say something.
              </Text>
            )
          }
          style={styles.list}
          keyboardShouldPersistTaps="handled"
        />

        {replyingTo ? (
          <View style={styles.replyBanner}>
            <Text style={styles.replyBannerText} numberOfLines={1}>
              Replying to {replyingTo.display_name || "User"}
            </Text>
            <Pressable onPress={() => setReplyingTo(null)}>
              <Text style={styles.cancelReply}>Cancel</Text>
            </Pressable>
          </View>
        ) : null}

        <View
          style={[
            styles.composerSection,
            {
              // Room for absolute NavBar + home indicator (`components/NavBar.tsx`). To *slightly* reduce
              paddingBottom: NAVBAR_HEIGHT + insets.bottom - 30,
            },
          ]}
        >
          <View style={styles.composerTopRule} />
          <View style={styles.inputRow}>
            <Image
              source={
                myProfilePic && myProfilePic.trim()
                  ? { uri: myProfilePic }
                  : DEFAULT_PROFILE_PIC
              }
              style={styles.composerAvatar}
            />
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder={
                userId ? "Comment or tag a friend" : "Sign in to comment"
              }
              placeholderTextColor={C_MUTED}
              style={styles.input}
              multiline
              maxLength={8000}
              editable={!posting && !!userId}
            />
            <Pressable
              onPress={handleSend}
              disabled={posting || !input.trim() || !userId}
              style={styles.postTextHit}
            >
              {posting ? (
                <ActivityIndicator size="small" color={C_ACTION} />
              ) : (
                <Text
                  style={[
                    styles.postTextLabel,
                    (!input.trim() || !userId) && styles.postTextLabelDisabled,
                  ]}
                >
                  Post
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      <LikesModal
        visible={likesModalVisible}
        likes={likesModalLoading ? [] : likesModalUsers}
        onClose={() => setLikesModalVisible(false)}
      />
      <RatingModal
        visible={ratingModalVisible}
        tmdbData={ratingTmdbData}
        onClose={() => setRatingModalVisible(false)}
        onSuccess={handleRatingSuccess}
      />
      <NavBar />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#fff" },
  flex: { flex: 1 },
  missingText: { textAlign: "center", marginTop: 24, fontSize: 16 },
  missingBack: { textAlign: "center", marginTop: 12, color: C_ACTION },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C_DIVIDER,
  },
  backRow: { flexDirection: "row", alignItems: "center" },
  backText: {
    fontSize: 17,
    color: C_MUTED,
    marginLeft: 2,
    fontFamily: "DM Sans",
  },
  opLoadingCard: {
    paddingVertical: 48,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C_DIVIDER,
  },
  /** Single rule under the post (do not add a second hairline View below, or you get double lines) */
  originalPostCard: {
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C_DIVIDER,
  },
  opTopRow: { flexDirection: "row", alignItems: "flex-start" },
  opAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  opTextBlock: { flex: 1, minWidth: 0, paddingRight: 8 },
  opActionLine: { fontSize: 15, lineHeight: 20, marginBottom: 4 },
  opName: { fontWeight: "700", color: "#000", fontFamily: "DM Sans" },
  opVerb: { color: "#666", fontFamily: "DM Sans" },
  opTitleEm: { fontWeight: "700", color: "#000", fontFamily: "DM Sans" },
  opMetaRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  opMetaText: { fontSize: 13, color: C_MUTED, fontFamily: "DM Sans" },
  opReview: {
    fontSize: 14,
    color: "#333",
    marginTop: 4,
    fontFamily: "DM Sans",
  },
  opFallbackRow: { paddingBottom: 8 },
  opFallbackTitle: { fontSize: 18, fontWeight: "700", color: "#000" },
  opFallbackHint: { fontSize: 13, color: C_MUTED, marginTop: 6 },
  /** Fixed ~112×240; image uses `contain` so the full poster is visible (no cover crop) */
  posterFrame: {
    width: POSTER_FRAME_W,
    height: POSTER_FRAME_H,
    alignSelf: "center",
    marginTop: 12,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  posterPressed: { opacity: 0.92 },
  posterImage: {
    width: POSTER_FRAME_W,
    height: POSTER_FRAME_H,
  },
  posterPhInner: {
    width: POSTER_FRAME_W,
    height: POSTER_FRAME_H,
    justifyContent: "center",
    alignItems: "center",
  },
  /** Same order as `FeedItem`: like count line, then icon row */
  opLikesCountRow: {
    alignSelf: "flex-start",
    marginTop: 8,
    marginBottom: 4,
  },
  opLikeCountText: {
    fontSize: 13,
    color: "#333",
    fontWeight: "500",
    fontFamily: "DM Sans",
  },
  opActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    paddingHorizontal: 2,
  },
  opLeftActions: { flexDirection: "row", alignItems: "center", gap: 16 },
  opRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  opIconBtn: { padding: 4 },
  opTimestamp: {
    fontSize: 12,
    color: C_MUTED,
    marginTop: 8,
    fontFamily: "DM Sans",
  },
  /** Gap above/below “Comments” — lower `paddingBottom` to pull the list closer */
  commentsSectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
    paddingTop: 12,
    paddingBottom: 4,
    fontFamily: "DM Sans",
  },
  list: { flex: 1 },
  /** Space under the section title before first row — lower `paddingTop` to tighten */
  listContent: {
    paddingTop: 2,
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  /** Empty state: `paddingTop` was the main extra gap; tune top vs bottom separately */
  emptyText: {
    fontSize: 15,
    color: C_MUTED,
    paddingTop: 8,
    paddingBottom: 20,
    lineHeight: 22,
  },
  commentRow: {
    flexDirection: "row",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C_DIVIDER,
  },
  commentRowReply: {
    marginLeft: 4,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: "#E8E8ED",
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  commentBody: { flex: 1, minWidth: 0 },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  commentName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    fontFamily: "DM Sans",
  },
  commentTime: { fontSize: 13, color: C_MUTED, fontFamily: "DM Sans" },
  commentText: {
    fontSize: 16,
    color: "#000",
    marginTop: 6,
    lineHeight: 22,
    fontFamily: "DM Sans",
  },
  commentActions: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 4,
  },
  iconHit: { padding: 0 },
  likeCountSmall: {
    fontSize: 13,
    color: C_MUTED,
    marginLeft: 2,
    marginRight: 8,
  },
  replyPress: { paddingVertical: 4, paddingLeft: 8 },
  replyText: {
    fontSize: 15,
    color: C_ACTION,
    fontWeight: "600",
    fontFamily: "DM Sans",
  },
  replyBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#F2F2F7",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C_DIVIDER,
  },
  replyBannerText: { flex: 1, fontSize: 14, color: "#3C3C43" },
  cancelReply: { fontSize: 15, fontWeight: "600", color: C_ACTION },
  composerSection: {
    backgroundColor: "#fff",
  },
  composerTopRule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: C_DIVIDER,
  },
  /** Space inside the bar around the field + Post — `paddingBottom` is the main “air under the pill” */
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 2,
    gap: 10,
  },
  composerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: C_DIVIDER,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    color: "#000",
    backgroundColor: "#FAFAFA",
    fontFamily: "DM Sans",
  },
  postTextHit: {
    minWidth: 48,
    paddingVertical: 8,
    paddingLeft: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  postTextLabel: {
    fontSize: 17,
    fontWeight: "700",
    color: C_ACTION,
    fontFamily: "DM Sans",
  },
  postTextLabelDisabled: { color: C_MUTED, opacity: 0.5 },
});
