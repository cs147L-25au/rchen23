import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ListRenderItemInfo,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import NavBar from "../../components/NavBar";
import {
  fetchTrendingDetailed,
  getPosterUrl,
  TrendingMovieDetailed,
} from "../../TMDB";
import { useAppTheme } from "../../contexts/ThemeContext";
import { ThemeColors } from "../../constants/theme";

export default function AllMoviesScreen() {
  const router = useRouter();
  const { colors: t } = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const [movies, setMovies] = useState<TrendingMovieDetailed[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadMovies(1);
  }, []);

  const loadMovies = async (pageNum: number) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const { items, hasMore: more } = await fetchTrendingDetailed(pageNum, 20);

      if (pageNum === 1) {
        setMovies(items);
      } else {
        setMovies((prev) => {
          const existingIds = new Set(
            prev.map((m) => `${m.media_type}-${m.id}`)
          );
          const newItems = items.filter(
            (item) => !existingIds.has(`${item.media_type}-${item.id}`)
          );
          const combined = [...prev, ...newItems];
          combined.sort((a, b) => b.release_timestamp - a.release_timestamp);
          return combined;
        });
      }

      setHasMore(more);
      setPage(pageNum);
    } catch (err) {
      console.error("Failed to load movies:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadMovies(page + 1);
    }
  };

  const handlePress = (movie: TrendingMovieDetailed) => {
    router.push({
      pathname: "/(tabs)/mediaDetails",
      params: {
        id: String(movie.id),
        title: movie.title,
        mediaType: movie.media_type,
        overview: movie.overview,
        posterPath: movie.poster_path ?? "",
        voteAverage: String(movie.vote_average),
        voteCount: String(movie.vote_count),
      },
    });
  };

  const renderItem = ({ item }: ListRenderItemInfo<TrendingMovieDetailed>) => {
    const posterUri = getPosterUrl(item.poster_path, null);
    const mediaTypeLabel = item.media_type === "movie" ? "Movie" : "TV Show";

    return (
      <Pressable onPress={() => handlePress(item)} style={styles.itemContainer}>
        {posterUri ? (
          <Image source={{ uri: posterUri }} style={styles.poster} />
        ) : (
          <View style={styles.noPoster}>
            <Text style={styles.noPosterText}>No Image</Text>
          </View>
        )}

        <View style={styles.infoContainer}>
          <Text style={styles.titleText} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.mediaType}>{mediaTypeLabel}</Text>
          <Text style={styles.genres} numberOfLines={1}>
            {item.genres}
          </Text>
          <Text style={styles.runtime}>{item.runtime}</Text>
          <Text style={styles.releaseDate}>{item.release_date}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={t.textSecondary} />
        </Pressable>
        <Text style={styles.headerTitle}>Recent Movies</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={t.primary} />
          <Text style={styles.loadingText}>Loading trending titles...</Text>
        </View>
      ) : (
        <FlatList
          data={movies}
          renderItem={renderItem}
          keyExtractor={(item) => `${item.media_type}-${item.id}`}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={t.primary} />
                <Text style={styles.footerText}>Loading more...</Text>
              </View>
            ) : !hasMore && movies.length > 0 ? (
              <View style={styles.footerLoader}>
                <Text style={styles.footerText}>No more titles to load</Text>
              </View>
            ) : null
          }
        />
      )}

      <NavBar />
    </View>
  );
}

const makeStyles = (t: ThemeColors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: t.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingTop: 60,
      paddingBottom: 16,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: t.border,
      backgroundColor: t.surface,
    },
    backButton: {
      marginRight: 12,
      padding: 4,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: t.textPrimary,
      fontFamily: "DM Sans",
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: t.textMuted,
      fontFamily: "DM Sans",
    },
    listContent: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 120,
    },
    itemContainer: {
      flexDirection: "row",
      paddingVertical: 12,
    },
    poster: {
      width: 80,
      height: 120,
      borderRadius: 8,
      backgroundColor: t.posterPlaceholder,
    },
    noPoster: {
      width: 80,
      height: 120,
      borderRadius: 8,
      backgroundColor: t.posterPlaceholder,
      justifyContent: "center",
      alignItems: "center",
    },
    noPosterText: {
      fontSize: 10,
      color: t.textMuted,
      fontFamily: "DM Sans",
    },
    infoContainer: {
      flex: 1,
      marginLeft: 14,
      justifyContent: "center",
    },
    titleText: {
      fontSize: 16,
      fontWeight: "600",
      color: t.textPrimary,
      fontFamily: "DM Sans",
      marginBottom: 4,
    },
    mediaType: {
      fontSize: 13,
      color: t.textMuted,
      fontFamily: "DM Sans",
      marginBottom: 4,
    },
    genres: {
      fontSize: 13,
      color: t.textSecondary,
      fontFamily: "DM Sans",
      marginBottom: 2,
    },
    runtime: {
      fontSize: 12,
      color: t.textMuted,
      fontFamily: "DM Sans",
    },
    releaseDate: {
      fontSize: 12,
      color: t.textMuted,
      fontFamily: "DM Sans",
      marginTop: 2,
    },
    separator: {
      height: 1,
      backgroundColor: t.divider,
    },
    footerLoader: {
      paddingVertical: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    footerText: {
      marginTop: 8,
      fontSize: 13,
      color: t.textMuted,
      fontFamily: "DM Sans",
    },
  });
