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

  // Header Items:
  StatusBar.setBarStyle(Themes.light.statusBar);
  const userName: string = "James Landay";
  const userPronouns: string = "he/him/his";

  const Modes = [
    require("./assets/Icons/sun.png"),
    require("./assets/Icons/moon.png"),
  ];

  return (
    /* Header */
    <View style={styles.container} onLayout={onLayoutRootView}>
      <View style={styles.Header}>
        <View style={styles.textContainer}>
          <Text style={styles.Name}>{userName}</Text>
          <Text style={styles.Pronouns}>{userPronouns}</Text>
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

      <Body />

      {/* Footer: Navigation Bar at Bottom */}
      <View style={styles.navigationBar}>
        <View style={styles.iconBox}>
          <View style={styles.navigationItem}>
            <Image
              style={styles.navigationIcons}
              source={require("./assets/Icons/discover_light.png")}
            />
            <Text style={styles.iconTexts}>Discover</Text>
          </View>
          <View style={styles.navigationItem}>
            <Image
              style={styles.navigationIcons}
              source={require("./assets/Icons/heart_light.png")}
            />
            <Text style={styles.iconTexts}>Matches</Text>
          </View>
          <View style={styles.navigationItem}>
            <Image
              style={styles.navigationIcons}
              source={require("./assets/Icons/messages_light.png")}
            />
            <Text style={styles.iconTexts}>DMs</Text>
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
    backgroundColor: Themes.light.bg,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  Header: {
    display: "flex",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
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
  navigationBar: {
    display: "flex",
    width: "100%",
    backgroundColor: Themes.light.navigation,
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
    marginBottom: "2%",
  },
  navigationIcons: {
    height: 35,
    width: 35,
    marginTop: 5,
    marginBottom: 5,
  },
  iconTexts: {
    fontSize: 14,
    fontFamily: "Sydney",
    color: Themes.light.textSecondary,
  },
});
