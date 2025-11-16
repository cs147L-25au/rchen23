// app/(tabs)/feed.tsx
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import MyCarousel from "../../components/Carousel";
import FeedBar from "../../components/FeedBar";
import Header from "../../components/Header";
import NavBar from "../../components/NavBar";
import SearchResults from "../../components/SearchResults";

import { TMDBMediaResult } from "../../TMDB";

const searchLeft = "Recommended Movies";
const searchRight = "See All";
const feedText = "Your Feed";
const searchBarText = "Search a movie, TV show, member, etc";

const HomeScreen: React.FC = () => {
  const router = useRouter();
  const [searchResults, setSearchResults] = useState<TMDBMediaResult[]>([]);

  const isSearching = searchResults.length > 0;

  return (
    <View style={styles.container}>
      {/* Make header pressable → go to settings */}
      <Pressable onPress={() => router.push("/(tabs)/settings")}>
        <Header />
      </Pressable>

      {/* Make the whole bar pressable and push to /search */}
      <Pressable onPress={() => router.push("/(tabs)/search")}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={searchBarText}
            placeholderTextColor="#999999"
            editable={false}
            pointerEvents="none"
          />
        </View>
      </Pressable>

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

            {/* This is the DB-backed list */}
            <FeedBar />
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
  searchContainer: {
    paddingHorizontal: "3%",
    paddingVertical: "3%",
    backgroundColor: "#ffffff",
    width: "100%",
  },
  searchInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingHorizontal: "2%",
    paddingVertical: "0%",
    fontSize: 14,
    color: "#000000",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    width: "100%",
    height: 36,
    minWidth: "100%",
    fontFamily: "DM Sans",
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
