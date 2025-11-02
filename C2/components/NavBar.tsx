import { router, usePathname, type Href } from "expo-router";
import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

const feedIcon = require("../assets/Icons/feed_icon.png");
const listIcon = require("../assets/Icons/list_icon.png");
const playIcon = require("../assets/Icons/play_button.png");
const trophyIcon = require("../assets/Icons/leader_icon.png");
const settingsIcon = require("../assets/Icons/setting_icon.png");

const NavBar = () => {
  const pathname = usePathname();

  // helper function to navigate to different tabs/screens
  const goTo = (target: Href, alts: string[] = []) => {
    // if current path matches the main target OR any alt versions, do nothing
    if (pathname === target || alts.includes(pathname)) {
      return;
    }
    router.replace(target);
  };

  return (
    <View style={styles.navigationContainer}>
      <View style={styles.iconBox}>
        {/* feed/index screen */}
        <Pressable
          style={styles.navigationItem}
          onPress={() => {
            if (
              pathname === "/(tabs)" ||
              pathname === "/(tabs)/index" ||
              pathname === "/" ||
              pathname === "/index"
            ) {
              return;
            }
            router.replace("/(tabs)" as Href);
          }}
        >
          <Image
            style={styles.navigationIcons}
            resizeMode="contain"
            source={feedIcon}
          />
          <Text style={styles.iconTexts}>Feed</Text>
        </Pressable>

        {/* list */}
        <Pressable
          style={styles.navigationItem}
          onPress={() => {
            goTo("/(tabs)/list", ["/list"]);
          }}
        >
          <Image
            style={styles.navigationIcons}
            resizeMode="contain"
            source={listIcon}
          />
          <Text style={styles.iconTexts}>List</Text>
        </Pressable>

        {/* play */}
        <Pressable
          style={styles.navigationItem}
          onPress={() => {
            goTo("/(tabs)/play", ["/play"]);
          }}
        >
          <Image
            style={styles.navigationIcons}
            resizeMode="contain"
            source={playIcon}
          />
          <Text style={styles.iconTexts}>Play</Text>
        </Pressable>

        {/* leaderboard */}
        <Pressable
          style={styles.navigationItem}
          onPress={() => {
            goTo("/(tabs)/leaderboard", ["/leaderboard"]);
          }}
        >
          <Image
            style={styles.navigationIcons}
            resizeMode="contain"
            source={trophyIcon}
          />
          <Text style={styles.iconTexts}>Leaderboard</Text>
        </Pressable>

        {/* settings */}
        <Pressable
          style={styles.navigationItem}
          onPress={() => {
            goTo("/(tabs)/settings", ["/settings"]);
          }}
        >
          <Image
            style={styles.navigationIcons}
            resizeMode="contain"
            source={settingsIcon}
          />
          <Text style={styles.iconTexts}>Settings</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  navigationContainer: {
    flexDirection: "row",
    backgroundColor: "#ffffffff",
    borderColor: "#cbcbcbff",
    borderTopWidth: 1,
    width: "100%",
    height: 80,

    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  iconBox: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    gap: "1%",
    paddingLeft: "1%",
    width: "100%",
  },
  navigationItem: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    marginTop: "2%",
    marginBottom: "5.5%",
    flex: 1,
  },
  navigationIcons: {
    height: 40,
    width: 40,
    marginTop: "10%",
    resizeMode: "contain",
    borderRadius: 17.5,
    backgroundColor: "#ffffff20",
    justifyContent: "center",
    alignItems: "center",
  },
  iconTexts: {
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#00000080",
  },
});

export default NavBar;
