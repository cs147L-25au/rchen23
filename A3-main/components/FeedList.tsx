import { useState, useEffect } from "react";
import { StyleSheet, FlatList, RefreshControl, Alert } from "react-native";

import Theme from "@/assets/theme";
import Post from "@/components/Post";
import Loading from "@/components/Loading";

import timeAgo from "@/utils/timeAgo";

import useSession from "@/utils/useSession";
import db from "@/database/db";

import type { PostSelect } from "@/types";

type FeedListProps = {
  shouldNavigateToComments?: boolean;
  fetchUsersPostsOnly?: boolean;
};

export default function FeedList({
  shouldNavigateToComments = false,
  fetchUsersPostsOnly = false,
}: FeedListProps) {
  const [posts, setPosts] = useState<PostSelect[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const session = useSession();

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
      // TODO: Write the code to fetch the posts from the posts table
      // Write your code here
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
