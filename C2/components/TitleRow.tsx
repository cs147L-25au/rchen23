import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { TMDBMediaResult, getGenreNames, getPosterUrl } from "../TMDB";

type TitleRowProps = {
  item: TMDBMediaResult;
  onPress: () => void;
};

const formatReleaseDate = (dateStr?: string): string => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
};

const TitleRow: React.FC<TitleRowProps> = ({ item, onPress }) => {
  const displayTitle = item.title ?? item.name ?? "(no title)";
  const posterUri = getPosterUrl(item.poster_path, item.profile_path);

  const typeLabel = item.media_type === "tv" ? "TV Show" : "Movie";
  const releaseDate = formatReleaseDate(
    item.release_date ?? item.first_air_date,
  );

  let genresText = "";
  if (item.genre_ids && item.genre_ids.length > 0) {
    const genreNames = getGenreNames(item.genre_ids, item.media_type);
    genresText = genreNames.slice(0, 3).join(", ");
  }

  const metaLine = [typeLabel, releaseDate].filter(Boolean).join(" · ");

  return (
    <Pressable style={styles.row} onPress={onPress}>
      {posterUri ? (
        <Image source={{ uri: posterUri }} style={styles.poster} />
      ) : (
        <View style={styles.noPoster}>
          <Text style={styles.noPosterText}>No Img</Text>
        </View>
      )}
      <View style={styles.metaCol}>
        <Text style={styles.titleText}>{displayTitle}</Text>
        {metaLine.length > 0 && <Text style={styles.metaText}>{metaLine}</Text>}
        {genresText.length > 0 && (
          <Text style={styles.genreText}>{genresText}</Text>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#efefef",
    gap: 12,
  },
  poster: {
    width: 52,
    height: 78,
    borderRadius: 6,
    backgroundColor: "#d9d9d9",
  },
  noPoster: {
    width: 52,
    height: 78,
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
    fontSize: 15,
    color: "#000000",
    fontWeight: "600",
    fontFamily: "DM Sans",
  },
  metaText: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    fontFamily: "DM Sans",
  },
  genreText: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
    fontFamily: "DM Sans",
  },
});

export default TitleRow;
