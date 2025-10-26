// components/SearchBar.tsx
import React, { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { Themes } from "../assets/Themes";

interface SearchBarProps {
  onSearch: (query: string) => void;
}

const SearchBar = ({ onSearch }: SearchBarProps) => {
  const [searchText, setSearchText] = useState("");

  const handleTextChange = (text: string) => {
    setSearchText(text);
    if (text.trim()) onSearch(text);
  };

  return (
    <View style={styles.searchContainer}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search for a song..."
        placeholderTextColor="#B3B3B3"
        value={searchText}
        onChangeText={handleTextChange}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 12,
  },
  searchInput: {
    width: "95%",
    backgroundColor: Themes.colors.darkGray,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: Themes.colors.white,
    borderWidth: 1,
    borderColor: Themes.colors.gray,
    height: 40,
  },
});

export default SearchBar;
