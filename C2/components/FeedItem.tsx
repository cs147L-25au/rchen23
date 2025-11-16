import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

interface FeedItemProps {
  userName: string;
  action: string; // e.g. "Ranked"
  title: string | null;
  rating: string;
  profileImage: { uri: string };
  timestamp: string;
  description: string; // optional extra text (can be empty)
  likeCount: number;
  isLiked: boolean;
  onPress: () => void;
  likeIcon: any;
  likedIcon: any;
}

const FeedItem: React.FC<FeedItemProps> = ({
  userName,
  action,
  title,
  rating,
  profileImage,
  timestamp,
  description,
  likeCount,
  isLiked,
  onPress,
  likeIcon,
  likedIcon,
}) => {
  const pluralLikes = likeCount === 1 ? "like" : "likes";

  return (
    <View style={styles.card}>
      {/* TOP ROW: left text block + right avatar/time */}
      <View style={styles.headerRow}>
        {/* LEFT BLOCK */}
        <View style={{ flex: 1 }}>
          <Text style={styles.userName}>{userName}</Text>

          {/* Ranked + Title */}
          <Text style={styles.rankLine}>
            <Text style={styles.rankPrefix}>{action} </Text>
            <Text style={styles.rankTitle}>{title}</Text>
          </Text>

          {/* Rating line */}
          {rating !== "" && (
            <Text style={styles.ratingLine}>
              Rating: <Text style={styles.ratingValue}>{rating}</Text>
            </Text>
          )}
        </View>

        {/* RIGHT BLOCK */}
        <View style={styles.rightBlock}>
          <Image source={profileImage} style={styles.profilePic} />
          <Text style={styles.timestamp}>{timestamp}</Text>
        </View>
      </View>

      {/* OPTIONAL DESCRIPTION (for longer reviews if you want them) */}
      {description.length > 0 && (
        <Text style={styles.description}>{description}</Text>
      )}

      {/* BOTTOM ROW: likes on left, heart on right */}
      <View style={styles.footerRow}>
        <Text style={styles.likesText}>
          {likeCount} {pluralLikes}
        </Text>

        <Pressable onPress={onPress} style={styles.heartButton}>
          <Image
            source={isLiked ? likedIcon : likeIcon}
            style={styles.likeIcon}
          />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#e3e3e3",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 2,
  },
  rankLine: {
    fontSize: 14,
    color: "#555555",
    marginBottom: 2,
  },
  rankPrefix: {
    color: "#777777",
  },
  rankTitle: {
    fontWeight: "600",
    color: "#000000",
  },
  ratingLine: {
    fontSize: 14,
    color: "#b0b0b0",
  },
  ratingValue: {
    color: "#b0b0b0",
    fontWeight: "500",
  },
  rightBlock: {
    alignItems: "center",
    marginLeft: 8,
  },
  profilePic: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 11,
    color: "#777777",
  },
  description: {
    fontSize: 14,
    color: "#333333",
    marginTop: 8,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  likesText: {
    fontSize: 13,
    color: "#777777",
  },
  heartButton: {
    marginLeft: "auto",
  },
  likeIcon: {
    width: 24,
    height: 24,
  },
});

export default FeedItem;
