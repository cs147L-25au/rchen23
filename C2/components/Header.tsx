import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import db from "../database/db";
import { getCurrentUserId } from "../lib/ratingsDb";

const DEFAULT_PROFILE_IMAGE = require("../assets/anon_pfp.png");
const DEFAULT_PROFILE_URL_REMOTE =
  "https://eagksfoqgydjaqoijjtj.supabase.co/storage/v1/object/public/RC_profile/profile_pic.png";
const app_name = "MyFlix";

const Header = () => {
  const [profilePic, setProfilePic] = useState<string | null>(null);

  const loadProfilePic = useCallback(async () => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        setProfilePic(null);
        return;
      }
      const { data, error } = await db
        .from("profiles")
        .select("profile_pic")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.warn("Header profile fetch error:", error.message);
        setProfilePic(null);
        return;
      }

      const nextPic =
        data?.profile_pic === DEFAULT_PROFILE_URL_REMOTE
          ? null
          : data?.profile_pic;
      setProfilePic(nextPic ?? null);
    } catch (err) {
      console.warn("Header profile fetch failed:", err);
      setProfilePic(null);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfilePic();
    }, [loadProfilePic]),
  );

  return (
    <View style={styles.headerContainer}>
      <View style={styles.nameSection}>
        <Text style={styles.appName}>{app_name}</Text>
      </View>
      <View style={styles.profileCircle}>
        <Image
          style={styles.profileImage}
          source={profilePic ? { uri: profilePic } : DEFAULT_PROFILE_IMAGE}
        />
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
