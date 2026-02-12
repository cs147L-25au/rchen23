// app/onboarding2.tsx
// Onboarding Step 2: Birthday input

import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
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

const ACCENT_RED = "#B3261E";

export default function OnboardingBirthdayScreen() {
  const params = useLocalSearchParams<{ userId?: string; email?: string }>();

  // Calculate max date (must be at least 13 years old)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 13);

  // Calculate min date (reasonable limit)
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 120);

  // Initialize birthday to maxDate so the picker and button work immediately
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

    // Get user ID
    const userId = params.userId || (await getAuthUserId());

    if (userId) {
      // Format birthday as ISO date string (YYYY-MM-DD)
      const birthdayStr = birthday.toISOString().split("T")[0];

      // Save birthday to database
      try {
        console.log("🧾 Saving birthday:", { userId, birthday: birthdayStr });
        await updateProfile(userId, { birthday: birthdayStr });
        console.log("✅ Birthday saved:", { userId, birthday: birthdayStr });
      } catch (error) {
        console.warn("⚠️ Failed to save birthday, continuing anyway:", error);
      }
    }

    // Navigate to next step
    router.push({
      pathname: "/onboarding3",
      params: { userId: userId || "", email: params.email },
    });
  };

  const handleSkip = () => {
    // Allow skipping birthday
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
        <StatusBar style="dark" />

        {/* Header */}
        <View style={styles.headerContainer}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={24} color="#000" />
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
            {/* Content */}
            <View style={styles.content}>
              <View style={styles.iconContainer}>
                <Ionicons name="calendar" size={80} color={ACCENT_RED} />
              </View>

              <Text style={styles.subtitle}>When were you born?</Text>
              <Text style={styles.description}>
                This helps us personalize your experience and ensure you're old
                enough to use the app.
              </Text>

              {/* Date Input */}
              <Pressable
                style={styles.dateInput}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={24} color="#666" />
                <Text
                  style={[
                    styles.dateText,
                    !birthday && styles.dateTextPlaceholder,
                  ]}
                >
                  {birthday ? formatDate(birthday) : "MM/DD/YYYY"}
                </Text>
              </Pressable>

              {/* Date Picker */}
              {(showDatePicker || Platform.OS === "ios") && (
                <View style={styles.datePickerContainer}>
                  <DateTimePicker
                    value={birthday || maxDate}
                    mode="date"
                    display="inline"
                    onChange={handleDateChange}
                    maximumDate={maxDate}
                    minimumDate={minDate}
                    accentColor={ACCENT_RED}
                    themeVariant="light"
                  />
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Footer */}
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

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fff",
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
    color: ACCENT_RED,
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
    color: "#000",
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
    backgroundColor: "#FFF5F5",
    borderRadius: 100,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 25,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 16,
    width: "100%",
    gap: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  dateText: {
    fontSize: 18,
    color: "#000",
    fontWeight: "500",
  },
  dateTextPlaceholder: {
    color: "#999",
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
    color: "#666",
    marginBottom: 16,
  },
  nextButton: {
    backgroundColor: ACCENT_RED,
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
