import { StyleSheet, TextInput, View } from "react-native";
import React, { useState, useEffect } from "react";
import { TMDBMediaResult, searchTMDB } from "./TMDB";

const searchBarText = "Search a movie, TV show, member, etc";

interface SearchBarProps {
  onResults: (results: TMDBMediaResult[]) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onResults }) => {
  const [searchText, setSearchText] = useState("");
  const [lastQueried, setLastQueried] = useState(""); // prevents spamming same query

  useEffect(() => {
    // if empty, clear results
    if (searchText.trim().length === 0) {
      onResults([]);
      setLastQueried("");
      return;
    }

    // lightweight "debounce": only fire if text actually changed
    if (searchText === lastQueried) return;

    // async IIFE inside useEffect
    (async () => {
      try {
        const results = await searchTMDB(searchText);
        onResults(results);
        setLastQueried(searchText);
      } catch (err) {
        console.error("TMDB search error:", err);
        onResults([]); // fail safe
      }
    })();
  }, [searchText, lastQueried, onResults]);

  return (
    <View style={styles.searchContainer}>
      <TextInput
        style={styles.searchInput}
        placeholder={searchBarText}
        placeholderTextColor="#999999"
        value={searchText}
        onChangeText={setSearchText}
      />
    </View>
  );
};

const styles = StyleSheet.create({
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
});

export default SearchBar;
