import NavBar from "@/components/NavBar";
import { Link } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ListRenderItemInfo,
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

  useEffect(() => {
    loadRankedList();
  }, []);

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

  return (
    <View style={styles.screen}>
      <View style={styles.headerWrapper}>
        <Text style={styles.headerTitle}>My Top Watchlist</Text>

        <Link href="/(tabs)/feed" style={styles.backLink}>
          ← Back to Feed
        </Link>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 30 }} size="large" />
      ) : (
        <FlatList
          data={items}
          renderItem={renderRow}
          keyExtractor={(item) => item.title}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContent}
        />
      )}

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
    paddingBottom: "3%",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000",
  },
  backLink: {
    marginTop: 8,
    fontSize: 14,
    color: "#007AFF",
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
});
