import { useLayoutEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  Alert,
  Keyboard,
} from "react-native";
import { useNavigation, useRouter } from "expo-router";

import Theme from "@/assets/theme";
import db from "@/database/db";
import useSession from "@/utils/useSession";

import type { PostInsert } from "@/types";

export default function NewPost() {
  const [username, setUsername] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const session = useSession();
  const router = useRouter();
  const navigation = useNavigation();

  const submitPost = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      if (!session) {
        setIsLoading(false);
        throw new Error("Session not found. You must be signed in to post");
      }

      // const newPost: PostInsert = undefined;

      // ================================
      // TODO: Write the code to submit a post to the posts table
      // Write your code here
      // ================================

      Alert.alert("Post submitted");
    } catch (error) {
      console.error("Error submitting post:", error);
      Alert.alert("Error submitting post");
    } finally {
      setIsLoading(false);
      Keyboard.dismiss();
    }
  };

  const submitDisabled = isLoading || inputText.length === 0;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Text style={styles.headerButtonTextSecondary}>Cancel</Text>
        </Pressable>
      ),
      headerRight: () => (
        <Pressable
          onPress={submitPost}
          disabled={submitDisabled}
          style={{
            opacity: submitDisabled ? 0.5 : 1,
            paddingHorizontal: 8,
            paddingVertical: 4,
          }}
        >
          <Text style={styles.headerButtonTextPrimary}>
            {isLoading ? "Posting…" : "Post"}
          </Text>
        </Pressable>
      ),
    });
  }, [navigation, submitDisabled, isLoading, inputText, username]);

  return (
    <View style={styles.container}>
      <View style={styles.nameInputContainer}>
        <Text style={styles.nameInputPrompt}>Post as:</Text>
        <TextInput
          style={styles.nameInput}
          value={username ?? ""}
          onChangeText={(text) => setUsername(text)}
          placeholder={"Anonymous"}
          placeholderTextColor={Theme.colors.textTertiary}
        />
      </View>
      <TextInput
        style={styles.input}
        value={inputText}
        onChangeText={setInputText}
        placeholder={"What do you want to share?"}
        placeholderTextColor={Theme.colors.textSecondary}
        multiline
        textAlignVertical="top"
        autoFocus
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: Theme.colors.backgroundPrimary,
  },
  nameInputContainer: {
    width: "100%",
    padding: 16,
    gap: 8,
  },
  nameInputPrompt: {
    color: Theme.colors.textPrimary,
  },
  nameInput: {
    color: Theme.colors.textSecondary,
  },
  headerButtonTextPrimary: {
    fontSize: 18,
    color: Theme.colors.textHighlighted,
  },
  headerButtonTextSecondary: {
    fontSize: 18,
    color: Theme.colors.textSecondary,
  },
  input: {
    color: Theme.colors.textPrimary,
    backgroundColor: Theme.colors.backgroundSecondary,
    flex: 1,
    width: "100%",
    padding: 16,
  },
  headerButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
});
