import {
  StyleSheet,
  FlatList,
  View,
  Image,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import React, { useState } from "react";

import FeedItem from "./FeedItem";

const luke_pfp = require("../assets/PFPs/Luke_pfp.png");
const suzy_pfp = require("../assets/PFPs/Suzy_pfp.png");
const ray_pfp = require("../assets/PFPs/Ray_pfp.png");
const jamal_pfp = require("../assets/PFPs/Rylan_pfp.png");

const likeIcon = require("../assets/Icons/like_icon.png");
const likedIcon = require("../assets/Icons/liked_heart.png");

const feedData = [
  {
    id: "1",
    userName: "Luke",
    action: "Ranked",
    title: "K-Pop Demon Hunters",
    rating: "9.4",
    profileImage: luke_pfp,
    timestamp: "3 hours ago",
    description: "",
    likes: 2,
  },
  {
    id: "2",
    userName: "Suzy",
    action: "Ranked",
    title: "Superman",
    rating: "9.7",
    profileImage: suzy_pfp,
    timestamp: "2 hours ago",
    description: "Inspirational movie",
    likes: 11,
  },
  {
    id: "3",
    userName: "Ray",
    action: "Ranked",
    title: "Him",
    rating: "4.6",
    profileImage: ray_pfp,
    timestamp: "yesterday",
    description: "Genuinely a disappointing watch...",
    likes: 3,
  },
  //   {
  //   id: "4",
  //   userName: "Nora",
  //   action: "Ranked",
  //   title: "Demon Slayer: Kimetsu no Yaiba Infinity Castle",
  //   rating: "10/10",
  //   profileImage: nora_pfp,
  //   timestamp: "yesterday",
  //   description: "10/10 Animation, 10/10 Music, 10/10 Flashbacks",
  //   likes: 1,
  // },
  {
    id: "4",
    userName: "Jamal",
    action: "Bookmarked",
    title: "Tron",
    profileImage: jamal_pfp,
    timestamp: "Monday",
    description: "",
    likes: 0,
  },
];

const Feed = () => {
  const [liked, setLiked] = useState<{ [key: string]: number }>({});

  const renderFeedItem = ({ item }: { item: any }) => (
    <FeedItem
      userName={item.userName}
      action={item.action}
      title={item.title}
      rating={item.rating}
      profileImage={item.profileImage}
      timestamp={item.timestamp}
      description={item.description}
      isLiked={liked[item.id] === 1}
      likeCount={item.likes + (liked[item.id] === 1 ? 1 : 0)}
      onPress={() => {
        setLiked((prev) => ({
          ...prev,
          [item.id]: prev[item.id] === 1 ? 0 : 1,
        }));
      }}
      likeIcon={likeIcon}
      likedIcon={likedIcon}
    />
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={feedData}
        renderItem={renderFeedItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={true}
        scrollEnabled={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: "3%",
    paddingTop: "5%",
    width: "100%",
    paddingBottom: "25%",
  },
  list: {
    gap: 10,
  },
});

export default Feed;
