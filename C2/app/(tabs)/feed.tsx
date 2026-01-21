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

const searchBarText = "Search a movie, TV show, member, etc.";

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

      {/* Search bar */}
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
            {/* Recent Movies section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Movies</Text>
              <Pressable onPress={() => router.push("/(tabs)/allMovies")}>
                <Text style={styles.seeAllText}>See All</Text>
              </Pressable>
            </View>

            <MyCarousel />

            {/* Feed section header */}
            <View style={styles.feedHeader}>
              <Text style={styles.feedTitle}>YOUR FEED</Text>
            </View>

            {/* Feed list */}
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#ffffff",
    width: "100%",
  },
  searchInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#000000",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    width: "100%",
  },
  mainContent: {
    flex: 1,
    width: "100%",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
  },
  seeAllText: {
    fontSize: 14,
    color: "#666",
  },
  feedHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  feedTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
    letterSpacing: 0.5,
  },
});
