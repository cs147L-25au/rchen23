import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { FeedEvent, getFeedEvents } from "../database/queries";
import { getCurrentUserId } from "../lib/ratingsDb";
import LikesModal, { LikeUser } from "./LikesModal";
import {
  getLikeStateForEvents,
  getLikesForEvent,
  toggleLikeForEvent,
} from "../lib/likesDb";
import { isInWatchlistByTmdb, toggleWatchlistByTmdb } from "../lib/watchlistDb";
import FeedItem, { ActionType } from "./FeedItem";

// Helper to get user initials from display name
const getInitials = (name: string): string => {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// Helper to format timestamp for display
const formatTimestamp = (dateString: string): string => {
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

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

type FeedBarProps = {
  scrollEnabled?: boolean;
};

const FeedBar: React.FC<FeedBarProps> = ({ scrollEnabled = true }) => {
  const router = useRouter();
  const [feedItems, setFeedItems] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Local state for interactions (likes, bookmarks)
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<{ [key: string]: number }>({});
  const [likesModalVisible, setLikesModalVisible] = useState(false);
  const [likesModalLoading, setLikesModalLoading] = useState(false);
  const [likesModalUsers, setLikesModalUsers] = useState<LikeUser[]>([]);

  useEffect(() => {
    const init = async () => {
      const userId = await getCurrentUserId();
      setCurrentUserId(userId);
      await loadFeed(userId);
    };
    init();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFeed(currentUserId);
    }, [currentUserId]),
  );

  const loadFeed = async (userIdOverride?: string | null) => {
    try {
      setLoading(true);
      setError(null);

      const data = await getFeedEvents();
      setFeedItems(data);

      const eventIds = data.map((item) => item.event_id);
      const activeUserId = userIdOverride ?? currentUserId;
      if (activeUserId) {
        const likeState = await getLikeStateForEvents(
          activeUserId,
          eventIds
        );
        setLikeCounts(likeState.likeCounts);
        setLiked(likeState.likedEventIds);
      } else {
        setLikeCounts({});
        setLiked(new Set());
      }

      // Check watchlist status for all unique titles
      if (activeUserId) {
        const bookmarkedSet = new Set<string>();
        const uniqueTitles = new Map<
          string,
          { tmdbId: number; mediaType: string }
        >();

        data.forEach((item) => {
          const key = `${item.tmdb_id}-${item.tmdb_media_type}`;
          if (!uniqueTitles.has(key)) {
            uniqueTitles.set(key, {
              tmdbId: item.tmdb_id,
              mediaType: item.tmdb_media_type,
            });
          }
        });

        for (const [key, { tmdbId, mediaType }] of uniqueTitles) {
          const result = await isInWatchlistByTmdb(
            activeUserId,
            tmdbId,
            mediaType as "movie" | "tv"
          );
          if (result.inWatchlist) {
            // Mark all events with this title as bookmarked
            data.forEach((item) => {
              if (
                item.tmdb_id === tmdbId &&
                item.tmdb_media_type === mediaType
              ) {
                bookmarkedSet.add(item.event_id);
              }
            });
          }
        }
        setBookmarked(bookmarkedSet);
      }
    } catch (err) {
      console.error("Failed to load feed:", err);
      setError("Failed to load feed");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (eventId: string) => {
    if (!currentUserId) {
      Alert.alert("Error", "Please log in to like posts");
      return;
    }

    const isCurrentlyLiked = liked.has(eventId);

    // Optimistic update
    setLiked((prev) => {
      const newSet = new Set(prev);
      if (isCurrentlyLiked) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
    setLikeCounts((counts) => ({
      ...counts,
      [eventId]: Math.max(
        0,
        (counts[eventId] || 0) + (isCurrentlyLiked ? -1 : 1)
      ),
    }));

    try {
      const result = await toggleLikeForEvent({
        userId: currentUserId,
        eventId,
        isLiked: isCurrentlyLiked,
        currentLikeCount: likeCounts[eventId] || 0,
      });
      setLikeCounts((counts) => ({
        ...counts,
        [eventId]: result.likeCount,
      }));
      setLiked((prev) => {
        const next = new Set(prev);
        if (result.isLiked) {
          next.add(eventId);
        } else {
          next.delete(eventId);
        }
        return next;
      });
    } catch (error) {
      console.error("Failed to toggle like:", error);
      loadFeed(currentUserId);
    }
  };

  const handleLikesPress = async (eventId: string) => {
    try {
      setLikesModalVisible(true);
      setLikesModalLoading(true);
      const users = await getLikesForEvent(eventId);
      setLikesModalUsers(
        users.map((u) => ({
          id: u.user_id,
          displayName: u.display_name || "User",
          profilePic: u.profile_pic || null,
        })),
      );
    } catch (error) {
      console.error("Failed to load likes list:", error);
      setLikesModalUsers([]);
    } finally {
      setLikesModalLoading(false);
    }
  };

  const handleBookmark = async (item: FeedEvent) => {
    if (!currentUserId) {
      Alert.alert("Error", "Please log in to bookmark");
      return;
    }

    try {
      // Optimistic UI update
      const isCurrentlyBookmarked = bookmarked.has(item.event_id);
      const alreadyBookmarkedForTitle = feedItems.some(
        (feedItem) =>
          feedItem.tmdb_id === item.tmdb_id &&
          feedItem.tmdb_media_type === item.tmdb_media_type &&
          bookmarked.has(feedItem.event_id)
      );

      if (alreadyBookmarkedForTitle) {
        return;
      }

      // Update all events with the same title
      setBookmarked((prev) => {
        const newSet = new Set(prev);
        feedItems.forEach((feedItem) => {
          if (
            feedItem.tmdb_id === item.tmdb_id &&
            feedItem.tmdb_media_type === item.tmdb_media_type
          ) {
            if (isCurrentlyBookmarked) {
              newSet.delete(feedItem.event_id);
            } else {
              newSet.add(feedItem.event_id);
            }
          }
        });
        return newSet;
      });

      // Toggle watchlist in database
      await toggleWatchlistByTmdb({
        tmdb_id: item.tmdb_id,
        tmdb_media_type: item.tmdb_media_type as "movie" | "tv",
        title: item.title,
        genres: item.genres || [],
        title_type: (item.title_type || "movie") as any,
        poster_path: item.poster_path,
      });

      // Refresh feed to show the new bookmark event
      setTimeout(() => loadFeed(), 500);
    } catch (error) {
      console.error("Bookmark error:", error);
      // Revert optimistic update on error
      loadFeed();
      Alert.alert("Error", "Failed to update watchlist");
    }
  };

  const handleItemPress = (item: FeedEvent) => {
    router.push({
      pathname: "/(tabs)/mediaDetails",
      params: {
        id: item.tmdb_id.toString(),
        mediaType: item.tmdb_media_type,
        title: item.title,
      },
    });
  };

  const renderFeedItem = ({ item }: { item: FeedEvent }) => {
    return (
      <FeedItem
        userName={item.display_name || "User"}
        userInitials={getInitials(item.display_name || "User")}
        profileImage={item.profile_pic}
        actionType={item.action_type as ActionType}
        title={item.title}
        score={item.score}
        genres={item.genres || []}
        titleType={item.title_type || "movie"}
        timestamp={formatTimestamp(item.created_at)}
        description={item.review_body || undefined}
        likeCount={likeCounts[item.event_id] || 0}
        commentCount={0}
        isLiked={liked.has(item.event_id)}
        isBookmarked={bookmarked.has(item.event_id)}
        onLike={() => handleLike(item.event_id)}
        onLikesPress={() => handleLikesPress(item.event_id)}
        onComment={() => {
          /* TODO: Open comments */
        }}
        onShare={() => {
          /* TODO: Share */
        }}
        onAddToList={() => {
          /* TODO: Add to list */
        }}
        onBookmark={() => handleBookmark(item)}
        onPress={() => handleItemPress(item)}
      />
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1a535c" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (feedItems.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No activity yet</Text>
        <Text style={styles.emptySubtext}>
          Follow friends to see their activity here
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={feedItems}
        renderItem={renderFeedItem}
        keyExtractor={(item) => item.event_id}
        scrollEnabled={scrollEnabled}
        showsVerticalScrollIndicator={scrollEnabled}
        contentContainerStyle={[
          styles.listContent,
          !scrollEnabled && styles.listContentNoScroll,
        ]}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
      <LikesModal
        visible={likesModalVisible}
        likes={likesModalLoading ? [] : likesModalUsers}
        onClose={() => setLikesModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
  },
  listContent: {
    paddingBottom: 100,
  },
  listContentNoScroll: {
    paddingBottom: 0,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#e74c3c",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
  },
  separator: {
    height: 0,
  },
});

export default FeedBar;
