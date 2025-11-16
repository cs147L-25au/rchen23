import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router, usePathname, type Href } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

const NavBar = () => {
  const pathname = usePathname();

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
            color={isActive(feedTargets) ? "#000000" : "#00000070"}
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
            color={isActive(listTargets) ? "#000000" : "#00000070"}
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
            color={isActive(searchTargets) ? "#000000" : "#00000070"}
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
            size={isActive(leaderboardTargets) ? 32 : 28}
            color={isActive(leaderboardTargets) ? "#000000" : "#00000070"}
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
            color={isActive(profileTargets) ? "#000000" : "#00000070"}
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

const styles = StyleSheet.create({
  navigationContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderColor: "#cbcbcb",
    borderTopWidth: 1,
    width: "100%",
    height: 88,
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
    color: "#00000070",
    marginTop: 4,
  },
  iconTextActive: {
    color: "#000",
    fontWeight: "700",
  },
});

export default NavBar;
