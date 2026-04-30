import db from "@/database/db";
import { getFollowers, getFollowing } from "@/lib/friendsDb";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import NavBar from "../../components/NavBar";
import { useAppTheme } from "../../contexts/ThemeContext";
import { ThemeColors } from "../../constants/theme";

const placeholder_pfp = require("../../assets/anon_pfp.png");

type CategoryKey = "all" | "movie" | "tv" | "documentary";
type ScopeKey = "all" | "followers" | "following";

type LeaderItem = {
  rank: number;
  userId: string;
  displayName: string;
  username?: string;
  count: number;
  profilePic?: string | null;
};

const CATEGORY_TABS: { key: CategoryKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "movie", label: "Movies" },
  { key: "tv", label: "TV Shows" },
  { key: "documentary", label: "Documentaries" },
];

const SCOPE_OPTIONS: { key: ScopeKey; label: string }[] = [
  { key: "all", label: "Everyone" },
  { key: "followers", label: "Your Followers" },
  { key: "following", label: "People You Follow" },
];

const GENRES = [
  "All Genres","Action","Adventure","Animation","Comedy","Crime","Documentary",
  "Drama","Family","Fantasy","History","Horror","Music","Mystery","Romance",
  "Science Fiction","Thriller","War","Western",
];

export default function LeaderboardScreen() {
  const { colors: t } = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const [category, setCategory] = useState<CategoryKey>("all");
  const [scope, setScope] = useState<ScopeKey>("all");
  const [genre, setGenre] = useState("All Genres");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<LeaderItem[]>([]);
  const [scopeModalVisible, setScopeModalVisible] = useState(false);
  const [genreModalVisible, setGenreModalVisible] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadUserId = async () => {
      const { data } = await db.auth.getSession();
      setCurrentUserId(data.session?.user?.id || null);
    };
    loadUserId();
  }, []);

  useEffect(() => {
    const loadLeaderboard = async () => {
      setLoading(true);
      try {
        const { data: allProfiles, error: profileError } = await db
          .from("profiles")
          .select("id, username, profile_pic, display_name");

        if (profileError) {
          console.error("Profiles fetch error:", profileError.message);
          setItems([]);
          return;
        }

        let filteredProfileIds: Set<string> | null = null;

        if (scope !== "all" && currentUserId) {
          filteredProfileIds = new Set<string>();
          filteredProfileIds.add(currentUserId);

          if (scope === "followers") {
            const followers = await getFollowers(currentUserId);
            followers.forEach((f) => filteredProfileIds!.add(f.id));
          } else if (scope === "following") {
            const following = await getFollowing(currentUserId);
            following.forEach((f) => filteredProfileIds!.add(f.id));
          }
        }

        const scopedProfiles = filteredProfileIds
          ? (allProfiles || []).filter((p: any) => filteredProfileIds!.has(p.id))
          : allProfiles || [];

        if (genre === "All Genres") {
          const { data, error } = await db
            .from("v_leaderboard_global")
            .select("category, user_id, watched_count");

          if (error) {
            console.error("Leaderboard fetch error:", error.message);
          }

          const rows =
            (data as Array<{ category: string; user_id: string; watched_count: number | null }>) || [];

          const counts = new Map<string, number>();

          if (category === "all") {
            rows.filter((row) => row.category === "overall")
              .forEach((row) => { counts.set(row.user_id, row.watched_count || 0); });
          } else {
            rows.filter((row) => row.category === category)
              .forEach((row) => { counts.set(row.user_id, row.watched_count || 0); });
          }

          const sorted = scopedProfiles
            .map((profile: any) => ({
              rank: 0,
              userId: profile.id,
              displayName: profile.display_name || "User",
              username: profile.username || "",
              count: counts.get(profile.id) || 0,
              profilePic: profile.profile_pic || null,
            }))
            .sort((a, b) => b.count - a.count);

          let currentRank = 1;
          const nextItems = sorted.map((item, index) => {
            if (index > 0 && item.count < sorted[index - 1].count) {
              currentRank = index + 1;
            }
            return { ...item, rank: currentRank };
          });

          setItems(nextItems);
          return;
        }

        let query = db
          .from("v_user_ratings")
          .select("user_id, title_type, genres")
          .contains("genres", [genre]);

        if (category !== "all") {
          query = query.eq("title_type", category);
        }

        const { data, error } = await query;

        if (error) {
          console.error("Genre leaderboard error:", error.message);
          setItems([]);
          return;
        }

        const counts = new Map<string, number>();
        (data || []).forEach((row: any) => {
          counts.set(row.user_id, (counts.get(row.user_id) || 0) + 1);
        });

        const sorted = scopedProfiles
          .map((profile: any) => ({
            rank: 0,
            userId: profile.id,
            displayName: profile.display_name || "User",
            username: profile.username || "",
            count: counts.get(profile.id) || 0,
            profilePic: profile.profile_pic || null,
          }))
          .sort((a, b) => b.count - a.count);

        let currentRank = 1;
        const nextItems = sorted.map((item, index) => {
          if (index > 0 && item.count < sorted[index - 1].count) {
            currentRank = index + 1;
          }
          return { ...item, rank: currentRank };
        });

        setItems(nextItems);
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, [category, genre, scope, currentUserId]);

  const subtitle = useMemo(() => {
    if (genre === "All Genres") return "Number of places on your been list";
    return `${genre} watched count`;
  }, [genre]);

  const scopeLabel = SCOPE_OPTIONS.find((s) => s.key === scope)?.label || "All";

  const renderRow = ({ item }: { item: LeaderItem }) => (
    <View style={styles.row}>
      <Text style={styles.rank}>{item.rank}</Text>

      <Image
        source={
          item.profilePic && item.profilePic.trim()
            ? { uri: item.profilePic }
            : placeholder_pfp
        }
        style={styles.avatar}
      />

      <View style={styles.userInfo}>
        <Text style={styles.displayName}>{item.displayName}</Text>
        {item.username ? (
          <Text style={styles.username}>@{item.username}</Text>
        ) : null}
      </View>

      <Text style={styles.score}>{item.count}</Text>
    </View>
  );

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.title}>Leaderboard</Text>

        <View style={styles.tabs}>
          {CATEGORY_TABS.map((tab) => (
            <Pressable
              key={tab.key}
              style={[
                styles.tab,
                tab.key === "documentary" && styles.tabWide,
                category === tab.key && styles.tabActive,
              ]}
              onPress={() => setCategory(tab.key)}
            >
              <Text
                style={[
                  styles.tabText,
                  category === tab.key && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.dropdownRow}>
          <Pressable
            style={styles.scopeDropdown}
            onPress={() => setScopeModalVisible(true)}
          >
            <Text style={styles.dropdownText}>{scopeLabel}</Text>
            <Ionicons name="chevron-down" size={16} color={t.textMuted} />
          </Pressable>

          <Pressable
            style={styles.genreDropdown}
            onPress={() => setGenreModalVisible(true)}
          >
            <Text style={styles.dropdownText}>{genre}</Text>
            <Ionicons name="chevron-down" size={16} color={t.textMuted} />
          </Pressable>
        </View>

        <Text style={styles.subtitle}>{subtitle}</Text>

        <FlatList
          data={items}
          renderItem={renderRow}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            loading ? null : <Text style={styles.emptyText}>No data yet.</Text>
          }
        />
      </View>

      <NavBar />

      {/* Scope Modal */}
      <Modal
        visible={scopeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setScopeModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setScopeModalVisible(false)}
        >
          <Pressable style={styles.modalContent} onPress={() => null}>
            <Text style={styles.modalTitle}>Select Scope</Text>
            <ScrollView style={styles.modalList} showsVerticalScrollIndicator>
              {SCOPE_OPTIONS.map((s) => (
                <Pressable
                  key={s.key}
                  style={styles.modalOption}
                  onPress={() => {
                    setScope(s.key);
                    setScopeModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      scope === s.key && styles.modalOptionSelected,
                    ]}
                  >
                    {s.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Genre Modal */}
      <Modal
        visible={genreModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setGenreModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setGenreModalVisible(false)}
        >
          <Pressable style={styles.modalContent} onPress={() => null}>
            <Text style={styles.modalTitle}>Select Genre</Text>
            <ScrollView style={styles.modalList} showsVerticalScrollIndicator>
              {GENRES.map((g) => (
                <Pressable
                  key={g}
                  style={styles.modalOption}
                  onPress={() => {
                    setGenre(g);
                    setGenreModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      genre === g && styles.modalOptionSelected,
                    ]}
                  >
                    {g}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const makeStyles = (t: ThemeColors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: t.background,
    },
    content: {
      flex: 1,
      paddingTop: "18%",
      paddingHorizontal: 20,
    },
    title: {
      fontSize: 32,
      fontWeight: "700",
      marginBottom: 12,
      color: t.textPrimary,
    },
    subtitle: {
      color: t.textMuted,
      fontSize: 14,
      marginBottom: 12,
    },
    tabs: {
      flexDirection: "row",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.border,
      overflow: "hidden",
      marginBottom: 12,
    },
    tab: {
      flex: 0.85,
      paddingVertical: 10,
      paddingHorizontal: 2,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: t.surface,
    },
    tabWide: {
      flex: 1.15,
    },
    tabActive: {
      backgroundColor: t.card,
      borderBottomWidth: 2,
      borderBottomColor: t.primary,
    },
    tabText: {
      fontSize: 14,
      color: t.textMuted,
      fontWeight: "600",
    },
    tabTextActive: {
      color: t.primary,
    },
    dropdownRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottomWidth: 1,
      borderBottomColor: t.divider,
      paddingVertical: 8,
      marginBottom: 8,
    },
    scopeDropdown: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    genreDropdown: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    dropdownText: {
      fontSize: 16,
      fontWeight: "600",
      color: t.textPrimary,
    },
    listContainer: {
      paddingBottom: 100,
    },
    row: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: t.divider,
    },
    rank: {
      fontSize: 16,
      fontWeight: "700",
      width: 26,
      color: t.textPrimary,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
    },
    userInfo: {
      flex: 1,
    },
    displayName: {
      fontSize: 16,
      fontWeight: "600",
      color: t.textPrimary,
    },
    username: {
      fontSize: 13,
      color: t.textMuted,
      marginTop: 2,
    },
    score: {
      fontSize: 16,
      fontWeight: "700",
      color: t.textPrimary,
      marginRight: 8,
    },
    emptyText: {
      textAlign: "center",
      color: t.textMuted,
      paddingVertical: 20,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: t.overlayLight,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 20,
    },
    modalContent: {
      backgroundColor: t.modalBackground,
      borderRadius: 12,
      paddingTop: 12,
      paddingBottom: 12,
      paddingHorizontal: 12,
      width: "100%",
      maxWidth: 360,
      maxHeight: 360,
    },
    modalTitle: {
      fontSize: 13,
      color: t.textMuted,
      marginBottom: 8,
    },
    modalList: {
      maxHeight: 280,
    },
    modalOption: {
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderRadius: 8,
    },
    modalOptionText: {
      fontSize: 15,
      color: t.textPrimary,
    },
    modalOptionSelected: {
      fontWeight: "600",
      color: t.selectedOption,
    },
  });
