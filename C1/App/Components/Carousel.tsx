import { StyleSheet, View, Dimensions, Image } from "react-native";
import React, { useRef } from "react";
import Carousel, { ICarouselInstance } from "react-native-reanimated-carousel";

let recent_movies = [
  require("../../assets/Movies/f1_movie.png"),
  require("../../assets/Movies/him_poster.png"),
  require("../../assets/Movies/weapons.png"),
  require("../../assets/Movies/superman.png"),
  require("../../assets/Movies/f4_poster.png"),
  require("../../assets/Movies/row_tw.png"),
  require("../../assets/Movies/shadows_edge.png"),
  require("../../assets/Movies/tron.png"),
  require("../../assets/Movies/wicked2.png"),
];

const { width } = Dimensions.get("window");
const { height } = Dimensions.get("window");

function MyCarousel() {
  const carouselRef = useRef<ICarouselInstance>(null);

  return (
    <View style={styles.container}>
      <Carousel
        ref={carouselRef}
        width={width * 0.5}
        height={height * 0.25}
        data={recent_movies}
        scrollAnimationDuration={500}
        loop={true}
        autoPlay={true}
        renderItem={({ item }) => (
          <Image source={item} style={{ width: "100%", height: "100%" }} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: "1.5%",
    marginHorizontal: "2%",
    width: "100%",
  },
  CarouselStyle: {
    alignSelf: "center",
  },
  imageContainer: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
  },
});

export default MyCarousel;
