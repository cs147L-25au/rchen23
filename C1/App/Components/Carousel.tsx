import { StyleSheet, View, Dimensions, Image } from "react-native";
import React, { useRef } from "react";
import Carousel, { ICarouselInstance } from "react-native-reanimated-carousel";

let recent_movies = [
  require("../../assets/Movies/f1_movie.png"),
  require("../../assets/Movies/him_poster.png"),
  require("../../assets/Movies/superman.png"),
  require("../../assets/Movies/f4_poster.png"),
  require("../../assets/Movies/row_tw.png"),
  require("../../assets/Movies/shadows_edge.png"),
  require("../../assets/Movies/tron.png"),
  require("../../assets/Movies/wicked2.png"),
];

const { height, width } = Dimensions.get("window");

function MyCarousel() {
  const carouselRef = useRef<ICarouselInstance>(null);

  return (
    <View style={styles.container}>
      <Carousel
        ref={carouselRef}
        width={width * 0.45}
        height={height * 0.3}
        style={styles.carousel}
        data={recent_movies}
        scrollAnimationDuration={1000}
        loop={true}
        autoPlay={true}
        pagingEnabled={true}
        snapEnabled={true}
        mode="parallax"
        modeConfig={{
          parallaxScrollingScale: 0.9,
          parallaxScrollingOffset: 50,
        }}
        renderItem={({ item }) => (
          <View style={styles.imageContainer}>
            <Image source={item} style={styles.image} resizeMode="contain" />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: "5%",
    width: "100%",
    alignSelf: "center",
  },
  carousel: {
    width: width * 0.9,
    alignSelf: "center",
    justifyContent: "center",
  },
  imageContainer: {
    marginTop: "4%",
    borderRadius: 32,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    width: "100%",
    height: "100%",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
  },
});

export default MyCarousel;
