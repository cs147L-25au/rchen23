import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import Header from "../../components/Header";
import MemberRow from "../../components/MemberRow";
import NavBar from "../../components/NavBar";
import PersonRow from "../../components/PersonRow";
import SegmentedTabs from "../../components/SegmentedTabs";
import TitleRow from "../../components/TitleRow";

import db from "../../database/db";
import { followUser, getFollowingIds, unfollowUser } from "../../lib/friendsDb";
import { getCurrentUserId } from "../../lib/ratingsDb";
import { TMDBMediaResult, searchTMDB } from "../../TMDB";

type TabKey = "titles" | "members";

type MemberProfile = {
  id: string;
  displayName: string;
  username: string | null;
  profilePic: string | null;
};

const RECENT_MEMBERS_KEY = "myflix_recent_members_v1";
const MAX_RECENTS = 8;

const TABS: { key: TabKey; label: string }[] = [
  { key: "titles", label: "Titles" },
  { key: "members", label: "Members" },
];

const SearchScreen: React.FC = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("titles");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const [titleResults, setTitleResults] = useState<TMDBMediaResult[]>([]);
  const [titleLoading, setTitleLoading] = useState(false);

  const [memberResults, setMemberResults] = useState<MemberProfile[]>([]);
  const [memberLoading, setMemberLoading] = useState(false);
  const [recentMembers, setRecentMembers] = useState<MemberProfile[]>([]);
  const [suggestedMembers, setSuggestedMembers] = useState<MemberProfile[]>([]);
  const [suggestedLoading, setSuggestedLoading] = useState(false);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [followLoadingIds, setFollowLoadingIds] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    const init = async () => {
      console.log("[Search] init");
      const userId = await getCurrentUserId();
      console.log("[Search] current user id", userId);
      setCurrentUserId(userId);
    };
    init();
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 400);
    return () => clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    if (activeTab !== "titles") return;
    if (!debouncedQuery) {
      console.log("[Search] titles query cleared");
      setTitleResults([]);
      setTitleLoading(false);
      return;
    }

    let cancelled = false;
    const fetchTitles = async () => {
      try {
        console.log("[Search] searching titles", debouncedQuery);
        setTitleLoading(true);
        const results = await searchTMDB(debouncedQuery);
        if (cancelled) return;
        const filtered = results.filter((item) =>
          ["movie", "tv", "person"].includes(item.media_type),
        );
        setTitleResults(filtered);
      } catch (err) {
        console.error("TMDB search error:", err);
        if (!cancelled) setTitleResults([]);
      } finally {
        if (!cancelled) setTitleLoading(false);
      }
    };

    fetchTitles();
    return () => {
      cancelled = true;
    };
  }, [activeTab, debouncedQuery]);

  useEffect(() => {
    if (activeTab !== "members") return;
    if (!debouncedQuery) {
      console.log("[Search] members query cleared");
      setMemberResults([]);
      setMemberLoading(false);
      return;
    }

    let cancelled = false;
    const fetchMembers = async () => {
      try {
        console.log("[Search] searching members", debouncedQuery);
        setMemberLoading(true);
        const pattern = `%${debouncedQuery}%`;
        const { data, error } = await db
          .from("profiles")
          .select(
            "id, display_name, username, profile_pic, first_name, last_name",
          )
          .or(
            `username.ilike.${pattern},display_name.ilike.${pattern},first_name.ilike.${pattern},last_name.ilike.${pattern}`,
          )
          .order("display_name", { ascending: true });

        if (error) {
          console.error("Member search error:", error);
          if (!cancelled) setMemberResults([]);
          return;
        }

        const cleaned = (data || [])
          .filter((row) => row.id !== currentUserId)
          .map((row) => {
            const displayName =
              row.display_name ||
              `${row.first_name || ""} ${row.last_name || ""}`.trim() ||
              row.username ||
              "User";
            return {
              id: row.id,
              displayName,
              username: row.username,
              profilePic: row.profile_pic,
            } as MemberProfile;
          });

        if (cancelled) return;
        console.log("[Search] members results", cleaned.length);
        setMemberResults(cleaned);

        if (currentUserId && cleaned.length > 0) {
          const following = await getFollowingIds(
            currentUserId,
            cleaned.map((p) => p.id),
          );
          if (!cancelled) setFollowingIds(following);
        } else if (!cancelled) {
          setFollowingIds(new Set());
        }
      } catch (err) {
        console.error("Member search error:", err);
        if (!cancelled) setMemberResults([]);
      } finally {
        if (!cancelled) setMemberLoading(false);
      }
    };

    fetchMembers();
    return () => {
      cancelled = true;
    };
  }, [activeTab, debouncedQuery, currentUserId]);

  useEffect(() => {
    if (activeTab !== "members") return;
    if (debouncedQuery.length > 0) return;

    let cancelled = false;
    const loadRecentsAndSuggested = async () => {
      try {
        console.log("[Search] loading recents");
        const stored = await AsyncStorage.getItem(RECENT_MEMBERS_KEY);
        const parsed = stored ? (JSON.parse(stored) as MemberProfile[]) : [];
        if (!cancelled) setRecentMembers(parsed || []);

        console.log("[Search] fetching suggested members");
        setSuggestedLoading(true);
        const { data, error } = await db
          .from("profiles")
          .select(
            "id, display_name, username, profile_pic, first_name, last_name",
          )
          .order("created_at", { ascending: false })
          .limit(12);

        if (error) {
          console.error("Suggested members error:", error);
          if (!cancelled) setSuggestedMembers([]);
          return;
        }

        const recentIds = new Set((parsed || []).map((row) => row.id));
        const suggested = (data || [])
          .filter((row) => row.id !== currentUserId)
          .filter((row) => !recentIds.has(row.id))
          .map((row) => {
            const displayName =
              row.display_name ||
              `${row.first_name || ""} ${row.last_name || ""}`.trim() ||
              row.username ||
              "User";
            return {
              id: row.id,
              displayName,
              username: row.username,
              profilePic: row.profile_pic,
            } as MemberProfile;
          });

        if (cancelled) return;
        console.log("[Search] suggested members", suggested.length);
        setSuggestedMembers(suggested);

        if (currentUserId) {
          const combinedIds = [
            ...(parsed || []).map((row) => row.id),
            ...suggested.map((row) => row.id),
          ];
          if (combinedIds.length > 0) {
            const following = await getFollowingIds(currentUserId, combinedIds);
            if (!cancelled) setFollowingIds(following);
          } else if (!cancelled) {
            setFollowingIds(new Set());
          }
        }
      } catch (err) {
        console.error("Failed to load recents/suggested:", err);
      } finally {
        if (!cancelled) setSuggestedLoading(false);
      }
    };

    loadRecentsAndSuggested();
    return () => {
      cancelled = true;
    };
  }, [activeTab, debouncedQuery, currentUserId]);

  const saveRecentMember = async (member: MemberProfile) => {
    try {
      const existing = recentMembers.filter((row) => row.id !== member.id);
      const next = [member, ...existing].slice(0, MAX_RECENTS);
      console.log("[Search] save recent member", member.id);
      setRecentMembers(next);
      await AsyncStorage.setItem(RECENT_MEMBERS_KEY, JSON.stringify(next));
    } catch (err) {
      console.error("Failed to save recent member:", err);
    }
  };

  const handleTitlePress = (item: TMDBMediaResult) => {
    const displayTitle = item.title ?? item.name ?? "(no title)";
    if (item.media_type === "person") {
      router.push(`/person/${item.id}`);
      return;
    }

    router.push({
      pathname: "/(tabs)/mediaDetails",
      params: {
        id: String(item.id),
        title: displayTitle,
        mediaType: item.media_type ?? "",
        overview: item.overview ?? "",
        posterPath: item.poster_path ?? "",
        voteAverage: item.vote_average != null ? String(item.vote_average) : "",
        voteCount: item.vote_count != null ? String(item.vote_count) : "",
      },
    });
  };

  const handleMemberPress = (member: MemberProfile) => {
    saveRecentMember(member);
    router.push(`/user/${member.id}`);
  };

  const handleToggleFollow = async (userId: string) => {
    if (!currentUserId) {
      Alert.alert("Sign in required", "Please sign in to follow members.");
      return;
    }
    if (followLoadingIds.has(userId)) return;

    console.log("[Search] toggle follow", userId);
    setFollowLoadingIds((prev) => new Set([...prev, userId]));
    const isFollowing = followingIds.has(userId);
    const success = isFollowing
      ? await unfollowUser(currentUserId, userId)
      : await followUser(currentUserId, userId);

    if (success) {
      setFollowingIds((prev) => {
        const next = new Set(prev);
        if (isFollowing) {
          next.delete(userId);
        } else {
          next.add(userId);
        }
        return next;
      });
    }

    setFollowLoadingIds((prev) => {
      const next = new Set(prev);
      next.delete(userId);
      return next;
    });
  };

  const titleSections = useMemo(() => {
    const titles = titleResults.filter(
      (item) => item.media_type === "movie" || item.media_type === "tv",
    );
    const people = titleResults.filter((item) => item.media_type === "person");
    const sections: { title: string; data: TMDBMediaResult[] }[] = [];
    if (titles.length > 0) sections.push({ title: "Titles", data: titles });
    if (people.length > 0) sections.push({ title: "People", data: people });
    return sections;
  }, [titleResults]);

  const renderTitleItem = ({ item }: { item: TMDBMediaResult }) => {
    if (item.media_type === "person") {
      return <PersonRow item={item} onPress={() => handleTitlePress(item)} />;
    }
    return <TitleRow item={item} onPress={() => handleTitlePress(item)} />;
  };

  const getInitials = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return "?";
    const parts = trimmed.split(" ");
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.push("/(tabs)/settings")}>
        <Header />
      </Pressable>

      <SegmentedTabs
        tabs={TABS}
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as TabKey)}
      />

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={
            activeTab === "titles"
              ? "Search movie, TV show, actor, director..."
              : "Search name or handle"
          }
          placeholderTextColor="#999999"
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {activeTab === "titles" && (
        <View style={styles.content}>
          {titleLoading ? (
            <ActivityIndicator style={styles.loader} />
          ) : debouncedQuery.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Search titles and people</Text>
              <Text style={styles.emptySubtitle}>
                Try a movie, TV show, actor, or director.
              </Text>
            </View>
          ) : titleSections.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No results</Text>
              <Text style={styles.emptySubtitle}>Try a different search.</Text>
            </View>
          ) : (
            <SectionList
              sections={titleSections}
              keyExtractor={(item) => `${item.media_type}-${item.id}`}
              renderItem={renderTitleItem}
              renderSectionHeader={({ section }) => (
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionHeaderText}>{section.title}</Text>
                </View>
              )}
              contentContainerStyle={styles.listContent}
            />
          )}
        </View>
      )}

      {activeTab === "members" && (
        <View style={styles.content}>
          {memberLoading ? (
            <ActivityIndicator style={styles.loader} />
          ) : debouncedQuery.length === 0 ? (
            <View style={styles.stubContainer}>
              <Text style={styles.stubHeader}>Recents</Text>
              <View style={styles.recentsRow}>
                {recentMembers.length === 0
                  ? [0, 1, 2, 3, 4].map((index) => (
                      <View key={index} style={styles.recentAvatar} />
                    ))
                  : recentMembers.map((member) => (
                      <Pressable
                        key={member.id}
                        style={styles.recentAvatarWrapper}
                        onPress={() => handleMemberPress(member)}
                      >
                        {member.profilePic ? (
                          <Image
                            source={{ uri: member.profilePic }}
                            style={styles.recentAvatarImage}
                          />
                        ) : (
                          <View style={styles.recentAvatarFallback}>
                            <Text style={styles.recentAvatarText}>
                              {getInitials(member.displayName)}
                            </Text>
                          </View>
                        )}
                      </Pressable>
                    ))}
              </View>
              <View style={styles.suggestedHeaderRow}>
                <Text style={styles.stubHeader}>Suggested for you</Text>
                <Text style={styles.stubAction}>See all</Text>
              </View>
              {suggestedLoading ? (
                <ActivityIndicator style={styles.loader} />
              ) : (
                <FlatList
                  data={suggestedMembers}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.suggestedCardRow}
                  renderItem={({ item }) => (
                    <View style={styles.suggestedCard}>
                      <Pressable
                        style={styles.suggestedPressArea}
                        onPress={() => handleMemberPress(item)}
                      >
                        {item.profilePic ? (
                          <Image
                            source={{ uri: item.profilePic }}
                            style={styles.suggestedAvatar}
                          />
                        ) : (
                          <View style={styles.suggestedAvatarFallback}>
                            <Text style={styles.suggestedAvatarText}>
                              {getInitials(item.displayName)}
                            </Text>
                          </View>
                        )}
                        <Text style={styles.suggestedName} numberOfLines={1}>
                          {item.displayName}
                        </Text>
                        {item.username ? (
                          <Text
                            style={styles.suggestedHandle}
                            numberOfLines={1}
                          >
                            {item.username}
                          </Text>
                        ) : null}
                      </Pressable>
                      <Pressable
                        style={[
                          styles.suggestedFollowButton,
                          followingIds.has(item.id) &&
                            styles.suggestedFollowingButton,
                        ]}
                        onPress={() => handleToggleFollow(item.id)}
                      >
                        <Text
                          style={[
                            styles.suggestedFollowText,
                            followingIds.has(item.id) &&
                              styles.suggestedFollowingText,
                          ]}
                        >
                          {followingIds.has(item.id) ? "Following" : "Follow"}
                        </Text>
                      </Pressable>
                    </View>
                  )}
                />
              )}
            </View>
          ) : memberResults.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No members found</Text>
              <Text style={styles.emptySubtitle}>
                Try a different name or handle.
              </Text>
            </View>
          ) : (
            <FlatList
              data={memberResults}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <MemberRow
                  profile={{
                    id: item.id,
                    displayName: item.displayName,
                    username: item.username,
                    profilePic: item.profilePic,
                  }}
                  isFollowing={followingIds.has(item.id)}
                  loading={followLoadingIds.has(item.id)}
                  onPress={() => handleMemberPress(item)}
                  onToggleFollow={() => handleToggleFollow(item.id)}
                />
              )}
            />
          )}
        </View>
      )}

      <NavBar />
      <StatusBar style="auto" />
    </View>
  );
};

