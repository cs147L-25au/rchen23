import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { updateProfile } from "@/database/profileQueries";
import { getAuthUserId } from "@/utils/auth";
import { useAppTheme } from "../contexts/ThemeContext";
import { ThemeColors } from "../constants/theme";

export default function OnboardingBirthdayScreen() {
  const params = useLocalSearchParams<{ userId?: string; email?: string }>();
  const { colors: t, mode } = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 13);

  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 120);

  const [birthday, setBirthday] = useState<Date | null>(maxDate);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const formatDate = (date: Date): string => {
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setBirthday(selectedDate);
    }
  };

  const handleNext = async () => {
    if (!birthday) {
      Alert.alert(
        "Birthday Required",
        "Please enter your birthday to continue.",
      );
      return;
    }

    const userId = params.userId || (await getAuthUserId());

    if (userId) {
      const birthdayStr = birthday.toISOString().split("T")[0];

      try {
        await updateProfile(userId, { birthday: birthdayStr });
      } catch (error) {
        console.warn("Failed to save birthday, continuing anyway:", error);
      }
    }

    router.push({
      pathname: "/onboarding3",
      params: { userId: userId || "", email: params.email },
    });
  };

  const handleSkip = () => {
    if (params.userId) {
      router.push({
        pathname: "/onboarding3",
        params: { userId: params.userId, email: params.email },
      });
    } else {
      router.push({
        pathname: "/onboarding3",
        params: { email: params.email },
      });
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.safe}>
        <StatusBar style={mode === "dark" ? "light" : "dark"} />

        <View style={styles.headerContainer}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={24} color={t.textPrimary} />
          </Pressable>

          <View style={styles.titleContainer}>
            <Text style={styles.title}>Your Birthday</Text>
          </View>

          <Pressable
            style={styles.skipButton}
            onPress={handleSkip}
            accessibilityRole="button"
            accessibilityLabel="Skip"
          >
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>

        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.content}>
              <View style={styles.iconContainer}>
                <Ionicons name="calendar" size={80} color={t.primary} />
              </View>

              <Text style={styles.subtitle}>When were you born?</Text>
              <Text style={styles.description}>
                This helps us personalize your experience and ensure you're old
                enough to use the app.
              </Text>

              <Pressable
                style={styles.dateInput}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={24} color={t.textMuted} />
                <Text
                  style={[
                    styles.dateText,
                    !birthday && styles.dateTextPlaceholder,
                  ]}
                >
                  {birthday ? formatDate(birthday) : "MM/DD/YYYY"}
                </Text>
              </Pressable>

              {(showDatePicker || Platform.OS === "ios") && (
                <View style={styles.datePickerContainer}>
                  <DateTimePicker
                    value={birthday || maxDate}
                    mode="date"
                    display="inline"
                    onChange={handleDateChange}
                    maximumDate={maxDate}
                    minimumDate={minDate}
                    accentColor={t.primary}
                    themeVariant={mode === "dark" ? "dark" : "light"}
                  />
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <View style={styles.footerContainer}>
          <Text style={styles.stepIndicator}>Step 2 of 3</Text>
          <Pressable
            style={[styles.nextButton, !birthday && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={!birthday}
            accessibilityRole="button"
            accessibilityLabel="Continue"
          >
            <Text style={styles.nextButtonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </Pressable>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
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
      width: 60,
    },
    skipButton: {
      padding: 8,
      width: 60,
      alignItems: "flex-end",
    },
    skipText: {
      fontSize: 16,
      color: t.primary,
      fontWeight: "600",
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
    keyboardView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
    },
    content: {
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: 15,
      alignItems: "center",
    },
    iconContainer: {
      marginBottom: 20,
      padding: 20,
      backgroundColor: t.primarySubtle,
      borderRadius: 100,
    },
    subtitle: {
      fontSize: 24,
      fontWeight: "700",
      color: t.textPrimary,
      textAlign: "center",
      marginBottom: 12,
    },
    description: {
      fontSize: 16,
      color: t.textMuted,
      textAlign: "center",
      marginBottom: 25,
      lineHeight: 24,
      paddingHorizontal: 20,
    },
    dateInput: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: t.inputBackground,
      borderRadius: 12,
      padding: 16,
      width: "100%",
      gap: 12,
      borderWidth: 1,
      borderColor: t.inputBorder,
    },
    dateText: {
      fontSize: 18,
      color: t.textPrimary,
      fontWeight: "500",
    },
    dateTextPlaceholder: {
      color: t.placeholder,
    },
    datePickerContainer: {
      marginTop: 5,
      width: "100%",
      alignItems: "center",
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
    nextButtonDisabled: {
      opacity: 0.5,
    },
    nextButtonText: {
      fontSize: 18,
      fontWeight: "700",
      color: "#fff",
    },
  });
