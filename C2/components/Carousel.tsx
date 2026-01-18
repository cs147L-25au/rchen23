import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import Carousel, { ICarouselInstance } from "react-native-reanimated-carousel";
import { fetchTrendingMovies, getPosterUrl, TrendingMovie } from "../TMDB";

const { height, width } = Dimensions.get("window");

function MyCarousel() {
  const carouselRef = useRef<ICarouselInstance>(null);
  const router = useRouter();
  const [trendingMovies, setTrendingMovies] = useState<TrendingMovie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTrending = async () => {
      try {
        setLoading(true);
        const movies = await fetchTrendingMovies("week");
        setTrendingMovies(movies);
      } catch (err) {
        console.error("Failed to load trending movies:", err);
      } finally {
        setLoading(false);
      }
    };

    loadTrending();
  }, []);

  const handlePress = (movie: TrendingMovie) => {
    router.push({
      pathname: "/(tabs)/mediaDetails",
      params: {
        id: String(movie.id),
        title: movie.title,
        mediaType: movie.media_type,
        overview: movie.overview,
        posterPath: movie.poster_path ?? "",
        voteAverage: String(movie.vote_average),
        voteCount: String(movie.vote_count),
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#B3261E" />
      </View>
    );
  }

  if (trendingMovies.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Carousel
        ref={carouselRef}
        width={width * 0.45}
        height={height * 0.3}
        style={styles.carousel}
        data={trendingMovies}
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
        renderItem={({ item }) => {
          const posterUri = getPosterUrl(item.poster_path, null);
          return (
            <Pressable onPress={() => handlePress(item)}>
              <View style={styles.imageContainer}>
                {posterUri ? (
                  <Image
                    source={{ uri: posterUri }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.noImage} />
                )}
              </View>
            </Pressable>
          );
        }}
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
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: height * 0.3,
    width: "100%",
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
  noImage: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
    backgroundColor: "#e0e0e0",
  },
});

export default MyCarousel;
