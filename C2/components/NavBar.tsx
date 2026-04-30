import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router, usePathname, type Href } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "../contexts/ThemeContext";
import { ThemeColors } from "../constants/theme";

/** Reserve this much space at the bottom; bar is `position: absolute` and overlays content. */
export const NAVBAR_HEIGHT = 88;

const NavBar = () => {
  const pathname = usePathname();
  const { colors: t } = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const isActive = (targets: string[]) => targets.includes(pathname);

  const goTo = (target: Href, alts: string[] = []) => {
    const targets = [target as string, ...alts];
    if (isActive(targets)) return;
    router.replace(target);
  };

  const feedTargets = ["/(tabs)/feed", "/feed"];
  const listTargets = ["/(tabs)/list", "/list"];
  const searchTargets = ["/(tabs)/search", "/search"];
  const leaderboardTargets = ["/(tabs)/leaderboard", "/leaderboard"];
  const profileTargets = ["/(tabs)/settings", "/settings"];

  return (
    <View style={styles.navigationContainer}>
      <View style={styles.iconBox}>
        {/* FEED */}
        <Pressable
          style={styles.navigationItem}
          onPress={() => goTo("/(tabs)/feed", ["/feed"])}
        >
          <Ionicons
            name="newspaper-outline"
            size={isActive(feedTargets) ? 34 : 30}
            color={isActive(feedTargets) ? t.primary : t.textMuted}
          />
          <Text
            style={[
              styles.iconTexts,
              isActive(feedTargets) && styles.iconTextActive,
            ]}
          >
            Feed
          </Text>
        </Pressable>

        {/* LIST */}
        <Pressable
          style={styles.navigationItem}
          onPress={() => goTo("/(tabs)/list", ["/list"])}
        >
          <Ionicons
            name="list-outline"
            size={isActive(listTargets) ? 34 : 30}
            color={isActive(listTargets) ? t.primary : t.textMuted}
          />
          <Text
            style={[
              styles.iconTexts,
              isActive(listTargets) && styles.iconTextActive,
            ]}
          >
            List
          </Text>
        </Pressable>

        {/* SEARCH */}
        <Pressable
          style={styles.navigationItem}
          onPress={() => goTo("/(tabs)/search", ["/search"])}
        >
          <FontAwesome5
            name="search-plus"
            size={isActive(searchTargets) ? 34 : 30}
            color={isActive(searchTargets) ? t.primary : t.textMuted}
          />
          <Text
            style={[
              styles.iconTexts,
              isActive(searchTargets) && styles.iconTextActive,
            ]}
          >
            Search
          </Text>
        </Pressable>

        {/* LEADERBOARD */}
        <Pressable
          style={styles.navigationItem}
          onPress={() => goTo("/(tabs)/leaderboard", ["/leaderboard"])}
        >
          <FontAwesome5
            name="trophy"
            size={28}
            color={isActive(leaderboardTargets) ? t.primary : t.textMuted}
          />
          <Text
            style={[
              styles.iconTexts,
              isActive(leaderboardTargets) && styles.iconTextActive,
            ]}
          >
            Leaderboard
          </Text>
        </Pressable>

        {/* PROFILE */}
        <Pressable
          style={styles.navigationItem}
          onPress={() => goTo("/(tabs)/settings", ["/settings"])}
        >
          <MaterialIcons
            name="account-circle"
            size={isActive(profileTargets) ? 34 : 30}
            color={isActive(profileTargets) ? t.primary : t.textMuted}
          />
          <Text
            style={[
              styles.iconTexts,
              isActive(profileTargets) && styles.iconTextActive,
            ]}
          >
            Profile
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const makeStyles = (t: ThemeColors) =>
  StyleSheet.create({
    navigationContainer: {
      flexDirection: "row",
      backgroundColor: t.navBar,
      borderColor: t.border,
      borderTopWidth: 1,
      width: "100%",
      height: NAVBAR_HEIGHT,
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
    },
    iconBox: {
      flexDirection: "row",
      justifyContent: "space-evenly",
      alignItems: "center",
      width: "100%",
    },
    navigationItem: {
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      flex: 1,
    },
    iconTexts: {
      fontSize: 12.5,
      fontFamily: "Helvetica",
      color: t.textMuted,
      marginTop: 4,
      textAlign: "center",
    },
    iconTextActive: {
      color: t.primary,
    },
  });

export default NavBar;
