import NavBar from "@/components/NavBar";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ListRenderItemInfo,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import db from "@/database/db";
import { getCurrentUserId } from "../../lib/ratingsDb";
import { getUserWatchlist } from "../../lib/watchlistDb";

type RankedItem = {
  rank: number;
  title: string;
  subtitle: string; // genres from TMDB
  meta: string; // same item
  score: number | null;
};

type MediaCategory = "Movies" | "TV Shows" | "Documentaries";
type SortOption = "Score" | "Title" | "Date added";
type ListTab = "Watched" | "Watchlist" | "Favorites";

const CATEGORIES: MediaCategory[] = ["Movies", "TV Shows", "Documentaries"];
const SORT_OPTIONS: SortOption[] = ["Score", "Title", "Date added"];
const TABS_HEIGHT = 44;

const getColor = (score: number) => {
  if (score >= 7.0) {
    return {
      borderColor: "#2a4",
      bgColor: "#2a4" + "05",
      textColor: "#2a4",
    };
  } else if (score >= 4) {
    return {
      borderColor: "#d6a500",
      bgColor: "#d6a50005",
      textColor: "#d6a500",
    };
  } else {
    return {
      borderColor: "#b22",
      bgColor: "#b2220005",
      textColor: "#b22",
    };
  }
};

