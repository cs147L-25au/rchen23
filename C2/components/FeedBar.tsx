import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { getAllRatings, RatingPost } from "../database/queries";
import FeedItem from "./FeedItem";

const DEFAULT_PROFILE_PIC =
  "https://eagksfoqgydjaqoijjtj.supabase.co/storage/v1/object/public/RC_profile/profile_pic.png";

const likeIcon = require("../assets/Icons/like_icon.png");
const likedIcon = require("../assets/Icons/liked_heart.png");

const Feed: React.FC = () => {
  const [ratings, setRatings] = useState<RatingPost[]>([]);
  const [liked, setLiked] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRatings();
  }, []);

  const loadRatings = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getAllRatings();
      setRatings(data);
    } catch (err) {
      console.error("Failed to load ratings:", err);
      setError("Failed to load feed");
    } finally {
      setLoading(false);
    }
  };

  const renderFeedItem = ({ item }: { item: RatingPost }) => {
    // Format score display
    const ratingText = item.score != null ? item.score.toFixed(1) : "";

    // Get category label
    const categoryLabel =
      item.category === "good"
        ? "Liked"
        : item.category === "alright"
          ? "It was fine"
          : item.category === "bad"
            ? "Disliked"
            : "Rated";

    return (
      <FeedItem
        userName="User" // Would need to join with profiles for actual name
        action={`${categoryLabel}`}
        title={item.title}
        rating={ratingText}
        profileImage={{ uri: DEFAULT_PROFILE_PIC }}
        timestamp={formatDate(item.created_at)}
        description={item.review_body || ""}
        isLiked={liked[item.rating_id] === 1}
        likeCount={0} // No like tracking in current schema
        onPress={() => {
          setLiked((prev) => ({
            ...prev,
            [item.rating_id]: prev[item.rating_id] === 1 ? 0 : 1,
          }));
        }}
        likeIcon={likeIcon}
        likedIcon={likedIcon}
      />
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
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

  if (ratings.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No ratings yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={ratings}
        renderItem={renderFeedItem}
        keyExtractor={(item) => item.rating_id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={true}
        scrollEnabled={true}
      />
    </View>
  );
};

const formatDate = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: "3%",
    paddingTop: "5%",
    width: "100%",
    paddingBottom: "25%",
  },
  list: {
    gap: 10,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#ff0000",
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
  },
});

export default Feed;
