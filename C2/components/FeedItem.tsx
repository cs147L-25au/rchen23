import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "../contexts/ThemeContext";
import { ThemeColors } from "../constants/theme";
import { formatScore } from "../lib/ratingsDb";

const DEFAULT_PROFILE_URL = require("../assets/anon_pfp.png");

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
  onLikesPress?: () => void;
  onComment: () => void;
  onShare: () => void;
  onAddToList: () => void;
  onBookmark: () => void;
  onPress?: () => void;
  rightActionVariant?: "default" | "watched" | "bookmarked";
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
  onLikesPress,
  onComment,
  onShare,
  onAddToList,
  onBookmark,
  onPress,
  rightActionVariant = "default",
}) => {
  const { colors: t } = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const getTitleTypeIcon = () => {
    switch (titleType) {
      case "tv":
        return "tv-outline";
      case "documentary":
        return "film-outline";
      default:
        return "videocam-outline";
    }
  };

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

  const genreText =
    genres && genres.length > 0 ? genres.slice(0, 2).join(", ") : "Movie";

  const showScoreBadge = actionType === "ranked" && score !== null;

  return (
    <View style={styles.container}>
      <Pressable style={styles.card} onPress={onPress}>
        <View style={styles.mainRow}>
          <View style={styles.avatarContainer}>
            <Image
              source={
                profileImage && profileImage.trim()
                  ? { uri: profileImage }
                  : DEFAULT_PROFILE_URL
              }
              style={styles.avatar}
            />
          </View>

          <View style={styles.contentContainer}>
            <Text style={styles.actionText}>
              <Text style={styles.userName}>{userName}</Text>
              <Text style={styles.actionLabel}> {getActionText()} </Text>
              <Text style={styles.titleText}>{title}</Text>
            </Text>

            <View style={styles.metaRow}>
              <Ionicons
                name={getTitleTypeIcon()}
                size={14}
                color={t.textMuted}
                style={styles.metaIcon}
              />
              <Text style={styles.metaText}>{genreText}</Text>
            </View>

            {actionType === "ranked" &&
              description &&
              description.length > 0 && (
                <Text style={styles.description} numberOfLines={2}>
                  {description}
                </Text>
              )}
          </View>

          {showScoreBadge && (
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreText}>{formatScore(score)}</Text>
            </View>
          )}
        </View>
      </Pressable>

      {likeCount > 0 ? (
        <Pressable onPress={onLikesPress} style={styles.likesPressable}>
          <Text style={styles.likesCount}>
            {likeCount} {likeCount === 1 ? "like" : "likes"}
          </Text>
        </Pressable>
      ) : (
        <View style={styles.likeCountPlaceholder} />
      )}

      {commentCount > 0 ? (
        <Pressable onPress={onComment} style={styles.commentsLinePressable}>
          <Text style={styles.commentsCountLine}>
            {commentCount} {commentCount === 1 ? "comment" : "comments"}
          </Text>
        </Pressable>
      ) : null}

      <View style={[styles.actionsRow, styles.actionsRowAfterLikeBlock]}>
        <View style={styles.leftActions}>
          <Pressable onPress={onLike} style={styles.actionButton}>
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={24}
              color={isLiked ? t.liked : t.textSecondary}
            />
          </Pressable>

          <Pressable onPress={onComment} style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={22} color={t.textSecondary} />
          </Pressable>

          <Pressable onPress={onShare} style={styles.actionButton}>
            <Ionicons name="paper-plane-outline" size={22} color={t.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.rightActions}>
          {rightActionVariant === "watched" ? (
            <Ionicons name="checkmark-circle" size={22} color={t.watched} />
          ) : (
            <>
              <Pressable onPress={onAddToList} style={styles.actionButton}>
                <Ionicons name="add-circle-outline" size={24} color={t.textSecondary} />
              </Pressable>

              {rightActionVariant !== "bookmarked" && (
                <Pressable onPress={onBookmark} style={styles.actionButton}>
                  <Ionicons
                    name={isBookmarked ? "bookmark" : "bookmark-outline"}
                    size={22}
                    color={isBookmarked ? t.bookmarked : t.textSecondary}
                  />
                </Pressable>
              )}
            </>
          )}
        </View>
      </View>

      <Text style={styles.timestamp}>{timestamp}</Text>
    </View>
  );
};

const makeStyles = (t: ThemeColors) =>
  StyleSheet.create({
    container: {
      borderBottomWidth: 1,
      borderBottomColor: t.divider,
      paddingVertical: 16,
      paddingHorizontal: 16,
      backgroundColor: t.card,
    },
    card: {
      flexDirection: "row",
      paddingBottom: 10,
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
      color: t.textPrimary,
    },
    actionLabel: {
      color: t.textSecondary,
    },
    titleText: {
      fontWeight: "700",
      color: t.textPrimary,
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
      color: t.textMuted,
    },
    description: {
      fontSize: 14,
      color: t.textSecondary,
      marginTop: 4,
    },
    scoreBadge: {
      backgroundColor: t.primary,
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
      color: "#FFFFFF",
    },
    likesCount: {
      fontSize: 13,
      lineHeight: 18,
      color: t.textSecondary,
      fontWeight: "500",
      marginTop: 4,
      marginBottom: 0,
    },
    likeCountPlaceholder: {
      marginTop: 4,
      height: 18,
      alignSelf: "stretch",
    },
    likesPressable: {
      alignSelf: "flex-start",
    },
    commentsLinePressable: {
      alignSelf: "flex-start",
    },
    commentsCountLine: {
      fontSize: 13,
      color: t.actionAccent,
      fontWeight: "500",
      marginTop: 2,
      marginBottom: 2,
    },
    actionsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    actionsRowAfterLikeBlock: {
      marginTop: 2,
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
      color: t.textMuted,
      marginTop: 4,
    },
  });

export default FeedItem;
