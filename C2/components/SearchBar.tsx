import React, { useEffect, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { TMDBMediaResult, searchTMDB } from "../TMDB";

const searchBarText = "Search a movie, TV show, member, etc";

interface SearchBarProps {
  onResults: (results: TMDBMediaResult[]) => void;
  onFocus?: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onResults, onFocus }) => {
  const [searchText, setSearchText] = useState("");
  const [lastQueried, setLastQueried] = useState("");

  useEffect(() => {
    if (searchText.trim().length === 0) {
      onResults([]);
      setLastQueried("");
      return;
    }

    if (searchText === lastQueried) return;

    (async () => {
      try {
        const results = await searchTMDB(searchText);
        onResults(results);
        setLastQueried(searchText);
      } catch (err) {
        console.error("TMDB search error:", err);
        onResults([]);
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
        onFocus={onFocus}
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
