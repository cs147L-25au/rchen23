import { StyleSheet, TextInput, View } from "react-native";
import React, { useState } from "react";

const searchBarText = "Search a movie, TV show, member, etc";

const SearchBar = () => {
  const [searchText, setSearchText] = useState("");

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
    paddingHorizontal: "4%",
    paddingVertical: "3%",
    backgroundColor: "#ffffff",
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
    minWidth: "100%",
    fontFamily: "DM Sans",
  },
});

export default SearchBar;
