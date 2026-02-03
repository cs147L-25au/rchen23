import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import NavBar from "../../components/NavBar";
import db from "../../database/db";
import { followUser, isFollowing, unfollowUser } from "../../lib/friendsDb";
import { getCurrentUserId } from "../../lib/ratingsDb";

type ProfileData = {
  id: string;
  display_name: string | null;
  username: string | null;
  profile_pic: string | null;
  first_name: string | null;
  last_name: string | null;
  weekly_streak: number | null;
};

const UserProfileScreen: React.FC = () => {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId?: string }>();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [watchedCount, setWatchedCount] = useState<number | null>(null);
  const [rank, setRank] = useState<number | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!userId) return;
      try {
        setLoading(true);
        const { data, error } = await db
          .from("profiles")
          .select(
            "id, display_name, username, profile_pic, first_name, last_name, weekly_streak",
          )
          .eq("id", userId)
          .single();

        if (error) {
          console.error("Profile fetch error:", error);
          setProfile(null);
        } else {
          setProfile(data as ProfileData);
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId]);

  useEffect(() => {
    const loadMeta = async () => {
      const current = await getCurrentUserId();
      setCurrentUserId(current);
      if (!current || !userId) return;
      const followingState = await isFollowing(current, userId);
      setFollowing(followingState);
    };
    loadMeta();
  }, [userId]);

  useEffect(() => {
    const loadStats = async () => {
      if (!userId) return;
      try {
        const { count } = await db
          .from("ratings")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId);
        setWatchedCount(count ?? 0);

        const { data } = await db
          .from("v_leaderboard_global")
          .select("rank")
          .eq("user_id", userId)
          .order("rank", { ascending: true })
          .limit(1);
        setRank(data?.[0]?.rank ?? null);
      } catch (err) {
        console.error("Failed to load profile stats:", err);
      }
    };
    loadStats();
  }, [userId]);

  const handleToggleFollow = async () => {
    if (!currentUserId || !userId) {
      Alert.alert("Sign in required", "Please sign in to follow members.");
      return;
    }
    if (currentUserId === userId) return;
    if (followLoading) return;

    setFollowLoading(true);
    const success = following
      ? await unfollowUser(currentUserId, userId)
      : await followUser(currentUserId, userId);
    if (success) setFollowing((prev) => !prev);
    setFollowLoading(false);
  };

  const displayName =
    profile?.display_name ||
    `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() ||
    profile?.username ||
    "User";

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color="#111" />
        </Pressable>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.backButton} />
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.profileRow}>
            {profile?.profile_pic ? (
              <Image
                source={{ uri: profile.profile_pic }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarFallback} />
            )}
            <View style={styles.profileMeta}>
              <Text style={styles.name}>{displayName}</Text>
              {profile?.username ? (
                <Text style={styles.handle}>{profile.username}</Text>
              ) : null}
            </View>
          </View>

          {currentUserId !== userId && (
            <Pressable
              style={[
                styles.followButton,
                following && styles.followingButton,
                followLoading && styles.buttonDisabled,
              ]}
              onPress={handleToggleFollow}
              disabled={followLoading}
            >
              <Text
                style={[styles.followText, following && styles.followingText]}
              >
                {following ? "Following" : "Follow"}
              </Text>
            </Pressable>
          )}

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{watchedCount ?? "—"}</Text>
              <Text style={styles.statLabel}>Watched</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{rank ?? "—"}</Text>
              <Text style={styles.statLabel}>Rank</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {profile?.weekly_streak ?? "—"}
              </Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
          </View>
        </ScrollView>
      )}

      <NavBar />
      <StatusBar style="auto" />
    </View>
  );
};

export default UserProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "DM Sans",
    color: "#111",
  },
  loader: {
    marginTop: 24,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#e6e6e6",
  },
  avatarFallback: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#e6e6e6",
  },
  profileMeta: {
    flexShrink: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
    fontFamily: "DM Sans",
  },
  handle: {
    marginTop: 4,
    fontSize: 13,
    color: "#666",
    fontFamily: "DM Sans",
  },
  followButton: {
    marginTop: 16,
    alignSelf: "flex-start",
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#0f4c5c",
    backgroundColor: "#0f4c5c",
  },
  followingButton: {
    backgroundColor: "#f2f2f2",
    borderColor: "#d6d6d6",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  followText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
    fontFamily: "DM Sans",
  },
  followingText: {
    color: "#555",
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#f7f7f7",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    fontFamily: "DM Sans",
  },
  statLabel: {
    marginTop: 4,
    fontSize: 11,
    color: "#777",
    fontFamily: "DM Sans",
  },
});
