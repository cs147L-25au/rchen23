import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { FollowUser, getFollowers, getFollowing } from "../lib/friendsDb";

const DEFAULT_PROFILE_IMAGE = require("../assets/anon_pfp.png");

type ListType = "followers" | "following";

export default function FollowListScreen() {
  const router = useRouter();
  const { userId, type, userName } = useLocalSearchParams<{
    userId?: string;
    type?: ListType;
    userName?: string;
  }>();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<FollowUser[]>([]);

  useEffect(() => {
    const loadUsers = async () => {
      if (!userId || !type) return;
      setLoading(true);
      try {
        const list =
          type === "followers"
            ? await getFollowers(userId)
            : await getFollowing(userId);
        setUsers(list);
      } catch (err) {
        console.error("Failed to load follow list:", err);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [userId, type]);

  const title = type === "followers" ? "Followers" : "Following";

  const renderUser = ({ item }: { item: FollowUser }) => {
    const displayName = item.display_name || item.username || "User";
    const handle = item.username ? `@${item.username}` : "";

    return (
      <TouchableOpacity
        style={styles.userRow}
        onPress={() => router.push(`/user/${item.id}`)}
        activeOpacity={0.7}
      >
        <Image
          source={
            item.profile_pic ? { uri: item.profile_pic } : DEFAULT_PROFILE_IMAGE
          }
          style={styles.avatar}
        />
        <View style={styles.userInfo}>
          <Text style={styles.displayName} numberOfLines={1}>
            {displayName}
          </Text>
          {handle ? (
            <Text style={styles.handle} numberOfLines={1}>
              {handle}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E50914" />
        </View>
      ) : users.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {type === "followers"
              ? "No followers yet"
              : "Not following anyone yet"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderUser}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  headerRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
  },
  listContent: {
    paddingVertical: 8,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f0f0f0",
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  displayName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  handle: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
});
