import NavBar from "@/components/NavBar";
import { Ionicons } from "@expo/vector-icons";
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
import { getGenresForTitle } from "@/TMDB";

type RankedItem = {
  rank: number;
  title: string;
  subtitle: string; // genres from TMDB
  meta: string; // same item
  score: number;
};

type MediaCategory = "Movies" | "TV Shows" | "Animated" | "Documentaries";
type SortOption = "Score" | "Title" | "Date added";

const CATEGORIES: MediaCategory[] = [
  "Movies",
  "TV Shows",
  "Animated",
  "Documentaries",
];
const SORT_OPTIONS: SortOption[] = ["Score", "Title", "Date added"];

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

  useEffect(() => {
    loadRankedList();
  }, [selectedCategory]);

  const loadRankedList = async () => {
    try {
      setLoading(true);

      // 1. Get all posts with ratings
      const { data, error } = await db
        .from("posts")
        .select("movie_name, rating")
        .not("rating", "is", null);

      if (error) {
        console.error("List fetch error:", error);
        return;
      }

      if (!data || data.length === 0) {
        setItems([]);
        return;
      }

      // 2. Group by movie
      const grouped: Record<string, number[]> = {};

      data.forEach((row) => {
        if (!row.movie_name) return;
        if (!grouped[row.movie_name]) grouped[row.movie_name] = [];
        grouped[row.movie_name].push(row.rating);
      });

      // 3. Build ranked items with genres from TMDB
      const movieEntries = Object.entries(grouped);

      // Fetch genres for all movies in parallel
      const genrePromises = movieEntries.map(([movie]) =>
        getGenresForTitle(movie)
      );
      const genres = await Promise.all(genrePromises);

      let ranked: RankedItem[] = movieEntries.map(([movie, ratings], idx) => {
        const avg =
          ratings.reduce((a, b) => a + b, 0) / Math.max(ratings.length, 1);

        return {
          rank: 0, // will fill after sorting
          title: movie,
          subtitle: genres[idx], // genres from TMDB
          meta: "", // also optional
          score: parseFloat(avg.toFixed(1)),
        };
      });

      // 4. Sort by score (DESC)
      ranked.sort((a, b) => b.score - a.score);

      // 5. Apply ranking numbers
      ranked = ranked.map((item, idx) => ({
        ...item,
        rank: idx + 1,
      }));

      setItems(ranked);
    } catch (err) {
      console.error("List error:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderRow = ({ item }: ListRenderItemInfo<RankedItem>) => {
    const { borderColor, bgColor, textColor } = getColor(item.score);

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

        <View
          style={[
            styles.scoreBubble,
            { borderColor: borderColor, backgroundColor: bgColor },
          ]}
        >
          <Text style={[styles.scoreText, { color: textColor }]}>
            {item.score.toFixed(1)}
          </Text>
        </View>
      </View>
    );
  };

  // Sort items based on selected option
  const sortedItems = [...items].sort((a, b) => {
    if (sortBy === "Score") return b.score - a.score;
    if (sortBy === "Title") return a.title.localeCompare(b.title);
    return 0; // Date added - keep original order
  });

  return (
    <View style={styles.screen}>
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
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        <View style={styles.tabActive}>
          <Text style={styles.tabTextActive}>Watched</Text>
        </View>
        <View style={styles.tab}>
          <Text style={styles.tabText}>Want to Watch</Text>
        </View>
        <View style={styles.tab}>
          <Text style={styles.tabText}>Favorites</Text>
        </View>
      </ScrollView>

      {/* Sort row */}
      <Pressable style={styles.sortRow} onPress={() => setShowSortModal(true)}>
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
    paddingBottom: 12,
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
  },
  tabsContent: {
    paddingHorizontal: 16,
    gap: 24,
  },
  tab: {
    paddingVertical: 12,
  },
  tabActive: {
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "#000",
  },
  tabText: {
    fontSize: 15,
    color: "#888",
    fontWeight: "500",
  },
  tabTextActive: {
    fontSize: 15,
    color: "#000",
    fontWeight: "600",
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
