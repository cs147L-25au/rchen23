import { useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Alert } from "react-native";

import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Link } from "expo-router";

import Theme from "@/assets/theme";

import useSession from "@/utils/useSession";
import db from "@/database/db";
import { LikeInsert } from "@/types";

type PostProps = {
  shouldNavigateOnPress?: boolean;
  id: string;
  username: string | null;
  timestamp: string;
  text: string;
  currentLikeCount: number;
  currentUserVote?: number;
  commentCount: number;
};

export default function Post({
  shouldNavigateOnPress = false,
  id,
  username,
  timestamp,
  text,
  currentLikeCount,
  currentUserVote = 0,
  commentCount,
}: PostProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [vote, setVote] = useState<number>(currentUserVote);
  const [score, setScore] = useState<number>(currentLikeCount);

  const session = useSession();

  const submitVote = async (newVote: -1 | 0 | 1) => {
    // Don't prevent the user from submitting multiple votes using if (isLoading), subsequent votes will overwrite the previous vote.
    setIsLoading(true);

    try {
      if (!session) {
        setIsLoading(false);
        throw new Error("Session not found. You must be signed in to vote");
      }

      const newLike: LikeInsert = undefined;

      // Optimistic update
      setScore(score + (newVote - vote));
      setVote(newVote);

      // ================================
      // TODO: Write the code to submit a vote to the likes table
      // Hint: You will need to use an UPSERT to submit the vote to the likes table.
      // Write your code here
      // ================================
    } catch (error) {
      console.error("Error submitting vote:", error);
      Alert.alert("Error submitting vote");
    } finally {
      setIsLoading(false);
    }
  };

  let post = (
    <TouchableOpacity style={styles.content} disabled={!shouldNavigateOnPress}>
      <View style={styles.header}>
        <FontAwesome
          size={Theme.sizes.iconSmall}
          name="user"
          color={Theme.colors.iconSecondary}
        />
        <Text style={styles.username}>{username ?? "Anonymous"}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.text}>{text}</Text>
      </View>
      <View style={styles.footer}>
        <Text style={styles.timestamp}>{timestamp}</Text>
        <View style={styles.comment}>
          <FontAwesome
            size={Theme.sizes.iconSmall}
            name="comment"
            color={Theme.colors.iconSecondary}
          />
          <Text style={styles.commentCount}>{commentCount}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (shouldNavigateOnPress) {
    // ================================
    // TODO: Change the props on the Link component to
    // pass the necessary params from the relevant post
    // Write your code in the <Link> component below
    // ================================
    post = (
      <Link href={"/tabs/feed/details"} asChild={true} style={styles.content}>
        {post}
      </Link>
    );
  }

  const upvoteButton = (
    <TouchableOpacity
      onPress={() => (vote > 0 ? submitVote(0) : submitVote(1))}
      style={styles.upvoteButton}
      disabled={isLoading}
    >
      <FontAwesome
        size={16}
        name="chevron-up"
        color={
          vote > 0 ? Theme.colors.iconHighlighted : Theme.colors.iconSecondary
        }
      />
    </TouchableOpacity>
  );

  const downvoteButton = (
    <TouchableOpacity
      onPress={() => (vote < 0 ? submitVote(0) : submitVote(-1))}
      style={styles.downvoteButton}
      disabled={isLoading}
    >
      <FontAwesome
        size={16}
        name="chevron-down"
        color={
          vote < 0 ? Theme.colors.iconHighlighted : Theme.colors.iconSecondary
        }
      />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {post}
      <View style={styles.scoreContainer}>
        {upvoteButton}
        <Text style={styles.score}>{score}</Text>
        {downvoteButton}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    // padding: 24,
    paddingVertical: 12,
    paddingLeft: 20,
    paddingRight: 8,
    backgroundColor: Theme.colors.backgroundSecondary,
    flexDirection: "row",
  },
  content: {
    flex: 1,
    gap: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  body: {
    width: "100%",
  },
  footer: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
  },
  scoreContainer: {
    alignItems: "center",
    marginLeft: 16,
  },
  text: {
    color: Theme.colors.textPrimary,
    fontWeight: "bold",
    fontSize: Theme.sizes.textMedium,
  },
  username: {
    color: Theme.colors.textSecondary,
    fontWeight: "bold",
    marginLeft: 8,
  },
  timestamp: {
    color: Theme.colors.textSecondary,
    flex: 2,
  },
  comment: {
    flexDirection: "row",
    flex: 3,
  },
  commentCount: {
    color: Theme.colors.textSecondary,
    marginLeft: 8,
  },
  score: {
    color: Theme.colors.textHighlighted,
    fontWeight: "bold",
    fontSize: Theme.sizes.textLarge,
  },
  // Make sure the buttons have a lot of padding to increase the area of the touch target.
  upvoteButton: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
  },
  downvoteButton: {
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 8,
  },
});
