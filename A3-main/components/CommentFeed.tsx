import { useState, useEffect } from "react";
import { StyleSheet, FlatList, RefreshControl, Text, View } from "react-native";

import Theme from "@/assets/theme";
import Comment from "./Comment";
import Loading from "./Loading";

import timeAgo from "@/utils/timeAgo";

import useSession from "@/utils/useSession";
import db from "@/database/db";
import type { CommentSelect } from "@/types";

type CommentFeedProps = {
  postId: string;
};
export default function CommentFeed({ postId }: CommentFeedProps) {
  const [comments, setComments] = useState<CommentSelect[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const session = useSession();

  const fetchComments = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      if (!session) {
        setIsLoading(false);
        throw new Error(
          "Session not found. You must be signed in to view comments"
        );
      }

      // ================================
      // TODO: Write the code to fetch the comments from the comments table
      // Write your code here
      // ================================
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // ================================
  // TODO: Write the code to trigger the comment fetching code when this component mounts
  // Write your code here
  // ================================

  if (isLoading && !isRefreshing) {
    return <Loading />;
  }

  return (
    <FlatList
      data={comments}
      renderItem={({ item }) => (
        <Comment
          username={item.username ?? "Anonymous"}
          timestamp={timeAgo(item.timestamp)}
          text={item.text}
        />
      )}
      contentContainerStyle={styles.posts}
      style={styles.postsContainer}
      ListEmptyComponent={<Text style={styles.emptyText}>No comments yet</Text>}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => {
            setIsRefreshing(true);
            fetchComments();
          }}
          tintColor={Theme.colors.textPrimary} // only applies to iOS
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  postsContainer: {
    marginTop: 24,
  },
  posts: {
    gap: 8,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 24,
    color: Theme.colors.textSecondary,
  },
});
