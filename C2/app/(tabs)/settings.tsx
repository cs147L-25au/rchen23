import AntDesign from "@expo/vector-icons/AntDesign";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
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
import { signOut } from "@/utils/auth";
import NavBar from "../../components/NavBar";

import FeedItem, { ActionType } from "../../components/FeedItem";
import LikesModal, { LikeUser } from "../../components/LikesModal";
import { getProfileById, UserProfile } from "../../database/profileQueries";
import {
  FeedEvent,
  getUserFeedEvents,
  getUserRatings,
  RatingPost,
} from "../../database/queries";
import { getFollowersCount, getFollowingCount } from "../../lib/friendsDb";
import {
  getLikesForEvent,
  getLikeStateForEvents,
  toggleLikeForEvent,
} from "../../lib/likesDb";
import { getCurrentUserId } from "../../lib/ratingsDb";
import { getUserWatchlist } from "../../lib/watchlistDb";

const DEFAULT_PROFILE_IMAGE = require("../../assets/anon_pfp.png");
const DEFAULT_PROFILE_URL_REMOTE =
  "https://eagksfoqgydjaqoijjtj.supabase.co/storage/v1/object/public/RC_profile/profile_pic.png";

type WatchlistItem = {
  id: string;
  user_id: string;
  title_id: string;
  created_at: string;
  titles: {
    id: string;
    tmdb_id: number;
    tmdb_media_type: string;
    title: string;
    genres: string[];
    title_type: string;
    poster_path?: string | null;
    release_year?: number | null;
  };
};

