import { Ionicons } from "@expo/vector-icons";
import AntDesign from "@expo/vector-icons/AntDesign";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import FeedItem, { ActionType } from "../../components/FeedItem";
import NavBar from "../../components/NavBar";
import db from "../../database/db";
import {
  FeedEvent,
  getUserFeedEvents,
  getUserRatings,
  RatingPost,
} from "../../database/queries";
import {
  followUser,
  getFollowersCount,
  getFollowingCount,
  isFollowing,
  unfollowUser,
} from "../../lib/friendsDb";
import { getCommentCountsByEventIds } from "../../lib/commentsDb";
import { getCurrentUserId } from "../../lib/ratingsDb";
import { getUserWatchlist } from "../../lib/watchlistDb";
import { useAppTheme } from "../../contexts/ThemeContext";
import { ThemeColors } from "../../constants/theme";

const DEFAULT_PROFILE_IMAGE = require("../../assets/anon_pfp.png");

type ProfileData = {
  id: string;
  display_name: string | null;
  username: string | null;
  profile_pic: string | null;
  first_name: string | null;
  last_name: string | null;
  weekly_streak: number | null;
  followers_count: number | null;
  following_count: number | null;
  rank: number | null;
};

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

const UserProfileScreen: React.FC = () => {
  const router = useRouter();
  const { colors: t, mode } = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const { userId } = useLocalSearchParams<{ userId?: string }>();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const [userRatings, setUserRatings] = useState<RatingPost[]>([]);
  const [userBookmarks, setUserBookmarks] = useState<WatchlistItem[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [followingUserCount, setFollowingUserCount] = useState<number>(0);

  const [recentEvents, setRecentEvents] = useState<FeedEvent[]>([]);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>(
    {},
  );

  useEffect(() => {
    const loadProfile = async () => {
      if (!userId) return;
      try {
        setLoading(true);

        const current = await getCurrentUserId();
        setCurrentUserId(current);

        const { data, error } = await db
          .from("profiles")
          .select(
            "id, display_name, username, profile_pic, first_name, last_name, weekly_streak, followers_count, following_count, rank",
          )
          .eq("id", userId)
          .maybeSingle();

        if (error) {
          console.error("Profile fetch error:", error);
          setProfile(null);
        } else {
          setProfile(data as ProfileData);
        }

        if (current && userId) {
          const followingState = await isFollowing(current, userId);
          setFollowing(followingState);
        }

        const fCount = await getFollowersCount(userId);
        const fgCount = await getFollowingCount(userId);
        setFollowersCount(fCount);
        setFollowingUserCount(fgCount);

        const ratings = await getUserRatings(userId);
        setUserRatings(ratings);

        try {
          const bookmarks = await getUserWatchlist(userId);
          setUserBookmarks(bookmarks as WatchlistItem[]);
        } catch {
          setUserBookmarks([]);
        }

        try {
          const events = await getUserFeedEvents(userId);
          const filteredEvents = events.filter(
            (event) => event.action_type !== "unbookmarked",
          );
          setRecentEvents(filteredEvents);
          const eids = filteredEvents.map((e) => e.event_id);
          const cMap = await getCommentCountsByEventIds(eids);
          setCommentCounts(cMap);
        } catch {
          setRecentEvents([]);
          setCommentCounts({});
        }

        if (data?.rank) {
          setUserRank(data.rank);
        } else {
          setUserRank(null);
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
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
    if (success) {
      setFollowing((prev) => !prev);
      setFollowersCount((prev) =>
        following ? Math.max(0, prev - 1) : prev + 1,
      );
    }
    setFollowLoading(false);
  };

  const userName =
    profile?.display_name ||
    `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() ||
    profile?.username ||
    "User";
  const userHandle = profile?.username ? `@${profile.username}` : "";
  const followers = followersCount;
  const followingCount = followingUserCount;
  const watched = (() => {
    const uniqueTitles = new Set(userRatings.map((r) => r.title_id));
    return uniqueTitles.size;
  })();
  const wantToWatch = userBookmarks.length;
  const currentStreak = profile?.weekly_streak ?? 0;

  const openComments = (item: FeedEvent) => {
    router.push({
      pathname: "/postComments/[eventId]",
      params: { eventId: item.event_id, title: item.title },
    });
  };

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

  const renderRecentItem = ({ item }: { item: FeedEvent }) => {
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
        likeCount={0}
        commentCount={commentCounts[item.event_id] ?? 0}
        isLiked={false}
        isBookmarked={actionType === "bookmarked"}
        onLike={() => {}}
        onLikesPress={() => {}}
        onComment={() => openComments(item)}
        onShare={() => {}}
        onAddToList={() => {}}
        onBookmark={() => {}}
        rightActionVariant={rightActionVariant}
      />
    );
  };

  if (loading) {
    return (
      <View style={styles.page}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color={t.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.backButton} />
        </View>
        <ActivityIndicator style={styles.loader} size="large" color={t.primary} />
        <NavBar />
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: "18.5%" }}
      >
        <View style={styles.topHeader}>
          <Pressable onPress={() => router.back()} style={styles.backButtonTop}>
            <Ionicons name="chevron-back" size={24} color={t.textPrimary} />
          </Pressable>
        </View>

        <View style={styles.headerContainer}>
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
            {userHandle ? (
              <Text style={styles.userHandle}>{userHandle}</Text>
            ) : null}
          </View>

          <View style={styles.headerBottom}>
            <View style={styles.statsRow}>
              <TouchableOpacity
                style={styles.statItem}
                onPress={() =>
                  userId &&
                  router.push({
                    pathname: "/followList",
                    params: {
                      userId: userId,
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
                  userId &&
                  router.push({
                    pathname: "/followList",
                    params: {
                      userId: userId,
                      type: "following",
                      userName: userName,
                    },
                  })
                }
                activeOpacity={0.7}
              >
                <Text style={styles.statNumber}>{followingCount}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </TouchableOpacity>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {userRank ? `#${userRank}` : "—"}
                </Text>
                <Text style={styles.statLabel}>Rank on MyFlix</Text>
              </View>
            </View>

            {currentUserId !== userId && (
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[
                    styles.followButton,
                    following && styles.followingButton,
                    followLoading && styles.buttonDisabled,
                  ]}
                  onPress={handleToggleFollow}
                  disabled={followLoading}
                >
                  <Text
                    style={[
                      styles.followButtonText,
                      following && styles.followingButtonText,
                    ]}
                  >
                    {following ? "Following" : "Follow"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        <View style={styles.statsLinesContainer}>
          <View style={styles.statLine}>
            <View style={styles.statLineLeft}>
              <MaterialIcons name="movie" size={24} color={t.textPrimary} />
              <Text style={styles.statLineLabel}>Watched</Text>
            </View>
            <View style={styles.statLineRight}>
              <Text style={styles.statLineNumber}>{watched}</Text>
            </View>
          </View>

          <View style={styles.statLine}>
            <View style={styles.statLineLeft}>
              <FontAwesome name="bookmark" size={24} color={t.textPrimary} />
              <Text style={styles.statLineLabel}>Watchlist</Text>
            </View>
            <View style={styles.statLineRight}>
              <Text style={styles.statLineNumber}>{wantToWatch}</Text>
            </View>
          </View>
        </View>

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

        <View style={styles.recentActivityContainer}>
          <Text style={styles.recentActivityTitle}>Recent Activity</Text>

          {recentEvents.length === 0 ? (
            <Text style={styles.noActivityText}>No recent activity</Text>
          ) : (
            <FlatList
              data={recentEvents}
              renderItem={renderRecentItem}
              keyExtractor={(p) => p.event_id}
              contentContainerStyle={{ gap: 12 }}
              scrollEnabled={false}
            />
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      <NavBar />
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
    </View>
  );
};

export default UserProfileScreen;

const makeStyles = (t: ThemeColors) =>
  StyleSheet.create({
    page: { flex: 1, backgroundColor: t.background },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      paddingTop: "15%",
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
      color: t.textPrimary,
    },
    loader: {
      marginTop: 24,
    },
    topHeader: {
      paddingTop: "12%",
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    backButtonTop: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    headerContainer: {
      backgroundColor: t.surface,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: t.border,
      alignItems: "center",
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
      color: t.textPrimary,
      fontFamily: "DM Sans",
    },
    userHandle: {
      fontSize: 14,
      color: t.textMuted,
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
      color: t.textPrimary,
      fontFamily: "DM Sans",
    },
    statLabel: {
      fontSize: 11,
      color: t.textMuted,
      fontFamily: "DM Sans",
      marginTop: 4,
    },
    buttonContainer: { flexDirection: "row", gap: 12 },
    followButton: {
      paddingHorizontal: 28,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: t.followButton,
    },
    followingButton: {
      backgroundColor: t.followingButton,
      borderWidth: 1,
      borderColor: t.border,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    followButtonText: {
      fontSize: 14,
      color: "#fff",
      fontFamily: "DM Sans",
      fontWeight: "600",
    },
    followingButtonText: {
      color: t.followingButtonText,
    },
    statsLinesContainer: { paddingHorizontal: 16 },
    statLine: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 16,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor: t.divider,
    },
    statLineLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
    statLineLabel: {
      fontSize: 16,
      fontWeight: "500",
      color: t.textPrimary,
      fontFamily: "DM Sans",
    },
    statLineRight: { flexDirection: "row", alignItems: "center", gap: 8 },
    statLineNumber: {
      fontSize: 16,
      fontWeight: "600",
      color: t.textPrimary,
      fontFamily: "DM Sans",
    },
    rankStreakContainer: {
      flexDirection: "row",
      paddingHorizontal: 16,
      paddingVertical: 20,
      gap: 12,
    },
    rankBox: {
      flex: 1,
      backgroundColor: t.card,
      borderRadius: 12,
      padding: 20,
      alignItems: "center",
      borderWidth: 1,
      borderColor: t.border,
    },
    streakBox: {
      flex: 1,
      backgroundColor: t.card,
      borderRadius: 12,
      padding: 20,
      alignItems: "center",
      borderWidth: 1,
      borderColor: t.border,
    },
    rankLabel: {
      fontSize: 12,
      color: t.textMuted,
      fontFamily: "DM Sans",
      marginTop: 8,
      marginBottom: 4,
    },
    streakLabel: {
      fontSize: 12,
      color: t.textMuted,
      fontFamily: "DM Sans",
      marginTop: 8,
      marginBottom: 4,
    },
    rankNumber: {
      fontSize: 18,
      fontWeight: "600",
      color: t.textPrimary,
      fontFamily: "DM Sans",
    },
    streakNumber: {
      fontSize: 18,
      fontWeight: "600",
      color: t.textPrimary,
      fontFamily: "DM Sans",
    },
    recentActivityContainer: {
      paddingHorizontal: 16,
      paddingVertical: 20,
      borderTopWidth: 1,
      borderTopColor: t.border,
    },
    recentActivityTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: t.textPrimary,
      fontFamily: "DM Sans",
      marginBottom: 12,
    },
    noActivityText: {
      fontSize: 14,
      color: t.textMuted,
      fontFamily: "DM Sans",
      textAlign: "center",
      paddingVertical: "5%",
    },
    bottomPadding: { height: "10%" },
  });
