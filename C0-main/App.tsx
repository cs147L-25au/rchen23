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
    "Arctic Bird's Nest, Aquavit",
    "Black Pepper Ice Cream, Chang An",
    "Vegan Salmon (made of carrots)",
    "Citrons from Sorrento",
    "Ginger Bread House!",
    "Disneyland Turkey Leg",
    "Bougiefied French Fries",
    "Gelato from Vivoli in Florence",
    "'Huli-Huli' Chicken from Stern 😞",
    "Interstellar Texas BBQ, Austin",
    "Tuscan Chocolates in Florence",
    "Margherita Pizza, Rome",
    "Jamaican Jerk Chicken, Toronto",
    "Kaisen Don at Rantei Sushi",
    "'Lychee Pomelo & Sago' from my HS",
    "Steak Paella from Macarena, Palo Alto",
    "Tiramisu from Norma, NYC",
    "Seafood Bowl from Raisu, Vancouver",
    "A 'Screamer,' aka soft serve in a slushee",
    "Smokey Cheesers from Philadelphia",
    "Crab Ciopinno, Sotto Mare, SF",
    "Ten Butchers Korean BBQ",
    "Thai Fried Chicken at Karakade",
    "Veal Platter..? (from Florence)",
    "Yin-Yang Vegan Soup, Vancouver",
    "If you made it this far, enjoy a meme! (screenshotted from Leafy_Illustrates)",
  ]; // description
  let foodRate = [
    "Score: 10/10. Looked great. Tasted even better",
    "Score: 8/10. Interesting flavor",
    "Score: 7/10. Pretty good but a bit sour.",
    "Score: 2/10. Sour and Bitter 😖",
    "Score: 4/10. Looked better than it tasted",
    "Score: 7/10. Actually pretty good",
    "Score: 3.5/10. The appearance reflected the taste",
    "Score: 12/10. INCREDIBLY DELICIOUS",
    "Score: 4/10. Tasted better than it looked...",
    "Score: 10/10. First bite tasted like heaven. Second one almost sent me there",
    "Score: 6/10. Very interesting taste...",
    "Score: 9/10. 😍😍😍",
    "Score: 8/10. Super Yummy",
    "Score: 9/10. Absolutely Delicious",
    "Score: 1/10. I got food poisoning from this",
    "Score: 10/10. *Chef's kiss*",
    "Score: 8/10. Very good!",
    "Score: 9/10. Couldn't stop eating",
    "Score: 5/10. Way too cold and way too sweet. Truly a once in a lifetime experience",
    "Score: 5/10. A bit too salty for me",
    "Score: 9.5/10. Lived up to the hype",
    "Score: 10/10. This sent me to heaven",
    "Score: 9/10. Best fried chicken I've ever had",
    "Score: 3/10. Dry and bland... also unethical",
    "Score: 8/10. GOATed Soup",
    "Thanks for clicking!",
  ];
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
        <Text style={styles.paragraph}>
          Click the food to see some interesting foods I've tried!
        </Text>
      </View>
      <View style={styles.lowerContainer}>
        <Pressable
          onPress={() => {
            if (foodOrder < 25) {
              setFoodOrder(foodOrder + 1);
            }
          }}
        >
          {/* update onPress */}
          <View style={styles.imageContainer}>
            <Image
              style={styles.logo}
              source={foodPic[foodOrder]}
              height={390}
              width={370}
            />
          </View>
        </Pressable>
        <Text style={styles.foodReview}>{foodText[foodOrder]}</Text>
        <Text style={styles.foodRating}>{foodRate[foodOrder]}</Text>
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
    backgroundColor: "#f7fab8ff", // Try different color hex codes!
    padding: 5, // Try changing this value!
    paddingVertical: 5,
  },
  imageContainer: {
    flexDirection: "row",
  },
  lowerContainer: {
    flex: 1.9, // We'll learn about "flex" and other flexbox properties in class!
    flexDirection: "column", // Try: 'row' or 'column'
    alignItems: "center", // Try: 'flex-start' or 'center' or 'flex-end'
    justifyContent: "flex-start", // Try: 'flex-start' or 'flex-end' or 'space-between' or 'space-around' or 'space evenly'
    paddingHorizontal: 0, // Try changing this value!
    paddingVertical: 0,
  },
  title: {
    fontSize: 36, // Try changing this value!
    fontWeight: "bold", // Try: 'light' or 'normal' or 'bold'
    textAlign: "center",
    fontFamily: "Cochin",
  },
  paragraph: {
    // Try changing these values!
    margin: 8,
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    fontFamily: "Cochin",
  },
  foodReview: {
    // Try changing these values!
    margin: 6,
    padding: 0,
    fontSize: 20,
    textAlign: "center",
    fontFamily: "Cochin-Bold",
  },
  foodRating: {
    // Try changing these values!
    margin: 4,
    padding: 0,
    fontSize: 20,
    textAlign: "center",
    fontWeight: "bold",
    fontFamily: "Cochin",
  },
  logo: {
    // Try changing these values!
    height: 56,
    width: 56,
    margin: 8,
  },
});