export default function SettingsScreen() {
  const router = useRouter();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userRatings, setUserRatings] = useState<RatingPost[]>([]);
  const [userBookmarks, setUserBookmarks] = useState<WatchlistItem[]>([]);
  const [recentEvents, setRecentEvents] = useState<FeedEvent[]>([]);
  const [likedEvents, setLikedEvents] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [likesModalVisible, setLikesModalVisible] = useState(false);
  const [likesModalLoading, setLikesModalLoading] = useState(false);
  const [likesModalUsers, setLikesModalUsers] = useState<LikeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [followingCount, setFollowingCount] = useState<number>(0);

  const userName = profile?.display_name || "User";
  const userHandle = profile?.username ? `@${profile.username}` : "@user";
  const followers = followersCount;
  const following = followingCount;
  const watched = (() => {
    const uniqueTitles = new Set(userRatings.map((r) => r.title_id));
    return uniqueTitles.size;
  })();
  const wantToWatch = userBookmarks.length;
  const currentStreak = profile?.weekly_streak ?? 0;

  const loadRecentActivity = async () => {
    try {
      setLoading(true);
      const userId = await getCurrentUserId();
      setCurrentUserId(userId);

      if (userId) {
        const data = await getUserRatings(userId);
        setUserRatings(data);
      } else {
        setUserRatings([]);
      }

      if (!userId) {
        setProfile(null);
        setUserBookmarks([]);
        setRecentEvents([]);
        setLikeCounts({});
        setLikedEvents(new Set());
        setUserRank(null);
        return;
      }

      const profileData = await getProfileById(userId);

      // Get rank from profile (stored in Supabase, auto-updated by trigger)
      if (profileData?.rank) {
        setUserRank(profileData.rank);
      } else {
        // Fallback: fetch rank directly from profiles table
        try {
          const { data: rankData } = await db
            .from("profiles")
            .select("rank")
            .eq("id", userId)
            .maybeSingle();
          setUserRank(rankData?.rank ?? null);
        } catch {
          setUserRank(null);
        }
      }
      const cleanedProfile =
        profileData?.profile_pic === DEFAULT_PROFILE_URL_REMOTE
          ? { ...profileData, profile_pic: null }
          : profileData;
      setProfile(cleanedProfile);

      // Fetch follower/following counts
      const fCount = await getFollowersCount(userId);
      const fgCount = await getFollowingCount(userId);
      setFollowersCount(fCount);
      setFollowingCount(fgCount);

      const bookmarks = await getUserWatchlist(userId);
      setUserBookmarks(bookmarks as WatchlistItem[]);

      const events = await getUserFeedEvents(userId);
      const filteredEvents = events.filter(
        (event) => event.action_type !== "unbookmarked",
      );
      setRecentEvents(filteredEvents);

      const eventIds = filteredEvents.map((event) => event.event_id);
      const likeState = await getLikeStateForEvents(userId, eventIds);
      setLikeCounts(likeState.likeCounts);
      setLikedEvents(likeState.likedEventIds);
    } catch (err) {
      console.error("Failed to load recent activity:", err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadRecentActivity();
    }, []),
  );

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
              // Use the signOut utility which clears all stored auth data
              await signOut();
            } catch (err) {
              console.error("Failed to sign out", err);
            }
            router.replace("/auth");
          },
        },
      ],
      { cancelable: true },
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

  const handleLike = async (eventId: string) => {
    if (!currentUserId) {
      Alert.alert("Error", "Please log in to like posts");
      return;
    }

    const isCurrentlyLiked = likedEvents.has(eventId);

    setLikedEvents((prev) => {
      const next = new Set(prev);
      if (isCurrentlyLiked) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
    setLikeCounts((counts) => ({
      ...counts,
      [eventId]: Math.max(
        0,
        (counts[eventId] || 0) + (isCurrentlyLiked ? -1 : 1),
      ),
    }));

    try {
      const result = await toggleLikeForEvent({
        userId: currentUserId,
        eventId,
        isLiked: isCurrentlyLiked,
        currentLikeCount: likeCounts[eventId] || 0,
      });
      setLikeCounts((counts) => ({
        ...counts,
        [eventId]: result.likeCount,
      }));
      setLikedEvents((prev) => {
        const next = new Set(prev);
        if (result.isLiked) {
          next.add(eventId);
        } else {
          next.delete(eventId);
        }
        return next;
      });
    } catch (error) {
      console.error("Failed to toggle like:", error);
      loadRecentActivity();
    }
  };

  const handleLikesPress = async (eventId: string) => {
    try {
      setLikesModalVisible(true);
      setLikesModalLoading(true);
      const users = await getLikesForEvent(eventId);
      setLikesModalUsers(
        users.map((u) => ({
          id: u.user_id,
          displayName: u.display_name || "User",
          profilePic: u.profile_pic || null,
        })),
      );
    } catch (error) {
      console.error("Failed to load likes list:", error);
      setLikesModalUsers([]);
    } finally {
      setLikesModalLoading(false);
    }
  };

  const renderRecentItem = ({ item }: { item: FeedEvent }) => {
    // Get user initials from userName
    const userInitials = userName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

    const actionType = item.action_type as ActionType;
    const isRanked = actionType === "ranked";
    const rightActionVariant = isRanked ? "watched" : "bookmarked";

    return (
      <FeedItem
        userName={userName}
        userInitials={userInitials}
        profileImage={profile?.profile_pic || null}
        actionType={actionType}
        title={item.title}
        score={item.score ?? null}
        genres={item.genres || []}
        titleType={item.title_type || "movie"}
        timestamp={formatDate(item.created_at || "")}
        description={item.review_body || ""}
        likeCount={likeCounts[item.event_id] || 0}
        commentCount={0}
        isLiked={likedEvents.has(item.event_id)}
        isBookmarked={actionType === "bookmarked"}
        onLike={() => handleLike(item.event_id)}
        onLikesPress={() => handleLikesPress(item.event_id)}
        onComment={() => {}}
        onShare={() => {}}
        onAddToList={() => {}}
        onBookmark={() => {}}
        rightActionVariant={rightActionVariant}
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
              source={
                profile?.profile_pic
                  ? { uri: profile.profile_pic }
                  : DEFAULT_PROFILE_IMAGE
              }
              style={styles.profilePic}
            />
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.userHandle}>{userHandle}</Text>
          </View>

          <View style={styles.headerBottom}>
            <View style={styles.statsRow}>
              <TouchableOpacity
                style={styles.statItem}
                onPress={() =>
                  currentUserId &&
                  router.push({
                    pathname: "/followList",
                    params: {
                      userId: currentUserId,
                      type: "followers",
                      userName: userName,
                    },
                  })
                }
                activeOpacity={0.7}
              >
                <Text style={styles.statNumber}>{followers}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.statItem}
                onPress={() =>
                  currentUserId &&
                  router.push({
                    pathname: "/followList",
                    params: {
                      userId: currentUserId,
                      type: "following",
                      userName: userName,
                    },
                  })
                }
                activeOpacity={0.7}
              >
                <Text style={styles.statNumber}>{following}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </TouchableOpacity>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {userRank ? `#${userRank}` : "—"}
                </Text>
                <Text style={styles.statLabel}>Rank on MyFlix</Text>
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => router.push("/(tabs)/editProfile")}
              >
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
          <TouchableOpacity
            style={styles.statLine}
            onPress={() => router.push("/(tabs)/list")}
          >
            <View style={styles.statLineLeft}>
              <MaterialIcons name="movie" size={24} color="#000" />
              <Text style={styles.statLineLabel}>Watched</Text>
            </View>
            <View style={styles.statLineRight}>
              <Text style={styles.statLineNumber}>{watched}</Text>
              <Text style={styles.arrow}>›</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statLine}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/list",
                params: { tab: "watchlist" },
              })
            }
          >
            <View style={styles.statLineLeft}>
              <FontAwesome name="bookmark" size={24} color="#000" />
              <Text style={styles.statLineLabel}>Watchlist</Text>
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
            <Text style={styles.rankNumber}>
              {userRank ? `#${userRank}` : "—"}
            </Text>
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
          ) : recentEvents.length === 0 ? (
            <Text style={styles.noActivityText}>No recent activity</Text>
          ) : (
            <FlatList
              data={recentEvents}
              renderItem={renderRecentItem}
              keyExtractor={(p) => p.event_id}
              contentContainerStyle={{ gap: 12 }}
              scrollEnabled={false} // let outer scroll handle it
            />
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      <LikesModal
        visible={likesModalVisible}
        likes={likesModalLoading ? [] : likesModalUsers}
        onClose={() => setLikesModalVisible(false)}
      />
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
