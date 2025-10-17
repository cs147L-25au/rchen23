import { StyleSheet, Text, View, Image, TouchableOpacity } from "react-native";

export default function FeedItem({
  userName,
  action,
  title,
  rating,
  profileImage,
  timestamp,
  description,
  isLiked,
  likeCount,
  onPress,
  likeIcon,
  likedIcon,
}) {
  return (
    <View style={styles.item}>
      <View style={styles.textSection}>
        <Text style={styles.userName}>{userName}</Text>
        <Text style={styles.actionText}>
          {action} <Text style={styles.bold}>{title}</Text>
        </Text>
        {rating ? <Text style={styles.rating}>Rating: {rating}</Text> : null}
        {description ? (
          <Text style={styles.description}>{description}</Text>
        ) : null}
        <Text style={styles.likeCount}>
          {likeCount} {likeCount === 1 ? "like" : "likes"}
        </Text>
      </View>

      <View style={styles.rightSection}>
        <Image style={styles.profileImage} source={profileImage} />
        <Text style={styles.timestamp}>{timestamp}</Text>
        <TouchableOpacity onPress={onPress}>
          <Image style={styles.heart} source={isLiked ? likedIcon : likeIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    backgroundColor: "white",
    padding: "3%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderColor: "#8c8a8aff",
    borderWidth: 0.5,
    borderRadius: 20,
  },
  textSection: {
    flex: 1,
    marginRight: 10,
  },
  userName: {
    fontSize: 18,
    fontWeight: "700",
    color: "black",
  },
  actionText: {
    fontSize: 16,
    color: "#666",
    fontFamily: "DM Sans",
    marginTop: 2,
  },
  bold: {
    fontWeight: "bold",
    color: "black",
  },
  rating: {
    fontSize: 16,
    color: "#999",
    fontFamily: "DM Sans",
    marginTop: 4,
  },
  description: {
    fontSize: 16,
    color: "black",
    fontFamily: "DM Sans",
    marginTop: 6,
  },
  likeCount: {
    fontSize: 14,
    color: "#666",
    marginTop: 6,
  },
  rightSection: {
    alignItems: "center",
    gap: 6,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    resizeMode: "cover",
  },
  timestamp: {
    fontSize: 11,
    fontFamily: "DM Sans",
    color: "#999",
  },
  heart: {
    width: 22,
    height: 22,
    marginTop: 4,
    resizeMode: "contain",
  },
});
