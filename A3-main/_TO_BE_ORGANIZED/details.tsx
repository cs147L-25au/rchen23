import { useState } from "react";
import {
  StyleSheet,
  Platform,
  View,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Keyboard,
  Alert,
} from "react-native";

import { useLocalSearchParams } from "expo-router";

import FontAwesome from "@expo/vector-icons/FontAwesome";

import Theme from "@/assets/theme";
import Post from "@/components/Post";
import CommentFeed from "@/components/CommentFeed";

import type { CommentInsert, PostSelect } from "@/types";
import useSession from "@/utils/useSession";
import { db } from "@/database";

type LocalSearchParamsType = {
  id: string;
  username: string;
  timestamp: string;
  text: string;
  like_count: string;
  current_user_vote: string;
  comment_count: string;
  user_id: string;
};

export default function Details() {
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const session = useSession();

  const localSearchParams = useLocalSearchParams<LocalSearchParamsType>();

  const postDetails: PostSelect = {
    id: localSearchParams.id,
    username: localSearchParams.username,
    timestamp: localSearchParams.timestamp,
    text: localSearchParams.text,
    like_count: Number(localSearchParams.like_count),
    current_user_vote: Number(localSearchParams.current_user_vote),
    comment_count: Number(localSearchParams.comment_count),
    user_id: localSearchParams.user_id,
  };

  const submitComment = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      if (!session) {
        setIsLoading(false);
        throw new Error("Session not found. You must be signed in to comment");
      }

      const newComment: CommentInsert = undefined;

      // ================================
      // TODO: Write the code to submit a comment to the comments table
      // Write your code here
      // ================================

      Alert.alert("Comment submitted");
    } catch (error) {
      console.error("Error submitting comment:", error);
      Alert.alert("Error submitting comment");
    } finally {
      setIsLoading(false);
      Keyboard.dismiss();
    }
  };

  const submitDisabled = isLoading || inputText.length === 0;

  return (
    <View style={styles.container}>
      <Post
        id={postDetails.id}
        username={postDetails.username}
        timestamp={postDetails.timestamp}
        text={postDetails.text}
        currentLikeCount={postDetails.like_count}
        currentUserVote={postDetails.current_user_vote}
        commentCount={postDetails.comment_count}
      />
      {/* This component pushes up the view when the keyboard is open so that it's still visible. */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 65 : 0}
        style={styles.keyboardContainer}
      >
        <CommentFeed postId={postDetails.id} />
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder={"Write a comment..."}
            placeholderTextColor={Theme.colors.textSecondary}
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={() => submitComment()}
            disabled={submitDisabled}
          >
            <FontAwesome
              size={24}
              name="send"
              color={
                submitDisabled
                  ? Theme.colors.iconSecondary
                  : Theme.colors.iconHighlighted
              }
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: Theme.colors.backgroundPrimary,
  },
  keyboardContainer: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: "row",
    width: "100%",
    padding: 8,
    alignItems: "center",
  },
  input: {
    paddingLeft: 12,
    marginRight: 8,
    height: 48,
    borderRadius: 24,
    color: Theme.colors.textPrimary,
    backgroundColor: Theme.colors.backgroundSecondary,
    flex: 1,
  },
  sendButton: {
    padding: 4,
  },
});
