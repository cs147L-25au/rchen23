import { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  Pressable,
  Image,
  StatusBar,
  FlatList,
  View,
  TextInput,
} from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";

import getEnv from "./utils/env";
import { Themes } from "./assets/Themes";
import { useSpotifyAuth } from "./utils/useSpotifyAuth";

import { Track } from "./utils/types";
import {
  getAlbumTracks,
  exchangeCodeForToken,
  getMyTopTracks,
} from "./utils/apiOptions";

import Song from "./components/Song";

WebBrowser.maybeCompleteAuthSession();

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [searchText, setSearchText] = useState(""); // create a useState for the searchBar
  const spotifyLogo = require("./assets/icon.png");

  /****** PART 2: Authentication */
  const { authResponse, getSpotifyAuth } = useSpotifyAuth();

  useEffect(() => {
    if (authResponse?.access_token && !token) {
      setToken(authResponse.access_token);
    }
  }, [authResponse, token]);

  /***** END PART 2: Authentication */

  /****** PART 3: Get Tracks */

  const [tracks, setTracks] = useState<Track[] | null>(null);

  useEffect(() => {
    if (token) {
      getAlbumTracks(getEnv().ALBUM_ID, token)
        .then((data) => {
          setTracks(data);
        })
        .catch((e) => console.error(e));
    } else {
      setTracks(null);
    }
  }, [token]);

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
      <View style={{ flex: 1, width: "100%" }}>
        <FlatList
          data={tracks !== null ? tracks : []}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item, index }) => <Song track={item} index={index} />}
          contentContainerStyle={{ paddingHorizontal: 8, paddingTop: 8 }}
        />
      </View>
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
  },
  tracksContainer: {
    flex: 1,
    width: "100%",
    marginHorizontal: "3%",
  },
  headerSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Themes.colors.darkGray,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: Themes.colors.white,
  },
  searchContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: Themes.colors.background,
  },
  searchInput: {
    backgroundColor: Themes.colors.darkGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Themes.colors.white,
    borderWidth: 1,
    borderColor: Themes.colors.gray,
  },
  listContent: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 16,
  },
  emptyText: {
    color: Themes.colors.white,
    textAlign: "center",
    marginTop: 32,
    fontSize: 16,
  },
});
