import { useState, useEffect, useMemo } from "react";
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
import SearchBar from "./components/SearchBar";

const spotifyLogo = require("./assets/spotify-logo.png");

WebBrowser.maybeCompleteAuthSession();

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [searchText, setSearchText] = useState(""); // create a useState for the searchBar
  const isSearching = query.trim().length > 0;

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
    /***** END PART 4: Display Song List. See also Song.tsx */
  } /* Search Bar */
  // Filter according to YOUR Track type (songTitle, songArtists[], albumName)
  const displayedTracks = useMemo(() => {
    if (!tracks) return [];
    const lowerQuery = query.trim().toLowerCase();
    if (!lowerQuery) return tracks;

    return tracks.filter((t) => {
      const artists = t.songArtists?.map((a) => a.name).join(" ") ?? "";
      const haystack = `${t.songTitle} ${artists} ${
        t.albumName ?? ""
      }`.toLowerCase();
      return haystack.includes(lowerQuery);
    });
  }, [tracks, query]);
  if (!token) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={[styles.container, { justifyContent: "center" }]}>
          <StatusBar barStyle="light-content" />
          {content}
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />

        <View style={styles.headerSection}>
          <View style={styles.headerRow}>
            <Image source={spotifyLogo} style={styles.headerLogo} />
            <Text style={styles.headerTitle}>My Top Tracks</Text>
          </View>
        </View>

        <SearchBar onSearch={setQuery} />

        <View style={{ flex: 1, width: "100%" }}>
          <FlatList
            data={displayedTracks}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item, index }) => (
              <Song track={item} index={index} />
            )}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {isSearching ? "No results found." : "No tracks to show."}
              </Text>
            }
          />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Themes.colors.background,
    alignItems: "center",
  },

  /* Auth button */
  authButton: {
    flexDirection: "row",
    gap: 8,
    borderRadius: 40,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Themes.colors.spotify,
    alignItems: "center",
  },
  authButtonText: {
    fontSize: 12,
    fontWeight: "bold",
    color: Themes.colors.white,
    textTransform: "uppercase",
    textAlign: "center",
  },
  authButtonIcon: {
    height: 18,
    width: 18,
  },

  /* Header */
  headerSection: {
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Themes.colors.darkGray,
    alignItems: "center",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "center",
  },
  headerLogo: {
    width: 22,
    height: 22,
    resizeMode: "contain",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: Themes.colors.white,
    textAlign: "center",
  },

  /* List */
  listContent: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 16,
  },

  emptyText: {
    color: Themes.colors.white,
    textAlign: "center",
    marginTop: 24,
    fontSize: 16,
  },
});
