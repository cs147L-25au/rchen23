import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "../contexts/ThemeContext";
import { ThemeColors } from "../constants/theme";
import { RatingPost } from "../database/queries";
import { formatScore } from "../lib/ratingsDb";

const DEFAULT_PROFILE_URL = require("../assets/anon_pfp.png");

interface FriendActivityCardProps {
  ratingPost: RatingPost;
  userName: string;
  profileImage: string | null;
  onPress?: () => void;
}

const FriendActivityCard: React.FC<FriendActivityCardProps> = ({
  ratingPost,
  userName,
  profileImage,
  onPress,
}) => {
  const { colors: t } = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const getTitleTypeIcon = () => {
    switch (ratingPost.title_type) {
      case "tv":
        return "tv-outline";
      case "documentary":
        return "film-outline";
      default:
        return "videocam-outline";
    }
  };

  const getCategoryLabel = () => {
    switch (ratingPost.category) {
      case "good":
        return "Liked this";
      case "alright":
        return "It was fine";
      case "bad":
        return "Disliked this";
      default:
        return "Rated";
    }
  };

  const genreText =
    ratingPost.genres && ratingPost.genres.length > 0
      ? ratingPost.genres.slice(0, 2).join(", ")
      : "Movie";

  const showScoreBadge = ratingPost.score !== null && ratingPost.score !== undefined;

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.card}>
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
              <Text style={styles.actionLabel}> {getCategoryLabel()} </Text>
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

            {ratingPost.review_body && ratingPost.review_body.length > 0 && (
              <Text style={styles.description} numberOfLines={2}>
                {ratingPost.review_body}
              </Text>
            )}
          </View>

          {showScoreBadge && (
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreText}>{formatScore(ratingPost.score)}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
};

export default FriendActivityCard;

const makeStyles = (t: ThemeColors) =>
  StyleSheet.create({
    container: {
      marginBottom: 12,
    },
    card: {
      backgroundColor: t.card,
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: t.border,
    },
    mainRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
    },
    avatarContainer: {
      flexShrink: 0,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: t.posterPlaceholder,
    },
    contentContainer: {
      flex: 1,
      gap: 4,
    },
    actionText: {
      fontSize: 14,
      lineHeight: 20,
      color: t.textPrimary,
    },
    userName: {
      fontWeight: "600",
      color: t.textPrimary,
    },
    actionLabel: {
      fontWeight: "400",
      color: t.textSecondary,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    metaIcon: {
      marginRight: 2,
    },
    metaText: {
      fontSize: 12,
      color: t.textMuted,
    },
    description: {
      fontSize: 13,
      color: t.textSecondary,
      lineHeight: 18,
      marginTop: 4,
    },
    scoreBadge: {
      flexShrink: 0,
      backgroundColor: t.primary,
      borderRadius: 18,
      paddingHorizontal: 10,
      paddingVertical: 6,
      justifyContent: "center",
      alignItems: "center",
      minWidth: 48,
    },
    scoreText: {
      fontSize: 13,
      fontWeight: "600",
      color: "#fff",
    },
  });
