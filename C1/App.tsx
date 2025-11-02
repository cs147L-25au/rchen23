import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { useState } from "react";

import Header from "./App/Components/Header";
import NavBar from "./App/Components/NavBar";
import SearchBar from "./App/Components/SearchBar";
import Feed from "./App/Components/FeedBar";
import MyCarousel from "./App/Components/Carousel";
import SearchResults from "./App/Components/SearchResults";
import { TMDBMediaResult } from "./App/TMDB";

const searchLeft = "Recent Movies";
const searchRight = "See All";
const feedText = "Your Feed";

export default function App() {
  const [searchResults, setSearchResults] = useState<TMDBMediaResult[]>([]);

  const isSearching = searchResults.length > 0;

  return (
    <View style={styles.container}>
      <Header />

      <SearchBar onResults={setSearchResults} />

      {/* 👇 NEW: flex container for scrollable content */}
      <View style={styles.mainContent}>
        {isSearching ? (
          <SearchResults results={searchResults} />
        ) : (
          <>
            <View style={styles.bufferBar}>
              <Text style={styles.bufferLeft}>{searchLeft}</Text>
              <Text style={styles.bufferRight}>{searchRight}</Text>
            </View>

            <MyCarousel />

            <View style={styles.feedBar}>
              <Text style={styles.bufferFeedText}>{feedText}</Text>
            </View>

            <Feed />
          </>
        )}
      </View>

      <NavBar />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    width: "100%",
  },

  // 👇 this is the important new piece
  mainContent: {
    flex: 1, // take remaining vertical space
    width: "100%",
  },

  bufferBar: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: "4%",
    marginTop: "1%",
    width: "100%",
  },
  bufferLeft: {
    fontSize: 22,
    color: "#000000",
    fontFamily: "DM Sans",
    fontWeight: "500",
  },
  bufferRight: {
    fontSize: 14,
    color: "#666565ff",
    fontFamily: "DM Sans",
    marginRight: "1%",
  },
  feedBar: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: "4%",
    padding: 0,
    margin: 0,
    width: "95%",
    borderBottomWidth: 1,
    borderBottomColor: "#cbcbcbff",
  },
  bufferFeedText: {
    fontSize: 22,
    color: "#000000",
    fontFamily: "DM Sans",
    fontWeight: "500",
    marginRight: "1%",
    marginBottom: "1%",
  },
});
