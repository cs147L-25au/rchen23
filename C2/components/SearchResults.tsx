import { useRouter } from "expo-router";
import React from "react";
import {
  FlatList,
  Image,
  ListRenderItemInfo,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { TMDBMediaResult, getPosterUrl } from "../TMDB";

interface SearchResultsProps {
  results: TMDBMediaResult[];
}

const SearchResults: React.FC<SearchResultsProps> = ({ results }) => {
  const router = useRouter();

  const handlePress = (item: TMDBMediaResult) => {
    const displayTitle = item.title ?? item.name ?? "(no title)";
    const anyItem = item as any; // TMDB has these, but your type doesn’t declare them

    router.push({
      pathname: "/(tabs)/mediaDetails", // ✅ matches app/(tabs)/mediaDetails.tsx
      params: {
        id: String(item.id),
        title: displayTitle,
        mediaType: item.media_type ?? "",
        overview: anyItem.overview ?? "",
        posterPath: item.poster_path ?? "",
        voteAverage:
          anyItem.vote_average != null ? String(anyItem.vote_average) : "",
        voteCount: anyItem.vote_count != null ? String(anyItem.vote_count) : "",
      },
    });
  };

  const renderItem = ({ item }: ListRenderItemInfo<TMDBMediaResult>) => {
    const displayTitle = item.title ?? item.name ?? "(no title)";
    const posterUri = getPosterUrl(item.poster_path, item.profile_path);

    return (
      <Pressable onPress={() => handlePress(item)}>
        <View style={styles.resultRow}>
          {posterUri ? (
            <Image source={{ uri: posterUri }} style={styles.poster} />
          ) : (
            <View style={styles.noPoster}>
              <Text style={styles.noPosterText}>No Img</Text>
            </View>
          )}

          <View style={styles.metaCol}>
            <Text style={styles.titleText}>{displayTitle}</Text>
            <Text style={styles.typeText}>
              {item.media_type === "movie"
                ? "Movie"
                : item.media_type === "tv"
                ? "TV Show"
                : "Person"}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.wrapper}>
      <FlatList
        data={results}
        keyExtractor={(item) => `${item.media_type}-${item.id}`}
        renderItem={renderItem}
        style={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    width: "100%",
    paddingHorizontal: "3%",
    paddingTop: "5%",
    paddingBottom: "18.5%",
  },
  list: {
    width: "100%",
    paddingHorizontal: "3%",
  },
  resultRow: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    gap: 12,
  },
  poster: {
    width: 60,
    height: 90,
    borderRadius: 6,
    backgroundColor: "#d9d9d9",
  },
  noPoster: {
    width: 60,
    height: 90,
    borderRadius: 6,
    backgroundColor: "#d9d9d9",
    alignItems: "center",
    justifyContent: "center",
  },
  noPosterText: {
    fontSize: 10,
    color: "#555",
    fontFamily: "DM Sans",
  },
  metaCol: {
    flexShrink: 1,
    justifyContent: "center",
  },
  titleText: {
    fontSize: 16,
    color: "#000000",
    fontWeight: "600",
    fontFamily: "DM Sans",
  },
  typeText: {
    fontSize: 13,
    color: "#666565ff",
    marginTop: 4,
    fontFamily: "DM Sans",
  },
});

export default SearchResults;