export default function ListScreen() {
  const [items, setItems] = useState<RankedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] =
    useState<MediaCategory>("Movies");
  const [sortBy, setSortBy] = useState<SortOption>("Score");
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [headerFixedHeight, setHeaderFixedHeight] = useState(0);
  const [activeTab, setActiveTab] = useState<ListTab>("Watched");
  const params = useLocalSearchParams<{ tab?: string }>();

  useEffect(() => {
    loadList();
  }, [selectedCategory, activeTab]);

  useEffect(() => {
    const tabParam = String(params.tab || "").toLowerCase();
    if (tabParam === "watchlist") setActiveTab("Watchlist");
    else if (tabParam === "watched") setActiveTab("Watched");
    else if (tabParam === "favorites") setActiveTab("Favorites");
  }, [params.tab]);

  const loadList = async () => {
    try {
      setLoading(true);

      if (activeTab === "Watchlist") {
        const userId = await getCurrentUserId();
        if (!userId) {
          setItems([]);
          return;
        }

        const watchlist = await getUserWatchlist(userId);
        const ranked: RankedItem[] = (watchlist || []).map(
          (row: any, idx: number) => ({
            rank: idx + 1,
            title: row.titles?.title || "Unknown",
            subtitle: Array.isArray(row.titles?.genres)
              ? row.titles.genres.join(", ")
              : row.titles?.genres || "Unknown genre",
            meta: "Watchlist",
            score: null,
          }),
        );
        setItems(ranked);
        return;
      }

      // Map category to title_type filter
      const titleTypeMap: Record<MediaCategory, string | null> = {
        Movies: "movie",
        "TV Shows": "tv",
        Documentaries: "documentary",
      };
      const titleTypeFilter = titleTypeMap[selectedCategory];

      // Query v_user_ratings view
      let query = db
        .from("v_user_ratings")
        .select(
          "title, genres, score, category, category_rank, global_rank, title_type",
        )
        .order("global_rank", { ascending: true });

      // Filter by title_type if not showing all
      if (titleTypeFilter) {
        query = query.eq("title_type", titleTypeFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error("List fetch error:", error);
        return;
      }

      if (!data || data.length === 0) {
        setItems([]);
        return;
      }

      const scoresUnlocked = data.length >= 10;

      // Build ranked items from v_user_ratings
      const ranked: RankedItem[] = data.map((row: any, idx: number) => ({
        rank: idx + 1,
        title: row.title || "Unknown",
        subtitle: Array.isArray(row.genres)
          ? row.genres.join(", ")
          : row.genres || "Unknown genre",
        meta: row.category
          ? `${row.category.charAt(0).toUpperCase()}${row.category.slice(1)}`
          : "",
        score: scoresUnlocked ? (row.score ?? null) : null,
      }));

      setItems(ranked);
    } catch (err) {
      console.error("List error:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderRow = ({ item }: ListRenderItemInfo<RankedItem>) => {
    const hasScore = typeof item.score === "number";
    const { borderColor, bgColor, textColor } = hasScore
      ? getColor(item.score as number)
      : { borderColor: "#ccc", bgColor: "#fff", textColor: "#666" };

    return (
      <View style={styles.row}>
        <View style={styles.leftSide}>
          <Text style={styles.rankText}>{item.rank}.</Text>

          <View style={styles.textBlock}>
            <Text style={styles.titleText}>{item.title}</Text>
            <Text style={styles.subtitleText}>{item.subtitle}</Text>
            <Text style={styles.metaText}>{item.meta}</Text>
          </View>
        </View>

        {hasScore && (
          <View
            style={[
              styles.scoreBubble,
              { borderColor: borderColor, backgroundColor: bgColor },
            ]}
          >
            <Text style={[styles.scoreText, { color: textColor }]}>
              {(item.score as number).toFixed(1)}
            </Text>
          </View>
        )}
      </View>
    );
  };

  // Sort items based on selected option
  const sortedItems = [...items].sort((a, b) => {
    if (sortBy === "Score") {
      const aScore = a.score ?? -1;
      const bScore = b.score ?? -1;
      return bScore - aScore;
    }
    if (sortBy === "Title") return a.title.localeCompare(b.title);
    return 0; // Date added - keep original order
  });

  return (
    <View style={styles.screen}>
      <View
        style={styles.headerFixedContainer}
        onLayout={(e) => setHeaderFixedHeight(e.nativeEvent.layout.height)}
      >
        {/* Header with category dropdown */}
        <View style={styles.headerWrapper}>
          <Pressable
            style={styles.categoryDropdown}
            onPress={() => setShowCategoryModal(true)}
          >
            <Text style={styles.headerTitle}>{selectedCategory}</Text>
            <Ionicons name="chevron-down" size={24} color="#000" />
          </Pressable>
        </View>

        {/* Tabs row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.tabsContainer, { height: TABS_HEIGHT }]}
          contentContainerStyle={styles.tabsContent}
        >
          <Pressable
            style={activeTab === "Watched" ? styles.tabActive : styles.tab}
            onPress={() => setActiveTab("Watched")}
          >
            <Text
              style={
                activeTab === "Watched" ? styles.tabTextActive : styles.tabText
              }
            >
              Watched
            </Text>
          </Pressable>
          <Pressable
            style={activeTab === "Watchlist" ? styles.tabActive : styles.tab}
            onPress={() => setActiveTab("Watchlist")}
          >
            <Text
              style={
                activeTab === "Watchlist"
                  ? styles.tabTextActive
                  : styles.tabText
              }
            >
              Watchlist
            </Text>
          </Pressable>
          <Pressable
            style={activeTab === "Favorites" ? styles.tabActive : styles.tab}
            onPress={() => setActiveTab("Favorites")}
          >
            <Text
              style={
                activeTab === "Favorites"
                  ? styles.tabTextActive
                  : styles.tabText
              }
            >
              Favorites
            </Text>
          </Pressable>
        </ScrollView>
      </View>

      <View
        style={[styles.contentBelowTabs, { paddingTop: headerFixedHeight }]}
      >
        {/* Sort row */}
        <Pressable
          style={styles.sortRow}
          onPress={() => setShowSortModal(true)}
        >
          <Ionicons name="swap-vertical" size={18} color="#000" />
          <Text style={styles.sortText}>{sortBy}</Text>
        </Pressable>

        {/* Content */}
        {loading ? (
          <ActivityIndicator style={{ marginTop: 30 }} size="large" />
        ) : sortedItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              No {selectedCategory.toLowerCase()} rated yet
            </Text>
            <Text style={styles.emptySubtext}>
              Start rating to build your list!
            </Text>
          </View>
        ) : (
          <FlatList
            data={sortedItems}
            renderItem={renderRow}
            keyExtractor={(item) => item.title}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>

      {/* Category Selection Modal */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowCategoryModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Category</Text>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat}
                style={styles.modalOption}
                onPress={() => {
                  setSelectedCategory(cat);
                  setShowCategoryModal(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    selectedCategory === cat && styles.modalOptionSelected,
                  ]}
                >
                  {cat}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Sort Selection Modal */}
      <Modal
        visible={showSortModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSortModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowSortModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sort list by</Text>
            {SORT_OPTIONS.map((option) => (
              <Pressable
                key={option}
                style={styles.modalOption}
                onPress={() => {
                  setSortBy(option);
                  setShowSortModal(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    sortBy === option && styles.modalOptionSelected,
                  ]}
                >
                  {option}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      <NavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff",
    paddingBottom: 100,
  },
  headerWrapper: {
    marginTop: "15%",
    paddingHorizontal: "4%",
    paddingBottom: 8,
  },
  categoryDropdown: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000",
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
    flexGrow: 0,
    paddingTop: 0,
  },
  headerFixedContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    zIndex: 10,
  },
  contentBelowTabs: {
    flex: 1,
  },
  tabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
    gap: 24,
  },
  tab: {
    paddingVertical: 0,
  },
  tabActive: {
    paddingVertical: 0,
    borderBottomWidth: 2,
    borderBottomColor: "#000",
  },
  tabText: {
    fontSize: 15,
    color: "#888",
    fontWeight: "500",
    lineHeight: 20,
  },
  tabTextActive: {
    fontSize: 15,
    color: "#000",
    fontWeight: "600",
    lineHeight: 20,
  },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  sortText: {
    fontSize: 14,
    color: "#000",
    fontWeight: "500",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  leftSide: {
    flexDirection: "row",
    flexShrink: 1,
    flexGrow: 1,
  },
  rankText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginRight: 8,
    lineHeight: 20,
  },
  textBlock: {
    flexShrink: 1,
    flexGrow: 1,
  },
  titleText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    lineHeight: 20,
  },
  subtitleText: {
    fontSize: 14,
    color: "#444",
    lineHeight: 18,
    marginTop: 2,
  },
  metaText: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
    marginTop: 2,
  },
  scoreBubble: {
    minWidth: 40,
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreText: {
    fontSize: 14,
    fontWeight: "600",
  },
  separator: {
    height: 1,
    backgroundColor: "#e5e5e5",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#888",
    marginTop: 8,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  modalTitle: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginBottom: 16,
  },
  modalOption: {
    paddingVertical: 16,
    alignItems: "center",
  },
  modalOptionText: {
    fontSize: 18,
    color: "#000",
  },
  modalOptionSelected: {
    fontWeight: "600",
    color: "#007AFF",
  },
});
