import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import Header from "../../components/Header";
import NavBar from "../../components/NavBar";
import SearchBar from "../../components/SearchBar";
import SearchResults from "../../components/SearchResults";

import { TMDBMediaResult } from "../../TMDB";

const SearchScreen: React.FC = () => {
  const router = useRouter();
  const [searchResults, setSearchResults] = useState<TMDBMediaResult[]>([]);

  const isSearching = searchResults.length > 0;

  return (
    <View style={styles.container}>
      {/* Make header pressable → go to settings */}
      <Pressable onPress={() => router.push("/(tabs)/settings")}>
        <Header />
      </Pressable>

      <SearchBar onResults={setSearchResults} />

      {isSearching && <SearchResults results={searchResults} />}

      <NavBar />
      <StatusBar style="auto" />
    </View>
  );
};

export default SearchScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    width: "100%",
  },
});
