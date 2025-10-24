import { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  Pressable,
  Image,
  StatusBar,
} from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";

import getEnv from "./utils/env";
import { Themes } from "./assets/Themes";
import { useSpotifyAuth } from "./utils/useSpotifyAuth";

WebBrowser.maybeCompleteAuthSession();

export default function App() {
  const [token, setToken] = useState<string | null>(null);

  /****** PART 2: Authentication */

  // Custom hook handles the full auth flow for you.
  const { authResponse, getSpotifyAuth } = useSpotifyAuth();

  // TODO: Figure out how to set `token` properly!
  // Hint: Use the useEffect hook.
  
  /***** END PART 2: Authentication */


  /****** PART 3: Get Tracks */

  // TODO: Figure out how to fetch the tracks! You got this.

  /***** END PART 3: Get Tracks */

  
  /****** PART 4: Display Song List. See also Song.tsx */

  // Conditionally render the UI based on whether we have a token or not.
  let content = null;
  if (!token) {
    content = (
      <Pressable style={styles.authButton} onPress={() => getSpotifyAuth()}>
        <Image
          source={require("./assets/spotify-logo.png")}
          style={styles.authButtonIcon}
        />
        <Text style={styles.authButtonText}>Connect with Spotify</Text>
      </Pressable>
    );
  } else {
    // If we have the token, display the tracks
    content = (
      <Text style={styles.text}>TODO: Replace this and display tracks here</Text>
    );
  }
  /***** END PART 4: Display Song List. See also Song.tsx */

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        {content}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Themes.colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  authButton: {
    flexDirection: "row",
    gap: 5,
    borderRadius: 40,
    padding: 12,
    backgroundColor: Themes.colors.spotify,
    alignItems: "center",
    justifyContent: "center",
  },
  authButtonText: {
    fontSize: 12,
    fontWeight: "bold",
    color: Themes.colors.white,
    textTransform: "uppercase",
    textAlign: "center",
  },
  authButtonIcon: {
    height: 15,
    width: 15,
  },
  text: {
    color: Themes.colors.white,
  }
});
