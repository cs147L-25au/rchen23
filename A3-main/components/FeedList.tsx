import { useState, useEffect } from "react";
import { StyleSheet, FlatList, RefreshControl, Alert } from "react-native";

import Theme from "@/assets/theme";
import Post from "@/components/Post";
import Loading from "@/components/Loading";

import timeAgo from "@/utils/timeAgo";

import useSession from "@/utils/useSession";
import db from "@/database/db";

import type { PostSelect } from "@/types";
import { useRouter } from "expo-router";

type FeedListProps = {
  shouldNavigateToComments?: boolean;
  fetchUsersPostsOnly?: boolean;
  sortBy?: "recent" | "likes";
};

export default function FeedList({
  shouldNavigateToComments = false,
  fetchUsersPostsOnly = false,
  sortBy = "recent",
}: FeedListProps) {
  const [posts, setPosts] = useState<PostSelect[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      fetchPosts();
    }
  }, [session]);

  const fetchPosts = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      if (!session) {
        setIsLoading(false);
        throw new Error(
          "Session not found. You must be signed in to view posts"
        );
      }
      // ================================
      // Fetch posts from the posts table
      let query = db.from("posts").select("*");

      if (sortBy === "recent") {
        query = query.order("timestamp", { ascending: false });
      } else if (sortBy === "likes") {
        query = query.order("like_count", { ascending: false });
      }

      if (fetchUsersPostsOnly) {
        query = query.eq("user_id", session.user.id);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      setPosts(data as PostSelect[]);
      // ================================
    } catch (error) {
      console.error("Error fetching posts:", error);
      Alert.alert("Error fetching posts");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  if (isLoading && !isRefreshing) {
    return <Loading />;
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) =>
        `${item.id}-${item.like_count}-${item.current_user_vote}`
      }
      renderItem={({ item }) => (
        <Post
          shouldNavigateOnPress={shouldNavigateToComments}
          id={item.id}
          username={item.username ?? "Anonymous"}
          timestamp={timeAgo(item.timestamp)}
          text={item.text}
          currentLikeCount={item.like_count}
          currentUserVote={item.current_user_vote}
          commentCount={item.comment_count}
        />
      )}
      contentContainerStyle={styles.posts}
      style={styles.postsContainer}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => {
            setIsRefreshing(true);
            fetchPosts();
          }}
          tintColor={Theme.colors.textPrimary} // only applies to iOS
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: Theme.colors.backgroundPrimary,
  },
  postsContainer: {
    width: "100%",
  },
  posts: {
    gap: 8,
  },
});
