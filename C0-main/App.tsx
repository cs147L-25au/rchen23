// IMPORTING things we need!
// View, Text, Image, and StyleSheet are core building blocks for React Native apps.
import React, { useState } from "react";
import { Image, StyleSheet, Text, View, Pressable, Button } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// EXPORTING something we build!
// Remember, UI Components are functions under the hood and they return JSX (UI). This App component returns a "SafeAreaView" with more components nested underneath.
export default function App() {
  // Feel free to edit anything starting here! --------------------------------------------

  const welcomeMessage: string = "🥥 Richard Chen 🥥";
  let foodPic = [
    require("./assets/interesting_foods/birds_nest_dessert.png"),
    require("./assets/interesting_foods/black_pepper_ice_cream.png"),
    require("./assets/interesting_foods/carrot_salmon.png"),
    require("./assets/interesting_foods/citrons.png"),
    require("./assets/interesting_foods/cute_ginger_bread_house.png"),
    require("./assets/interesting_foods/disneyland_turkey.png"),
    require("./assets/interesting_foods/fancy_french_fries.png"),
    require("./assets/interesting_foods/gelato.png"),
    require("./assets/interesting_foods/huli_huli_chicken.png"),
    require("./assets/interesting_foods/interstellar_texas_bbq.png"),
    require("./assets/interesting_foods/italian_chocolates.png"),
    require("./assets/interesting_foods/italian_pizza.png"),
    require("./assets/interesting_foods/jamaican_jerk_chicken.png"),
    require("./assets/interesting_foods/jerk_chicken_chow_mein_burger.png"),
    require("./assets/interesting_foods/kaisen_don_rantei.png"),
    require("./assets/interesting_foods/lychee_pomelo_sago.png"),
    require("./assets/interesting_foods/macarena_paella.png"),
    require("./assets/interesting_foods/norma_tiramisu.png"),
    require("./assets/interesting_foods/raisu_seafood_bowl.png"),
    require("./assets/interesting_foods/screamer.png"),
    require("./assets/interesting_foods/smokey_cheesers.png"),
    require("./assets/interesting_foods/sotto_mare_cioppino.png"),
    require("./assets/interesting_foods/ten_butchers.png"),
    require("./assets/interesting_foods/thai_fried_chicken.png"),
    require("./assets/interesting_foods/weird_veal.png"),
    require("./assets/interesting_foods/yin_yang_soup.png"),
    require("./assets/interesting_foods/absolute_shrinema.png"),
  ]; // url
  let foodText = [
    "food description 1",
    "food description 2",
    "food description 3",
    "food description 4",
    "food description 5",
    "food description 6",
    "food description 7",
    "food description 8",
    "food description 9",
    "food description 10",
    "food description 11",
    "food description 12",
    "food description 13",
    "food description 14",
    "food description 15",
    "food description 16",
    "food description 17",
    "food description 18",
    "food description 19",
    "food description 20",
    "food description 21",
    "food description 22",
    "food description 23",
    "food description 24",
    "food description 25",
    "food description 26",
    "If you made it this far, enjoy a meme! Thanks for clicking!",
  ]; // description
  const [foodOrder, setFoodOrder] = useState(0);

  return (
    <SafeAreaView style={styles.topContainer}>
      <View style={styles.topContainer}>
        <Text style={styles.title}>{welcomeMessage}</Text>
        <View style={styles.imageContainer}>
          <Image
            style={styles.logo}
            source={require("./assets/profile_photo.png")}
            height={200}
            width={200}
          />
        </View>
      </View>
      <View style={styles.lowerContainer}>
        <Text style={styles.paragraph}>
          Click the food to see some interesting dishes I've tried!
        </Text>
        <Pressable
          onPress={() => {
            if (foodOrder < 26) {
              setFoodOrder(foodOrder + 1);
            }
          }}
        >
          {/* update onPress */}
          <View style={styles.imageContainer}>
            <Image
              style={styles.logo}
              source={foodPic[foodOrder]}
              height={410}
              width={390}
            />
          </View>
        </Pressable>
        <Text style={styles.foodReview}>{foodText[foodOrder]}</Text>
        <Button
          title="Reset Foods"
          color="#3427c3ff"
          onPress={() => {
            setFoodOrder(0);
          }}
        ></Button>
      </View>
    </SafeAreaView>
  );
}

// STYLING for our app!
// Here, we define all the styling that we use in our app.
// The format is always "const styles = StyleSheet.create({...})".
// The "styles" object contains style objects. We can access a style X with "styles.X".
// We will learn more about styles and the "StyleSheet" component next Tuesday :-)
const styles = StyleSheet.create({
  topContainer: {
    flex: 1, // We'll learn about "flex" and other flexbox properties in class!
    flexDirection: "column", // Try: 'row' or 'column'
    alignItems: "center", // Try: 'flex-start' or 'center' or 'flex-end'
    justifyContent: "flex-start", // Try: 'flex-start' or 'flex-end' or 'space-between' or 'space-around' or 'space evenly'
    backgroundColor: "#9ecefbff", // Try different color hex codes!
    padding: 10, // Try changing this value!
    paddingVertical: 30,
  },
  imageContainer: {
    flexDirection: "row",
  },
  lowerContainer: {
    flex: 2.5, // We'll learn about "flex" and other flexbox properties in class!
    flexDirection: "column", // Try: 'row' or 'column'
    alignItems: "center", // Try: 'flex-start' or 'center' or 'flex-end'
    justifyContent: "flex-start", // Try: 'flex-start' or 'flex-end' or 'space-between' or 'space-around' or 'space evenly'
    paddingHorizontal: 0, // Try changing this value!
    paddingVertical: 2,
  },
  title: {
    fontSize: 36, // Try changing this value!
    fontWeight: "bold", // Try: 'light' or 'normal' or 'bold'
    textAlign: "center",
    fontFamily: "Courier New",
  },
  paragraph: {
    // Try changing these values!
    margin: 12,
    fontSize: 19,
    fontWeight: "bold",
    textAlign: "center",
    fontFamily: "Courier",
  },
  foodReview: {
    // Try changing these values!
    margin: 12,
    fontSize: 16,
    textAlign: "center",
    fontFamily: "Courier",
  },
  logo: {
    // Try changing these values!
    height: 56,
    width: 56,
    margin: 8,
  },
});
