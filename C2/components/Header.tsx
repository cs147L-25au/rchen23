import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

const pfp = require("../assets/profile_pic.png");
const app_name = "MyFlix";

const Header = () => {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.nameSection}>
        <Text style={styles.appName}>{app_name}</Text>
      </View>
      <View style={styles.profileCircle}>
        <Image style={styles.profileImage} source={pfp} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    // modified from my A1
    display: "flex",
    flex: 0,
    paddingTop: "13%",
    paddingHorizontal: "5%",
    paddingBottom: "3%",
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#cbcbcbff",
  },
  nameSection: {
    flexDirection: "row",
    justifyContent: "center",
  },
  appName: {
    fontSize: 42,
    color: "#ef0e4aff",
    fontWeight: "condensedBold",
    fontStyle: "italic",
    fontFamily: "DM Sans",
  },
  profileCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  profileImage: {
    width: 52,
    height: 52,
    borderRadius: 25,
    resizeMode: "cover",
  },
});

export default Header;
