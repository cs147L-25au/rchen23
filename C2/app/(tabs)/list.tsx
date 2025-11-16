// app/(tabs)/list.tsx
import NavBar from "@/components/NavBar";
import { Link } from "expo-router";
import React from "react";
import {
  FlatList,
  ListRenderItemInfo,
  StyleSheet,
  Text,
  View,
} from "react-native";

type RankedItem = {
  rank: number;
  title: string;
  subtitle: string;
  meta: string;
  score: number;
};

const getColor = (score: number) => {
  if (score >= 7.5) {
    return {
      borderColor: "#2a4",
      bgColor: "#2a4" + "05", // light green with alpha
      textColor: "#2a4",
    };
  } else if (score >= 5) {
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

const DATA: RankedItem[] = [
  {
    rank: 1,
    title: "The Godfather",
    subtitle: "Crime • Drama • Mafia",
    meta: "Francis Ford Coppola • USA • 1972",
    score: 10.0,
  },
  {
    rank: 2,
    title: "One Piece",
    subtitle: "Adventure • Fantasy • Shōnen",
    meta: "Toei Animation • Japan • 1999–Present",
    score: 10.0,
  },
  {
    rank: 3,
    title: "Breaking Bad",
    subtitle: "Crime • Thriller • Drama",
    meta: "AMC • USA • 2008–2013",
    score: 9.9,
  },
  {
    rank: 4,
    title: "When Life Gives You Tangerines",
    subtitle: "Romance • Drama • Slice of Life",
    meta: "Korea • Netflix • 2024",
    score: 9.9,
  },
  {
    rank: 5,
    title: "Naruto: Shippuden",
    subtitle: "Action • Fantasy • Shōnen",
    meta: "Studio Pierrot • Japan • 2007–2017",
    score: 9.8,
  },
  {
    rank: 6,
    title: "Better Call Saul",
    subtitle: "Drama • Crime • Legal Thriller",
    meta: "AMC • USA • 2015–2022",
    score: 9.8,
  },
  {
    rank: 7,
    title: "Arcane",
    subtitle: "Action • Sci-Fi • Animation",
    meta: "Netflix • Riot Games / Fortiche • 2021–Present",
    score: 9.7,
  },
  {
    rank: 8,
    title: "La La Land",
    subtitle: "Romance • Musical • Drama",
    meta: "Damien Chazelle • USA • 2016",
    score: 9.6,
  },
  {
    rank: 9,
    title: "How I Met Your Mother",
    subtitle: "Comedy • Romance • Sitcom",
    meta: "CBS • USA • 2005–2014",
    score: 9.5,
  },
  {
    rank: 10,
    title: "Oppenheimer",
    subtitle: "Biopic • Historical • Thriller",
    meta: "Christopher Nolan • USA • 2023",
    score: 9.5,
  },
  {
    rank: 11,
    title: "Hotel Del Luna",
    subtitle: "Fantasy • Romance • Drama",
    meta: "tvN • Korea • 2019",
    score: 9.4,
  },
  {
    rank: 12,
    title: "Shōgun",
    subtitle: "Drama • Historical • Political",
    meta: "FX • Japan / USA • 2024",
    score: 9.4,
  },
  {
    rank: 13,
    title: "Superman",
    subtitle: "Action • Superhero • Sci-Fi",
    meta: "DC Studios • USA • 2025",
    score: 9.3,
  },
  {
    rank: 14,
    title: "Dune: Part Two",
    subtitle: "Sci-Fi • Epic • Adventure",
    meta: "Denis Villeneuve • USA • 2024",
    score: 9.3,
  },
  {
    rank: 15,
    title: "Game of Thrones",
    subtitle: "Fantasy • Drama • Epic",
    meta: "HBO • USA / UK • 2011–2019",
    score: 9.1,
  },
  {
    rank: 16,
    title: "It",
    subtitle: "Horror • Mystery • Thriller",
    meta: "Stephen King Adaptation • USA • 2017",
    score: 9.0,
  },
  {
    rank: 17,
    title: "Chief of Staff",
    subtitle: "Political • Drama • Thriller",
    meta: "JTBC • Korea • 2019",
    score: 8.8,
  },
  {
    rank: 18,
    title: "K-Pop Demon Hunters",
    subtitle: "Action • Fantasy • Animation",
    meta: "Sony Pictures Animation • 2025",
    score: 8.8,
  },
  {
    rank: 19,
    title: "The Shadow’s Edge",
    subtitle: "Action • Crime • Thriller",
    meta: "Macau / Mandarin • 2025",
    score: 8.7,
  },
  {
    rank: 20,
    title: "Chainsaw Man – The Movie: Reze Arc",
    subtitle: "Action • Dark Fantasy • Supernatural",
    meta: "MAPPA • Japan • 2025",
    score: 8.5,
  },
  {
    rank: 21,
    title: "How I Met Your Father",
    subtitle: "Comedy • Romance • Sitcom",
    meta: "Hulu • USA • 2022–2023",
    score: 7.3,
  },
  {
    rank: 22,
    title: "Him",
    subtitle: "Psychological Horror • Indie",
    meta: "Indie • USA • 2025",
    score: 4.6,
  },
];

const SORTED: RankedItem[] = [...DATA]
  .sort((a, b) => b.score - a.score)
  .map((item, idx) => ({
    ...item,
    rank: idx + 1,
  }));

const ListScreen: React.FC = () => {
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

        {/* back to feed screen (now / (tabs)/feed) */}
        <Link href="/(tabs)/feed" style={styles.backLink}>
          ← Back to Feed
        </Link>
      </View>

      <FlatList
        data={SORTED}
        renderItem={renderRow}
        keyExtractor={(item) => item.title + item.meta}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
      />

      <NavBar />
    </View>
  );
};

export default ListScreen;

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
