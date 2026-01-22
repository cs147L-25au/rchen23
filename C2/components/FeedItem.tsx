import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { formatScore } from "../lib/ratingsDb";

export type ActionType = "ranked" | "bookmarked" | "unbookmarked";

interface FeedItemProps {
  userName: string;
  userInitials: string;
  profileImage: string | null;
  actionType: ActionType;
  title: string;
  score: number | null;
  genres: string[];
  titleType: string;
  timestamp: string;
  description?: string;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onAddToList: () => void;
  onBookmark: () => void;
  onPress?: () => void;
}

const FeedItem: React.FC<FeedItemProps> = ({
  userName,
  userInitials,
  profileImage,
  actionType,
  title,
  score,
  genres,
  titleType,
  timestamp,
  description,
  likeCount,
  commentCount,
  isLiked,
  isBookmarked,
  onLike,
  onComment,
  onShare,
  onAddToList,
  onBookmark,
  onPress,
}) => {
  // Get icon based on title type
  const getTitleTypeIcon = () => {
    switch (titleType) {
      case "tv":
        return "tv-outline";
      case "animated":
        return "sparkles-outline";
      case "documentary":
        return "film-outline";
      default:
        return "videocam-outline";
    }
  };

  // Get action text based on action type
  const getActionText = () => {
    switch (actionType) {
      case "ranked":
        return "ranked";
      case "bookmarked":
        return "bookmarked";
      case "unbookmarked":
        return "removed";
      default:
        return "ranked";
    }
  };

  // Format genres for display
  const genreText =
    genres && genres.length > 0 ? genres.slice(0, 2).join(", ") : "Movie";

  // Only show score badge for ranked items with a score
  const showScoreBadge = actionType === "ranked" && score !== null;

  return (
    <View style={styles.container}>
      <Pressable style={styles.card} onPress={onPress}>
        {/* Main content row */}
        <View style={styles.mainRow}>
          {/* Left: Avatar */}
          <View style={styles.avatarContainer}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{userInitials}</Text>
              </View>
            )}
          </View>

          {/* Middle: Content */}
          <View style={styles.contentContainer}>
            {/* Name + action + title */}
            <Text style={styles.actionText}>
              <Text style={styles.userName}>{userName}</Text>
              <Text style={styles.actionLabel}> {getActionText()} </Text>
              <Text style={styles.titleText}>{title}</Text>
            </Text>

            {/* Category/genre info */}
            <View style={styles.metaRow}>
              <Ionicons
                name={getTitleTypeIcon()}
                size={14}
                color="#666"
                style={styles.metaIcon}
              />
              <Text style={styles.metaText}>{genreText}</Text>
            </View>

            {/* Description if exists (only for ranked items) */}
            {actionType === "ranked" &&
              description &&
              description.length > 0 && (
                <Text style={styles.description} numberOfLines={2}>
                  {description}
                </Text>
              )}
          </View>

          {/* Right: Score badge (only for ranked items with score) */}
          {showScoreBadge && (
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreText}>{formatScore(score)}</Text>
            </View>
          )}
        </View>
      </Pressable>

      {/* Likes count */}
      {likeCount > 0 && (
        <Text style={styles.likesCount}>
          {likeCount} {likeCount === 1 ? "like" : "likes"}
        </Text>
      )}

      {/* Action buttons row */}
      <View style={styles.actionsRow}>
        <View style={styles.leftActions}>
          {/* Like */}
          <Pressable onPress={onLike} style={styles.actionButton}>
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={24}
              color={isLiked ? "#e74c3c" : "#333"}
            />
          </Pressable>

          {/* Comment */}
          <Pressable onPress={onComment} style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={22} color="#333" />
          </Pressable>

          {/* Share */}
          <Pressable onPress={onShare} style={styles.actionButton}>
            <Ionicons name="paper-plane-outline" size={22} color="#333" />
          </Pressable>
        </View>

        <View style={styles.rightActions}>
          {/* Add to list */}
          <Pressable onPress={onAddToList} style={styles.actionButton}>
            <Ionicons name="add-circle-outline" size={24} color="#333" />
          </Pressable>

          {/* Bookmark */}
          <Pressable onPress={onBookmark} style={styles.actionButton}>
            <Ionicons
              name={isBookmarked ? "bookmark" : "bookmark-outline"}
              size={22}
              color={isBookmarked ? "#1a535c" : "#333"}
            />
          </Pressable>
        </View>
      </View>

      {/* Timestamp */}
      <Text style={styles.timestamp}>{timestamp}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
  },
  card: {
    flexDirection: "row",
  },
  mainRow: {
    flexDirection: "row",
    flex: 1,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e5e5e5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d0d0d0",
  },
  avatarInitials: {
    fontSize: 16,
    fontWeight: "600",
    color: "#555",
  },
  contentContainer: {
    flex: 1,
    paddingRight: 8,
  },
  actionText: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 4,
  },
  userName: {
    fontWeight: "700",
    color: "#000",
  },
  actionLabel: {
    color: "#666",
  },
  titleText: {
    fontWeight: "700",
    color: "#000",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  metaIcon: {
    marginRight: 4,
  },
  metaText: {
    fontSize: 13,
    color: "#666",
  },
  description: {
    fontSize: 14,
    color: "#333",
    marginTop: 4,
  },
  scoreBadge: {
    backgroundColor: "#1a535c",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-start",
    minWidth: 44,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  likesCount: {
    fontSize: 13,
    color: "#333",
    fontWeight: "500",
    marginTop: 8,
    marginBottom: 4,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  leftActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionButton: {
    padding: 4,
  },
  timestamp: {
    fontSize: 12,
    color: "#999",
    marginTop: 8,
  },
});

export default FeedItem;
