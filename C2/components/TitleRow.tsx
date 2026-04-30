import React, { useMemo } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { TMDBMediaResult, getGenreNames, getPosterUrl } from "../TMDB";

import { useAppTheme } from "../contexts/ThemeContext";
import { ThemeColors } from "../constants/theme";

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
  const { colors: t } = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

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

const makeStyles = (t: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: t.divider,
      gap: 12,
      backgroundColor: t.surface,
    },
    poster: {
      width: 52,
      height: 78,
      borderRadius: 6,
      backgroundColor: t.posterPlaceholder,
    },
    noPoster: {
      width: 52,
      height: 78,
      borderRadius: 6,
      backgroundColor: t.posterPlaceholder,
      alignItems: "center",
      justifyContent: "center",
    },
    noPosterText: {
      fontSize: 10,
      color: t.textMuted,
      fontFamily: "DM Sans",
    },
    metaCol: {
      flexShrink: 1,
      justifyContent: "center",
    },
    titleText: {
      fontSize: 15,
      color: t.textPrimary,
      fontWeight: "600",
      fontFamily: "DM Sans",
    },
    metaText: {
      fontSize: 12,
      color: t.textSecondary,
      marginTop: 4,
      fontFamily: "DM Sans",
    },
    genreText: {
      fontSize: 12,
      color: t.textMuted,
      marginTop: 2,
      fontFamily: "DM Sans",
    },
  });

export default TitleRow;
