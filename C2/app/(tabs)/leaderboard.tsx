import db from "@/database/db";
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

const placeholder_pfp = require("../../assets/anon_pfp.png");

type CategoryKey = "all" | "movie" | "tv" | "documentary";

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

const GENRES = [
  "All",
  "Action",
  "Adventure",
  "Animation",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Family",
  "Fantasy",
  "History",
  "Horror",
  "Music",
  "Mystery",
  "Romance",
  "Science Fiction",
  "Thriller",
  "War",
  "Western",
];

export default function LeaderboardScreen() {
  const [category, setCategory] = useState<CategoryKey>("all");
  const [genre, setGenre] = useState("All");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<LeaderItem[]>([]);
  const [genreModalVisible, setGenreModalVisible] = useState(false);

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

        if (genre === "All") {
          const { data, error } = await db
            .from("v_leaderboard_global")
            .select("category, user_id, watched_count");

          if (error) {
            console.error("Leaderboard fetch error:", error.message);
          }

          const rows =
            (data as Array<{
              category: string;
              user_id: string;
              watched_count: number | null;
            }>) || [];

          const counts = new Map<string, number>();

          if (category === "all") {
            // Use the "overall" category which already has the total
            rows
              .filter((row) => row.category === "overall")
              .forEach((row) => {
                counts.set(row.user_id, row.watched_count || 0);
              });
          } else {
            // Filter by specific category (movie, tv, documentary)
            rows
              .filter((row) => row.category === category)
              .forEach((row) => {
                counts.set(row.user_id, row.watched_count || 0);
              });
          }

          const sorted = (allProfiles || [])
            .map((profile: any) => ({
              rank: 0,
              userId: profile.id,
              displayName: profile.display_name || "User",
              username: profile.username || "",
              count: counts.get(profile.id) || 0,
              profilePic: profile.profile_pic || null,
            }))
            .sort((a, b) => b.count - a.count);

          // Assign ranks with tie handling (standard competition ranking)
          let currentRank = 1;
          const nextItems = sorted.map((item, index) => {
            if (index > 0 && item.count < sorted[index - 1].count) {
              currentRank = index + 1; // Skip to position if not tied
            }
            return { ...item, rank: currentRank };
          });

          setItems(nextItems);
          return;
        }

        // Genre filter: compute from v_user_ratings
        let query = db
          .from("v_user_ratings")
          .select("user_id, title_type, genres")
          .contains("genres", [genre]);

        // Only filter by title_type if not "all"
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

        const sorted = (allProfiles || [])
          .map((profile: any) => ({
            rank: 0,
            userId: profile.id,
            displayName: profile.display_name || "User",
            username: profile.username || "",
            count: counts.get(profile.id) || 0,
            profilePic: profile.profile_pic || null,
          }))
          .sort((a, b) => b.count - a.count);

        // Assign ranks with tie handling (standard competition ranking)
        let currentRank = 1;
        const nextItems = sorted.map((item, index) => {
          if (index > 0 && item.count < sorted[index - 1].count) {
            currentRank = index + 1; // Skip to position if not tied
          }
          return { ...item, rank: currentRank };
        });

        setItems(nextItems);
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, [category, genre]);

  const subtitle = useMemo(() => {
    if (genre === "All") {
      return "Number of places on your been list";
    }
    return `${genre} watched count`;
  }, [genre]);

  const renderRow = ({ item }: { item: LeaderItem }) => (
    <View style={styles.row}>
      <Text style={styles.rank}>{item.rank}</Text>

      <Image
        source={item.profilePic ? { uri: item.profilePic } : placeholder_pfp}
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
              style={[styles.tab, category === tab.key && styles.tabActive]}
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

        <Pressable
          style={styles.genreDropdown}
          onPress={() => setGenreModalVisible(true)}
        >
          <Text style={styles.genreDropdownText}>{genre}</Text>
          <Text style={styles.genreChevron}>⌄</Text>
        </Pressable>

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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff",
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
    color: "#000",
  },
  subtitle: {
    color: "#8B8B8B",
    fontSize: 14,
    marginBottom: 12,
  },
  tabs: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E6E6E6",
    overflow: "hidden",
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7F7F7",
  },
  tabActive: {
    backgroundColor: "#fff",
  },
  tabText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#000",
  },
  genreDropdown: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#E6E6E6",
    paddingVertical: 8,
    marginBottom: 8,
  },
  genreDropdownText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  genreChevron: {
    fontSize: 16,
    color: "#666",
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
    borderBottomColor: "#e5e5e5",
  },
  rank: {
    fontSize: 16,
    fontWeight: "700",
    width: 26,
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
    color: "#000",
  },
  username: {
    fontSize: 13,
    color: "#8B8B8B",
    marginTop: 2,
  },
  score: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    marginRight: 8,
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    paddingVertical: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
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
    color: "#666",
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
    color: "#111",
  },
  modalOptionSelected: {
    fontWeight: "600",
    color: "#007AFF",
  },
});
