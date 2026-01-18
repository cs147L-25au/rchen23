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
import { TMDBMediaResult, getGenreNames, getPosterUrl } from "../TMDB";

interface SearchResultsProps {
  results: TMDBMediaResult[];
}

// Get the display type for a person based on their department and gender
function getPersonRole(item: TMDBMediaResult): string {
  const department = item.known_for_department?.toLowerCase();
  const gender = item.gender;

  if (department === "directing") {
    return "Director";
  } else if (department === "acting") {
    // gender: 1 = female, 2 = male
    return gender === 1 ? "Actress" : "Actor";
  } else if (department === "writing") {
    return "Writer";
  } else if (department === "production") {
    return "Producer";
  }
  return "Person";
}

// Format release date as "Month Year"
function formatReleaseDate(dateStr?: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

const SearchResults: React.FC<SearchResultsProps> = ({ results }) => {
  const router = useRouter();

  const handlePress = (item: TMDBMediaResult) => {
    const displayTitle = item.title ?? item.name ?? "(no title)";

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

  const renderItem = ({ item }: ListRenderItemInfo<TMDBMediaResult>) => {
    const displayTitle = item.title ?? item.name ?? "(no title)";
    const posterUri = getPosterUrl(item.poster_path, item.profile_path);

    // Get media type label
    let typeLabel: string;
    if (item.media_type === "movie") {
      typeLabel = "Movie";
    } else if (item.media_type === "tv") {
      typeLabel = "TV Show";
    } else {
      typeLabel = getPersonRole(item);
    }

    // Get genres for movies/TV
    let genresText = "";
    if (
      item.genre_ids &&
      item.genre_ids.length > 0 &&
      item.media_type !== "person"
    ) {
      const genreNames = getGenreNames(item.genre_ids, item.media_type);
      genresText = genreNames.slice(0, 3).join(", ");
    }

    // Get release date
    const releaseDate = formatReleaseDate(
      item.release_date ?? item.first_air_date
    );

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
            <Text style={styles.typeText}>{typeLabel}</Text>
            {genresText.length > 0 && (
              <Text style={styles.genreText}>{genresText}</Text>
            )}
            {releaseDate.length > 0 && (
              <Text style={styles.dateText}>{releaseDate}</Text>
            )}
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
    paddingTop: "0%",
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
  genreText: {
    fontSize: 12,
    color: "#444",
    marginTop: 2,
    fontFamily: "DM Sans",
  },
  dateText: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
    fontFamily: "DM Sans",
  },
});

export default SearchResults;
