import AntDesign from "@expo/vector-icons/AntDesign";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import db from "@/database/db";
import NavBar from "../../components/NavBar";

import FeedItem from "../../components/FeedItem";
import { getAllRatings, RatingPost } from "../../database/queries";

const DEFAULT_PROFILE_PIC =
  "https://eagksfoqgydjaqoijjtj.supabase.co/storage/v1/object/public/RC_profile/profile_pic.png";

export default function SettingsScreen() {
  const router = useRouter();

  const [userRatings, setUserRatings] = useState<RatingPost[]>([]);
  const [liked, setLiked] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);

  // These profile numbers remain local for now
  const userName = "Richard Chen";
  const userHandle = "@RRChen";
  const userRank = 1;
  const followers = 0;
  const following = 0;
  const watched = 3;
  const wantToWatch = 0;
  const currentStreak = 15;

  useEffect(() => {
    loadUserRatings();
  }, []);

  const loadUserRatings = async () => {
    try {
      setLoading(true);
      const data = await getAllRatings();
      setUserRatings(data);
    } catch (err) {
      console.error("Failed to load ratings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutPress = () => {
    Alert.alert(
      "Log out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          style: "destructive",
          onPress: async () => {
            try {
              await db.auth.signOut();
            } catch (err) {
              console.error("Failed to sign out", err);
            }
            router.replace("/");
          },
        },
      ],
      { cancelable: true }
    );
  };

  // SAME formatDate as FeedBar
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const renderRecentItem = ({ item }: { item: RatingPost }) => {
    // Get user initials from userName
    const userInitials = userName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

    return (
      <FeedItem
        userName={userName}
        userInitials={userInitials}
        profileImage={DEFAULT_PROFILE_PIC}
        actionType="ranked"
        title={item.title}
        score={item.score ?? null}
        genres={[]}
        titleType="movie"
        timestamp={formatDate(item.created_at || "")}
        description={item.review_body || ""}
        likeCount={liked[item.rating_id] === 1 ? 1 : 0}
        commentCount={0}
        isLiked={liked[item.rating_id] === 1}
        isBookmarked={false}
        onLike={() =>
          setLiked((prev) => ({
            ...prev,
            [item.rating_id]: prev[item.rating_id] === 1 ? 0 : 1,
          }))
        }
        onComment={() => {}}
        onShare={() => {}}
        onAddToList={() => {}}
        onBookmark={() => {}}
      />
    );
  };

  return (
    <View style={styles.page}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: "18.5%" }}
      >
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogoutPress}
          >
            <MaterialIcons name="logout" size={22} color="#000" />
          </TouchableOpacity>

          <View style={styles.headerTop}>
            <Image
              source={require("../../assets/profile_pic.png")}
              style={styles.profilePic}
            />
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.userHandle}>{userHandle}</Text>
          </View>

          <View style={styles.headerBottom}>
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

        {/* ---------------- STATS LIST (UNCHANGED) ---------------- */}
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

        {/* ---------------- RANK & STREAK BOXES (UNCHANGED) ---------------- */}
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

        {/* ---------------- NEW FEED-STYLE RECENT ACTIVITY ---------------- */}
        <View style={styles.recentActivityContainer}>
          <Text style={styles.recentActivityTitle}>Recent Activity</Text>

          {loading ? (
            <ActivityIndicator size="large" />
          ) : userRatings.length === 0 ? (
            <Text style={styles.noActivityText}>No recent activity</Text>
          ) : (
            <FlatList
              data={userRatings}
              renderItem={renderRecentItem}
              keyExtractor={(p) => p.rating_id}
              contentContainerStyle={{ gap: 12 }}
              scrollEnabled={false} // let outer scroll handle it
            />
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      <NavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  // ✂️ unchanged from your existing file
  page: { flex: 1, backgroundColor: "#fff" },
  headerContainer: {
    backgroundColor: "#fff",
    paddingTop: "20%",
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
  headerTop: { alignItems: "center", marginBottom: 8 },
  headerBottom: { alignItems: "center" },
  profilePic: {
    width: 110,
    height: 110,
    borderRadius: 40,
    marginBottom: 8,
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
    paddingVertical: 6,
    marginBottom: 6,
  },
  statItem: { alignItems: "center" },
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
  buttonContainer: { flexDirection: "row", gap: 12 },
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

  statsLinesContainer: { paddingHorizontal: 16 },
  statLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  statLineLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  statLineLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
    fontFamily: "DM Sans",
  },
  statLineRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  statLineNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    fontFamily: "DM Sans",
  },
  arrow: { fontSize: 20, color: "#999" },

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
  noActivityText: {
    fontSize: 14,
    color: "#999",
    fontFamily: "DM Sans",
    textAlign: "center",
    paddingVertical: "5%",
  },
  bottomPadding: { height: "30%" },
});
