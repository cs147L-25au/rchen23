// app/(tabs)/settings.tsx
import AntDesign from "@expo/vector-icons/AntDesign";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import db from "@/database/db";
import NavBar from "../../components/NavBar";
import { getAllPosts, Post } from "../../database/queries";

// Placeholder profile image
const placeholder_pfp = require("../../assets/profile_pic.png");

export default function SettingsScreen() {
  const router = useRouter();
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock user data - replace with real auth later
  const userName = "Richard Chen";
  const userHandle = "@RRChen";
  const userRank = 1;
  const followers = 20;
  const following = 20;
  const watched = 71; // Number of movies ranked
  const wantToWatch = 10;
  const currentStreak = 15;

  useEffect(() => {
    loadUserPosts();
  }, []);

  const loadUserPosts = async () => {
    try {
      setLoading(true);
      const data = await getAllPosts();
      setUserPosts(data.slice(0, 5)); // Show last 5 posts
    } catch (err) {
      console.error("Failed to load posts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutPress = () => {
    Alert.alert(
      "Log out",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Yes",
          style: "destructive",
          onPress: async () => {
            try {
              await db.auth.signOut();
            } catch (err) {
              console.error("Failed to sign out", err);
            }
            // Send back to login gate (app/index.tsx)
            router.replace("/");
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.page}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* PROFILE HEADER + LOGOUT ICON */}
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogoutPress}
          >
            <MaterialIcons name="logout" size={22} color="#000" />
          </TouchableOpacity>

          <View style={styles.headerTop}>
            <Image source={placeholder_pfp} style={styles.profilePic} />
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.userHandle}>{userHandle}</Text>
          </View>

          <View style={styles.headerBottom}>
            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{followers}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{following}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>#{userRank}</Text>
                <Text style={styles.statLabel}>Rank on MyFlix</Text>
              </View>
            </View>

            {/* Edit Profile & Share Profile Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.editButton}>
                <Text style={styles.editButtonText}>Edit profile</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareButton}>
                <Text style={styles.shareButtonText}>Share profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Stats Lines */}
        <View style={styles.statsLinesContainer}>
          <TouchableOpacity style={styles.statLine}>
            <View style={styles.statLineLeft}>
              <MaterialIcons name="movie" size={24} color="#000" />
              <Text style={styles.statLineLabel}>Been</Text>
            </View>
            <View style={styles.statLineRight}>
              <Text style={styles.statLineNumber}>{watched}</Text>
              <Text style={styles.arrow}>›</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statLine}>
            <View style={styles.statLineLeft}>
              <FontAwesome name="bookmark" size={24} color="#000" />
              <Text style={styles.statLineLabel}>Want to Watch</Text>
            </View>
            <View style={styles.statLineRight}>
              <Text style={styles.statLineNumber}>{wantToWatch}</Text>
              <Text style={styles.arrow}>›</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Rank & Streak Boxes */}
        <View style={styles.rankStreakContainer}>
          <View style={styles.rankBox}>
            <FontAwesome5 name="trophy" size={32} color="#FFB800" />
            <Text style={styles.rankLabel}>Rank on MyFlix</Text>
            <Text style={styles.rankNumber}>#{userRank}</Text>
          </View>

          <View style={styles.streakBox}>
            <AntDesign name="fire" size={32} color="#FF6B35" />
            <Text style={styles.streakLabel}>Current Streak</Text>
            <Text style={styles.streakNumber}>{currentStreak} weeks</Text>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.recentActivityContainer}>
          <Text style={styles.recentActivityTitle}>Recent Activity</Text>

          {loading ? (
            <ActivityIndicator size="large" color="#0000ff" />
          ) : userPosts.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.activityScroll}
            >
              {userPosts.map((post) => (
                <View key={post.id} style={styles.activityItem}>
                  <Text style={styles.activityText}>
                    You {post.action_type === "rating" ? "ranked" : "commented"}
                  </Text>
                  <Text style={styles.activityMovie}>{post.movie_name}</Text>
                  <View style={styles.activityActions}>
                    <TouchableOpacity>
                      <Text style={styles.actionIcon}>🤍</Text>
                    </TouchableOpacity>
                    <TouchableOpacity>
                      <Text style={styles.actionIcon}>💬</Text>
                    </TouchableOpacity>
                    <TouchableOpacity>
                      <Text style={styles.actionIcon}>➤</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.noActivityText}>No recent activity</Text>
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      <NavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#fff",
  },

  // Wrapper for top profile header + logout button
  headerContainer: {
    backgroundColor: "#fff",
    paddingTop: "12%",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    alignItems: "center",
  },

  logoutButton: {
    position: "absolute",
    top: 50,
    right: 16,
    padding: 6,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.04)",
  },

  headerTop: {
    alignItems: "center",
    marginBottom: 8,
  },
  headerBottom: {
    alignItems: "center",
  },

  profilePic: {
    width: 120,
    height: 120,
    borderRadius: 40,
    marginBottom: 12,
  },
  userName: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000",
    fontFamily: "DM Sans",
  },
  userHandle: {
    fontSize: 14,
    color: "#999",
    fontFamily: "DM Sans",
    marginBottom: 8,
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    paddingVertical: 12,
    marginBottom: 12,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    fontFamily: "DM Sans",
  },
  statLabel: {
    fontSize: 11,
    color: "#999",
    fontFamily: "DM Sans",
    marginTop: 4,
  },

  buttonContainer: {
    flexDirection: "row",
    gap: 12,
  },
  editButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
  },
  editButtonText: {
    fontSize: 13,
    color: "#000",
    fontFamily: "DM Sans",
    fontWeight: "500",
  },
  shareButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
  },
  shareButtonText: {
    fontSize: 13,
    color: "#000",
    fontFamily: "DM Sans",
    fontWeight: "500",
  },

  statsLinesContainer: {
    paddingHorizontal: 16,
  },
  statLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  statLineLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statLineLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
    fontFamily: "DM Sans",
  },
  statLineRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statLineNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    fontFamily: "DM Sans",
  },
  arrow: {
    fontSize: 20,
    color: "#999",
  },

  rankStreakContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
  },
  rankBox: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  streakBox: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  rankLabel: {
    fontSize: 12,
    color: "#999",
    fontFamily: "DM Sans",
    marginTop: 8,
    marginBottom: 4,
  },
  streakLabel: {
    fontSize: 12,
    color: "#999",
    fontFamily: "DM Sans",
    marginTop: 8,
    marginBottom: 4,
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    fontFamily: "DM Sans",
  },
  streakNumber: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    fontFamily: "DM Sans",
  },

  recentActivityContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  recentActivityTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    fontFamily: "DM Sans",
    marginBottom: 12,
  },
  activityScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  activityItem: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    width: 200,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  activityText: {
    fontSize: 12,
    color: "#999",
    fontFamily: "DM Sans",
  },
  activityMovie: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    fontFamily: "DM Sans",
    marginVertical: "2.5%",
  },
  activityActions: {
    flexDirection: "row",
    gap: "4%",
    marginTop: "3.5%",
  },
  actionIcon: {
    fontSize: 16,
  },
  noActivityText: {
    fontSize: 14,
    color: "#999",
    fontFamily: "DM Sans",
    textAlign: "center",
    paddingVertical: "5%",
  },
  bottomPadding: {
    height: "10%",
  },
});
