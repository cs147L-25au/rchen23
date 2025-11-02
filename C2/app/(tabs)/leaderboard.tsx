import { Image, StyleSheet, View } from "react-native";
import NavBar from "../../components/NavBar";

const underConstruction = require("../../assets/Icons/under_construction.png"); // fixed relative path

export default function LeaderboardScreen() {
  return (
    <View style={styles.page}>
      <View style={styles.imageContainer}>
        <Image
          source={underConstruction}
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      <NavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    marginBottom: "20%",
  },
  image: {
    width: 280,
    height: 280,
  },
});