export default SearchScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    width: "100%",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
  },
  searchInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#000000",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    height: 40,
    fontFamily: "DM Sans",
  },
  content: {
    flex: 1,
  },
  loader: {
    marginTop: 20,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#444",
    fontFamily: "DM Sans",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  listContent: {
    paddingBottom: 120,
  },
  emptyState: {
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
    fontFamily: "DM Sans",
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: "#777",
    fontFamily: "DM Sans",
  },
  stubContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  stubHeader: {
    fontSize: 13,
    fontWeight: "600",
    color: "#444",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontFamily: "DM Sans",
  },
  stubAction: {
    fontSize: 12,
    color: "#0f4c5c",
    fontFamily: "DM Sans",
  },
  recentsRow: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 14,
  },
  recentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#ededed",
  },
  recentAvatarWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#ededed",
  },
  recentAvatarImage: {
    width: "100%",
    height: "100%",
  },
  recentAvatarFallback: {
    width: "100%",
    height: "100%",
    backgroundColor: "#dcdcdc",
    alignItems: "center",
    justifyContent: "center",
  },
  recentAvatarText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    fontFamily: "DM Sans",
  },
  suggestedHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  suggestedCardRow: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 14,
    paddingRight: 16,
  },
  suggestedCard: {
    width: 160,
    minHeight: 150,
    borderRadius: 12,
    backgroundColor: "#f7f7f7",
    padding: 12,
    justifyContent: "flex-start",
  },
  suggestedPressArea: {
    flexGrow: 1,
  },
  suggestedAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e0e0e0",
    marginBottom: 8,
  },
  suggestedAvatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e0e0e0",
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  suggestedAvatarText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    fontFamily: "DM Sans",
  },
  suggestedName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
    fontFamily: "DM Sans",
  },
  suggestedHandle: {
    marginTop: 2,
    fontSize: 12,
    color: "#777",
    fontFamily: "DM Sans",
  },
  suggestedFollowButton: {
    marginTop: 10,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#0f4c5c",
    backgroundColor: "#0f4c5c",
  },
  suggestedFollowingButton: {
    backgroundColor: "#f0f0f0",
    borderColor: "#d6d6d6",
  },
  suggestedFollowText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
    fontFamily: "DM Sans",
  },
  suggestedFollowingText: {
    color: "#555",
  },
});
