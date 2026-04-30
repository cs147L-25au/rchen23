import { Ionicons } from "@expo/vector-icons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import db from "@/database/db";
import { clearStoredUserId } from "@/utils/auth";
import { useAppTheme } from "../contexts/ThemeContext";
import { ThemeColors } from "../constants/theme";

const { width, height } = Dimensions.get("window");

export default function OnboardingWelcomeScreen() {
  const params = useLocalSearchParams<{ userId?: string; email?: string }>();
  const [verifyEmail] = useState(params.email ?? "");
  const { colors: t, mode } = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const handleGoBack = async () => {
    await clearStoredUserId();
    await db.auth.signOut();
    router.replace("/auth?restoreForm=true");
  };

  const handleNext = () => {
    if (params.userId) {
      router.push({
        pathname: "/onboarding2",
        params: { userId: params.userId, email: params.email },
      });
    } else {
      router.push({
        pathname: "/onboarding2",
        params: { email: params.email },
      });
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />

      <View style={styles.headerContainer}>
        <Pressable
          style={styles.backButton}
          onPress={handleGoBack}
          accessibilityRole="button"
          accessibilityLabel="Go back to sign in"
        >
          <Ionicons name="chevron-back" size={24} color={t.textPrimary} />
        </Pressable>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            Welcome to <Text style={styles.titleAccent}>MyFlix</Text>
          </Text>
        </View>

        <View style={styles.backButtonPlaceholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name="movie-open-star-outline"
            size={120}
            color={t.primary}
          />
        </View>

        <Text style={styles.heading}>Your Movie Journey Starts Here</Text>

        <View style={styles.featuresContainer}>
          <View style={styles.featureRow}>
            <MaterialCommunityIcons name="star" size={24} color={t.primary} />
            <Text style={styles.featureText}>
              Rate and track your favorite movies
            </Text>
          </View>
          <View style={styles.featureRow}>
            <MaterialCommunityIcons
              name="account-group"
              size={24}
              color={t.primary}
            />
            <Text style={styles.featureText}>
              Share recommendations with friends
            </Text>
          </View>
          <View style={styles.featureRow}>
            <MaterialCommunityIcons
              name="trophy"
              size={24}
              color={t.primary}
            />
            <Text style={styles.featureText}>Climb the leaderboards</Text>
          </View>
        </View>
      </View>

      <View style={styles.footerContainer}>
        <Text style={styles.stepIndicator}>Step 1 of 3</Text>
        <Pressable
          style={styles.nextButton}
          onPress={handleNext}
          accessibilityRole="button"
          accessibilityLabel="Next"
        >
          <Text style={styles.nextButtonText}>Get Started</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (t: ThemeColors) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: t.background,
    },
    headerContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: 12,
      paddingHorizontal: 20,
      paddingBottom: 8,
    },
    backButton: {
      padding: 8,
      width: 40,
    },
    backButtonPlaceholder: {
      width: 40,
    },
    titleContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontSize: 24,
      fontWeight: "700",
      color: t.textPrimary,
      textAlign: "center",
    },
    titleAccent: {
      color: t.primary,
    },
    content: {
      flex: 1,
      paddingHorizontal: 24,
      justifyContent: "center",
      alignItems: "center",
    },
    iconContainer: {
      marginBottom: 32,
      padding: 24,
      backgroundColor: t.primarySubtle,
      borderRadius: 100,
    },
    heading: {
      fontSize: 28,
      fontWeight: "700",
      color: t.textPrimary,
      textAlign: "center",
      marginBottom: 40,
    },
    featuresContainer: {
      width: "100%",
      gap: 20,
    },
    featureRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: t.card,
      borderRadius: 12,
    },
    featureText: {
      flex: 1,
      fontSize: 16,
      color: t.textSecondary,
      fontWeight: "500",
    },
    footerContainer: {
      paddingHorizontal: 24,
      paddingBottom: 24,
      paddingTop: 12,
      alignItems: "center",
    },
    stepIndicator: {
      fontSize: 14,
      color: t.textMuted,
      marginBottom: 16,
    },
    nextButton: {
      backgroundColor: t.primary,
      borderRadius: 999,
      paddingVertical: 16,
      paddingHorizontal: 32,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      width: "100%",
    },
    nextButtonText: {
      fontSize: 18,
      fontWeight: "700",
      color: "#fff",
    },
  });
