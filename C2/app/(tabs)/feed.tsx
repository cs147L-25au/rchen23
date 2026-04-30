// app/(tabs)/feed.tsx
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import MyCarousel from "../../components/Carousel";
import FeedBar from "../../components/FeedBar";
import Header from "../../components/Header";
import NavBar from "../../components/NavBar";
import SearchResults from "../../components/SearchResults";
import { useAppTheme } from "../../contexts/ThemeContext";
import { ThemeColors } from "../../constants/theme";

import { TMDBMediaResult } from "../../TMDB";

const searchBarText = "Search a movie, TV show, member, etc.";

const HomeScreen: React.FC = () => {
  const router = useRouter();
  const { colors: t, mode } = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const [searchResults, setSearchResults] = useState<TMDBMediaResult[]>([]);

  const isSearching = searchResults.length > 0;

  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.push("/(tabs)/settings")}>
        <Header />
      </Pressable>

      <Pressable onPress={() => router.push("/(tabs)/search")}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={searchBarText}
            placeholderTextColor={t.placeholder}
            editable={false}
            pointerEvents="none"
          />
        </View>
      </Pressable>

      <ScrollView
        style={styles.mainContent}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isSearching ? (
          <SearchResults results={searchResults} />
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Movies</Text>
              <Pressable onPress={() => router.push("/(tabs)/allMovies")}>
                <Text style={styles.seeAllText}>See All</Text>
              </Pressable>
            </View>

            <MyCarousel />

            <View style={styles.feedHeader}>
              <Text style={styles.feedTitle}>YOUR FEED</Text>
            </View>

            <FeedBar scrollEnabled={false} />
          </>
        )}
      </ScrollView>

      <NavBar />
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
    </View>
  );
};

export default HomeScreen;

const makeStyles = (t: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.background,
      width: "100%",
    },
    searchContainer: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: t.surface,
      width: "100%",
    },
    searchInput: {
      backgroundColor: t.inputBackground,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: t.textPrimary,
      borderWidth: 1,
      borderColor: t.inputBorder,
      width: "100%",
    },
    mainContent: {
      flex: 1,
      width: "100%",
    },
    scrollContent: {
      paddingBottom: 120,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 8,
      backgroundColor: t.background,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: t.textPrimary,
    },
    seeAllText: {
      fontSize: 14,
      color: t.textMuted,
    },
    feedHeader: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: t.divider,
      backgroundColor: t.background,
    },
    feedTitle: {
      fontSize: 13,
      fontWeight: "600",
      color: t.textMuted,
      letterSpacing: 0.5,
    },
  });
