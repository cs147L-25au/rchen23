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

// import { useFonts } from "expo-font";
// import { Themes } from "./assets/Themes";
// import Header from "./app/components/Header";
// import Body from "./app/components/Body";
// import Footer from "./app/components/Footer";

const searchLeft = "Recent Movies";
const searchRight = "See All";

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
      {/* scrollable feed */}
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
    width: "100%",
  },
  bufferLeft: {
    fontSize: 20,
    color: "#000000",
    fontFamily: "Helvetica",
    fontWeight: "condensedBold",
    // fontStyle: "italic",
  },
  bufferRight: {
    fontSize: 14,
    color: "#666565ff",
    fontFamily: "Helvetica",
    marginRight: "1%",
  },
});
