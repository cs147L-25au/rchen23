import React from "react";
import { FlatList, Image, StyleSheet, Text, View } from "react-native";
import NavBar from "../../components/NavBar";

const placeholder_pfp = require("../../assets/profile_pic.png");

type LeaderItem = {
  rank: number;
  username: string;
  score: number;
  avatar: any;
};

const DATA: LeaderItem[] = [
  {
    rank: 1,
    username: "@RRChen",
    score: 3,
    avatar: placeholder_pfp,
  },
];

export default function LeaderboardScreen() {
  const renderRow = ({ item }: { item: LeaderItem }) => (
    <View style={styles.row}>
      <Text style={styles.rank}>{item.rank}</Text>

      <Image source={item.avatar} style={styles.avatar} />

      <Text style={styles.username}>{item.username}</Text>

      <Text style={styles.score}>{item.score}</Text>
    </View>
  );

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.title}>Leaderboard</Text>

        <FlatList
          data={DATA}
          renderItem={renderRow}
          keyExtractor={(item) => item.username}
          contentContainerStyle={styles.listContainer}
        />
      </View>

      <NavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    paddingTop: "18%",
    paddingHorizontal: 20,
  },

  title: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 20,
    color: "#000",
  },

  listContainer: {
    paddingBottom: 100,
  },

  row: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },

  rank: {
    fontSize: 18,
    fontWeight: "700",
    width: 30,
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },

  username: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },

  score: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    marginRight: 8,
  },
});
