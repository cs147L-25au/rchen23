import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { getAllPosts, Post, updatePostLikes } from "../database/queries";
import FeedItem from "./FeedItem";

const likeIcon = require("../assets/Icons/like_icon.png");
const likedIcon = require("../assets/Icons/liked_heart.png");

const Feed = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [liked, setLiked] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllPosts();
      setPosts(data);
    } catch (err) {
      console.error("Failed to load posts:", err);
      setError("Failed to load feed");
    } finally {
      setLoading(false);
    }
  };

  const renderFeedItem = ({ item }: { item: Post }) => (
    <FeedItem
      userName={item.user?.display_name || "Unknown"}
      action={item.action_type === "rating" ? "Ranked" : "Commented"}
      title={item.movie_name}
      rating={item.action_type === "rating" ? "9.0" : ""}
      profileImage={
        item.user?.profile_pic
          ? { uri: item.user.profile_pic }
          : require("../assets/PFPs/Luke_pfp.png")
      }
      timestamp={formatDate(item.created_at)}
      description=""
      isLiked={liked[item.id] === 1}
      likeCount={item.like_count + (liked[item.id] === 1 ? 1 : 0)}
      onPress={async () => {
        setLiked((prev) => ({
          ...prev,
          [item.id]: prev[item.id] === 1 ? 0 : 1,
        }));
        await updatePostLikes(item.id, 1);
      }}
      likeIcon={likeIcon}
      likedIcon={likedIcon}
    />
  );

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

  if (posts.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No posts yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        renderItem={renderFeedItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={true}
        scrollEnabled={true}
      />
    </View>
  );
};

const formatDate = (dateString: string) => {
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
