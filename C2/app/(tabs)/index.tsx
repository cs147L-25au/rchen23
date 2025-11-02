import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import MyCarousel from "../../components/Carousel";
import Feed from "../../components/FeedBar";
import Header from "../../components/Header";
import NavBar from "../../components/NavBar";
import SearchBar from "../../components/SearchBar";
import SearchResults from "../../components/SearchResults";

import { TMDBMediaResult } from "../../TMDB";

const searchLeft = "Recent Movies";
const searchRight = "See All";
const feedText = "Your Feed";

const HomeScreen: React.FC = () => {
  const [searchResults, setSearchResults] = useState<TMDBMediaResult[]>([]);

  const isSearching = searchResults.length > 0;

  return (
    <View style={styles.container}>
      <Header />

      <SearchBar onResults={setSearchResults} />

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
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    width: "100%",
  },

  mainContent: {
    flex: 1,
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
