import { StyleSheet, View } from "react-native";

import FontAwesome from "@expo/vector-icons/FontAwesome";
import { StatusBar } from "expo-status-bar";
import { Link } from "expo-router";

import Theme from "@/assets/theme";
import FeedList from "@/components/FeedList";

export default function NewFeed() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <FeedList shouldNavigateToComments={true} fetchUsersPostsOnly={false} />
      <Link href="../newpost" style={styles.postButtonContainer}>
        <View style={styles.postButton}>
          <FontAwesome size={32} name="plus" color={Theme.colors.textPrimary} />
        </View>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: Theme.colors.backgroundPrimary,
  },
  postButtonContainer: {
    position: "absolute",
    right: 8,
    bottom: 8,
  },
  postButton: {
    backgroundColor: Theme.colors.iconHighlighted,
    height: 48,
    width: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 2,
    paddingLeft: 1,
  },
});
