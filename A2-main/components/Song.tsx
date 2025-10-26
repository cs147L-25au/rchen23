/****** PART 4: Display Song List. See also App.tsx */
import { View, Image, Text, StyleSheet } from "react-native";
import { Track } from "../utils/types";
import millisToMinutesAndSeconds from "../utils/millisToMinutesAndSeconds";
import Themes from "../assets/Themes/themes";

interface SongProps {
  track: Track;
  index: number;
}

const Song = ({ track, index }: SongProps) => {
  const artists =
    track.songArtists?.map((artist) => artist.name).join(", ") ||
    "Unknown Artist";

  const duration = millisToMinutesAndSeconds(track.duration);

  return (
    <View style={styles.container}>
      {/* Song Index Box */}
      <View style={styles.indexBox}>
        <Text style={styles.indexText}>{index + 1}</Text>
      </View>

      {/* Album Image */}
      <View style={styles.imageBox}>
        {track.imageUrl ? (
          <Image source={{ uri: track.imageUrl }} style={styles.albumImage} />
        ) : (
          <View
            style={[styles.albumImage, { backgroundColor: Themes.colors.gray }]}
          />
        )}
      </View>

      {/* Song Title & Artist Container */}
      <View style={styles.songInfoColumn}>
        <Text style={styles.songTitle} numberOfLines={1}>
          {track.songTitle}
        </Text>
        <Text style={styles.artistName} numberOfLines={1}>
          {artists}
        </Text>
      </View>

      {/* Album Name */}
      <View style={styles.albumNameBox}>
        <Text style={styles.albumName} numberOfLines={1}>
          {track.albumName}
        </Text>
      </View>

      {/* Duration Column */}
      <View style={styles.songDurationDisplay}>
        <Text style={styles.duration}>{duration}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Themes.colors.darkGray,
    alignItems: "center",
    gap: 10,
  },
  indexBox: {
    width: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  imageBox: {
    width: 70,
    justifyContent: "center",
    alignItems: "center",
  },
  albumImage: {
    width: 50,
    height: 50,
    borderRadius: 4,
  },
  songInfoColumn: {
    flex: 1,
    justifyContent: "center",
  },
  albumNameBox: {
    flex: 1,
    justifyContent: "center",
  },
  songDurationDisplay: {
    width: 50,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  indexText: {
    color: Themes.colors.white,
    fontSize: 14,
    fontWeight: "bold",
  },
  songTitle: {
    color: Themes.colors.white,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
  artistName: {
    color: Themes.colors.gray,
    fontSize: 11,
  },
  albumName: {
    color: Themes.colors.white,
    fontSize: 12,
  },
  duration: {
    color: Themes.colors.white,
    fontSize: 12,
    fontWeight: "500",
  },
});

export default Song;
