/**
 * You don't need to edit this file, but you can if you want!
 * Almost of the work for this assignment is in Header.js, Body.js, and Footer.js.
 *
 * If you're doing the light/dark mode toggle extension, you will need to make
 * a couple tweaks here.
 */

import { useCallback } from "react";
import React, { useState } from "react";
import {
  StyleSheet,
  View,
  StatusBar,
  Text,
  Image,
  Pressable,
  Button,
} from "react-native";

import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";

import { Themes } from "./assets/Themes";
import Header from "./app/components/Header";
import Body from "./app/components/Body";
import Footer from "./app/components/Footer";

/* Keep the splash screen visible while we fetch resources */
SplashScreen.preventAutoHideAsync();

export default function App() {
  // move usedState to the top
  const [darkMode, setDarkMode] = useState(0);
  const [Liked, setLiked] = useState(0);

  /* BEGIN FONT LOADING CODE -- You don't need to touch this section unless you want to. */
  const [fontsLoaded] = useFonts({
    Sydney: require("./assets/Fonts/Sydney-Serial-Regular.ttf"),
    "Sydney-Bold": require("./assets/Fonts/Sydney-Serial-Bold.ttf"),
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;
  /* END FONT LOADING CODE */

  // If you want to use dark mode, change this accordingly.
  const themeMode = darkMode == 0 ? Themes.light : Themes.dark;

  // Header Items:
  StatusBar.setBarStyle(themeMode.statusBar);
  const userName: string = "James Landay";
  const userPronouns: string = "he/him/his";
  const audioTitle: string = "My hottest take";

  // load the photos for pressables
  const Modes = [
    require("./assets/Icons/sun.png"),
    require("./assets/Icons/moon.png"),
  ];

  const likesLightMode = [
    require("./assets/Icons/like_regular_light.png"),
    require("./assets/Icons/like_solid_light.png"),
  ];

  const likesDarkMode = [
    require("./assets/Icons/like_regular_dark.png"),
    require("./assets/Icons/like_solid_dark.png"),
  ];

  // ternary to adjust light and dark mode for likes
  const likeModeColor = darkMode == 0 ? likesLightMode : likesDarkMode;

  const audioPlayButton = [
    require("./assets/Icons/player_light.png"),
    require("./assets/Icons/player_dark.png"),
  ];

  const audioWaves = [
    require("./assets/Icons/audio_waveform_light.png"),
    require("./assets/Icons/audio_waveform_dark.png"),
  ];

  const heartIcon = [
    require("./assets/Icons/heart_light.png"),
    require("./assets/Icons/heart_dark.png"),
  ];

  const discoverIcon = [
    require("./assets/Icons/discover_light.png"),
    require("./assets/Icons/discover_dark.png"),
  ];

  const messagesIcon = [
    require("./assets/Icons/messages_light.png"),
    require("./assets/Icons/messages_dark.png"),
  ];

  return (
    /* Header */
    <View
      style={[styles.container, { backgroundColor: themeMode.bg }]}
      onLayout={onLayoutRootView}
    >
      <View style={styles.Header}>
        <View style={styles.textContainer}>
          <Text style={[styles.Name, { color: themeMode.text }]}>
            {userName}
          </Text>
          <Text style={[styles.Pronouns, { color: themeMode.text }]}>
            {userPronouns}
          </Text>
        </View>
        <Pressable
          onPress={() => {
            if (darkMode == 0) {
              setDarkMode(1);
            } else {
              setDarkMode(0);
            }
          }}
        >
          <Image style={styles.modeButton} source={Modes[darkMode]} />
        </Pressable>
      </View>

      {/* Profile Card */}
      <View
        style={[
          styles.profileCard,
          {
            backgroundColor: themeMode.bgSecondary,
            borderColor: themeMode.border,
          },
        ]}
      >
        <Text style={[styles.profileTitle, { color: themeMode.text }]}>
          Me and my best friend
        </Text>
        <View style={styles.profileImageContainer}>
          <Image
            source={require("./assets/Profiles/landay.jpg")}
            style={styles.profileImage}
            resizeMode="cover"
          />
          <Pressable
            style={[
              styles.likeButton,
              {
                backgroundColor: themeMode.bgSecondary,
                shadowColor: themeMode.shadows.shadowColor,
                shadowOpacity: themeMode.shadows.shadowOpacity,
                shadowRadius: themeMode.shadows.shadowRadius,
                shadowOffset: themeMode.shadows.shadowOffset,
              },
            ]}
            onPress={() => {
              if (Liked === 0) {
                setLiked(1);
              } else {
                setLiked(0);
              }
            }}
          >
            <Image style={styles.likeIcon} source={likeModeColor[Liked]} />
          </Pressable>
        </View>
      </View>

      {/* Audio Feature: between image and navigation bar */}
      <View
        style={[
          styles.audioCard,
          {
            backgroundColor: themeMode.bgSecondary,
            borderColor: themeMode.border,
          },
        ]}
      >
        <Text style={[styles.cardTitle, { color: themeMode.text }]}>
          {audioTitle}
        </Text>
        <View style={styles.audioLayout}>
          <Image
            source={audioPlayButton[darkMode]}
            style={styles.audioImage}
            resizeMode="contain"
          />
          <Image
            source={audioWaves[darkMode]}
            style={styles.audioWave}
            resizeMode="contain"
          />
        </View>
      </View>
      {/* Footer: Navigation Bar at Bottom */}
      <View
        style={[
          styles.navigationBar,
          { backgroundColor: themeMode.navigation },
        ]}
      >
        <View style={styles.iconBox}>
          <View style={styles.navigationItem}>
            <Image
              style={styles.navigationIcons}
              source={discoverIcon[darkMode]}
            />
            <Text
              style={[styles.iconTexts, { color: themeMode.textSecondary }]}
            >
              Discover
            </Text>
          </View>
          <View style={styles.navigationItem}>
            <Image
              style={styles.navigationIcons}
              source={heartIcon[darkMode]}
            />
            <Text
              style={[styles.iconTexts, { color: themeMode.textSecondary }]}
            >
              Matches
            </Text>
          </View>
          <View style={styles.navigationItem}>
            <Image
              style={styles.navigationIcons}
              source={messagesIcon[darkMode]}
            />
            <Text
              style={[styles.iconTexts, { color: themeMode.textSecondary }]}
            >
              DMs
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Feel free to change this if you want!
  container: {
    flex: 1,
    alignItems: "center",
  },
  /*Header*/
  Header: {
    display: "flex",
    flex: 0,
    paddingTop: "13%",
    paddingHorizontal: "6%",
    paddingBottom: "5%",
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  textContainer: {
    flexDirection: "column", // stack the name over pronoun vertically
    alignItems: "flex-start", // aligns top text to left of screen
  },
  modeButton: {
    height: 40,
    width: 40,
    margin: 4,
  },
  Name: {
    fontSize: 32,
    fontFamily: "Sydney-Bold",
    textAlign: "left",
  },
  Pronouns: {
    fontSize: 16,
    fontFamily: "Sydney",
    textAlign: "left",
  },
  /*Profile*/
  profileCard: {
    width: "90%",
    borderRadius: 15,
    borderWidth: 1,
  },
  profileTitle: {
    fontSize: 20,
    fontFamily: "Sydney-Bold",
    color: Themes.light.text,
    marginTop: "5%",
    marginBottom: "5%",
    paddingLeft: "4%",
    paddingRight: "4%",
  },
  profileImageContainer: {
    aspectRatio: 1, // make the image a square (1:1 ratio)
    width: "100%",
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    overflow: "hidden",
    position: "relative",
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
  likeButton: {
    position: "absolute",
    bottom: 10,
    right: 10,
    width: 50, // same as "13%"
    height: 50,
    borderRadius: 45,
    backgroundColor: Themes.light.bgSecondary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  likeIcon: {
    width: 30,
    height: 30,
  },

  /*Audio*/
  audioCard: {
    display: "flex",
    width: "90%",
    borderRadius: 15,
    borderWidth: 2,
    padding: "4%",
    marginVertical: "10%",
    marginHorizontal: "6%",
  },
  audioLayout: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    width: "100%",
  },
  cardTitle: {
    fontSize: 20,
    fontFamily: "Sydney-Bold",
    marginBottom: "3%",
  },
  audioImage: {
    width: 60,
    height: 60,
    marginRight: 15,
  },
  audioWave: {
    flex: 1,
    height: "100%",
    width: "100%",
  },

  /*Navigation*/
  navigationBar: {
    display: "flex",
    flex: 0,
    width: "100%",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  iconBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: "10%",
  },
  navigationItem: {
    flexDirection: "column", // stack icon above the text
    alignItems: "center",
    justifyContent: "center",
    marginTop: "2%",
    marginBottom: "10%",
  },
  navigationIcons: {
    height: 35,
    width: 35,
    marginTop: 5,
    marginBottom: 5,
    resizeMode: "contain",
  },
  iconTexts: {
    fontSize: 14,
    fontFamily: "Sydney",
  },
});
