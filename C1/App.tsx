import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Pressable,
} from "react-native";
import { useState, useEffect } from "react";

import Header from "./App/Components/Header";
import NavBar from "./App/Components/NavBar";
import SearchBar from "./App/Components/SearchBar";

import Feed from "./App/Components/FeedBar";
import MyCarousel from "./App/Components/Carousel";

const searchLeft = "Recent Movies";
const searchRight = "See All";
const feedText = "Your Feed";

export default function App() {
  return (
    <View style={styles.container}>
      <Header />
      <SearchBar />

      <View style={styles.bufferBar}>
        <Text style={styles.bufferLeft}>{searchLeft}</Text>
        <Text style={styles.bufferRight}>{searchRight}</Text>
      </View>
      {/* carousel */}
      <MyCarousel />
      <View style={styles.feedBar}>
        <Text style={styles.bufferFeedText}>{feedText}</Text>
      </View>
      {/* scrollable feed */}
      <Feed />
      <NavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "flex-start",
  },
  header: {
    flex: 1,
    alignItems: "flex-start",
    justifyContent: "space-between", // it's between two parts
  },
  bufferBar: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between", // modify so they are spaced apart
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
    justifyContent: "space-between", // modify so they are spaced apart
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
    marginBottom: "1.5%",
  },
});
