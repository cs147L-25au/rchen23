import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import db from "@/database/db";
import {
  getProfileById,
  updateProfile,
  uploadProfilePicture,
  UserProfile,
} from "@/database/profileQueries";
import {
  getAuthUserId,
  setOnboardingComplete,
  storeUserId,
} from "@/utils/auth";
import { useAppTheme } from "../contexts/ThemeContext";
import { ThemeColors } from "../constants/theme";

export default function OnboardingProfilePhotoScreen() {
  const params = useLocalSearchParams<{ userId?: string; email?: string }>();
  const { colors: t, mode } = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const normalizeUsername = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 24);

  const isUsernameAvailable = async (value: string, userId: string) => {
    const cleaned = normalizeUsername(value);
    if (!cleaned) return false;
    const { data, error } = await db
      .from("profiles")
      .select("id")
      .eq("username", cleaned)
      .maybeSingle();
    if (error) {
      console.warn("Username check failed:", error.message);
      return false;
    }
    return !data || data.id === userId;
  };

  const generateUsername = async () => {
    if (usernameSaving) return;
    const base =
      profile?.first_name?.toLowerCase().replace(/[^a-z0-9]/g, "") || "user";
    const adjectives = ["bright", "swift", "cool", "happy", "bold", "lucky"];
    setUsernameSaving(true);
    try {
      const userId = await getAuthUserId({ userId: params.userId });
      if (!userId) return;
      for (let i = 0; i < 8; i += 1) {
        const suffix = Math.floor(100 + Math.random() * 900);
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const candidate = normalizeUsername(`${adj}_${base}${suffix}`);
        const available = await isUsernameAvailable(candidate, userId);
        if (available) {
          setUsername(candidate);
          return;
        }
      }
      Alert.alert(
        "Username Unavailable",
        "Couldn't find an available username. Please try again.",
      );
    } finally {
      setUsernameSaving(false);
    }
  };

  const loadProfile = async () => {
    try {
      const userId = await getAuthUserId({ userId: params.userId });
      if (userId) {
        const profileData = await getProfileById(userId);
        if (profileData) {
          setProfile(profileData);
          if (profileData.profile_pic) {
            setProfilePic(profileData.profile_pic);
          }
          setUsername(profileData.username || "");
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please allow access to your photo library to upload a profile picture.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfilePic(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to select image. Please try again.");
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please allow access to your camera to take a profile picture.",
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfilePic(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo. Please try again.");
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      "Profile Photo",
      "Choose an option",
      [
        { text: "Take Photo", onPress: handleTakePhoto },
        { text: "Choose from Library", onPress: handlePickImage },
        { text: "Cancel", style: "cancel" },
      ],
      { cancelable: true },
    );
  };

  const handleComplete = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmComplete = async () => {
    setShowConfirmDialog(false);
    setSaving(true);

    try {
      const { data: sessionData } = await db.auth.getSession();
      const sessionUserId = sessionData?.session?.user?.id;
      if (!sessionUserId) {
        Alert.alert(
          "Sign in required",
          "Please sign in again to finish onboarding.",
        );
        router.replace("/auth");
        setSaving(false);
        return;
      }

      const userId =
        sessionUserId || (await getAuthUserId({ userId: params.userId }));

      if (!userId) {
        Alert.alert(
          "Authentication Error",
          "You are not logged in. Please sign in again.",
        );
        setSaving(false);
        return;
      }

      await storeUserId(userId);

      let cleanedUsername = normalizeUsername(username);
      if (!cleanedUsername) {
        await generateUsername();
        cleanedUsername = normalizeUsername(username);
      }
      if (!cleanedUsername) {
        Alert.alert("Username Required", "Please choose a username.");
        setSaving(false);
        return;
      }
      const available = await isUsernameAvailable(cleanedUsername, userId);
      if (!available) {
        Alert.alert("Username Taken", "Please choose another username.");
        setSaving(false);
        return;
      }
      await updateProfile(userId, { username: cleanedUsername });

      if (profilePic && profilePic.startsWith("file://")) {
        await uploadProfilePicture(userId, profilePic);
      } else if (profilePic && !profilePic.startsWith("file://")) {
        await updateProfile(userId, { profile_pic: profilePic });
      }

      await setOnboardingComplete(userId);

      router.replace({
        pathname: "/(tabs)/feed",
        params: { userId: userId },
      });
    } catch (error: any) {
      console.error("Error completing onboarding:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to complete onboarding. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSkipPhoto = async () => {
    setShowConfirmDialog(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar style={mode === "dark" ? "light" : "dark"} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={t.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
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
          <Text style={styles.title}>Profile Photo</Text>
        </View>

        <Pressable
          style={styles.skipButton}
          onPress={handleSkipPhoto}
          accessibilityRole="button"
          accessibilityLabel="Skip"
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        <View style={styles.profilePreview}>
          <Pressable style={styles.avatarContainer} onPress={showImageOptions}>
            {profilePic ? (
              <Image source={{ uri: profilePic }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={60} color={t.textMuted} />
              </View>
            )}
            <View style={styles.editIcon}>
              <Ionicons name="camera" size={20} color="#fff" />
            </View>
          </Pressable>

          <Text style={styles.userName}>
            {profile?.display_name ||
            (profile?.first_name && profile?.last_name)
              ? `${profile.first_name} ${profile.last_name}`
              : "New User"}
          </Text>
          {profile?.email && (
            <Text style={styles.userEmail}>{profile.email}</Text>
          )}

          <View style={styles.usernameRow}>
            <Text style={styles.usernameLabel}>Username</Text>
            <View style={styles.usernameInputRow}>
              <Text style={styles.usernamePrefix}>@</Text>
              <TextInput
                value={username}
                onChangeText={(value) => setUsername(normalizeUsername(value))}
                placeholder="yourname"
                placeholderTextColor={t.placeholder}
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.usernameInput}
              />
            </View>
            <Pressable
              style={styles.usernameButton}
              onPress={generateUsername}
              disabled={usernameSaving}
            >
              <Text style={styles.usernameButtonText}>
                {usernameSaving ? "Generating..." : "Generate username"}
              </Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.description}>
          Add a profile photo so your friends can recognize you!
        </Text>

        <View style={styles.optionsContainer}>
          <Pressable style={styles.optionButton} onPress={handleTakePhoto}>
            <Ionicons name="camera-outline" size={28} color={t.primary} />
            <Text style={styles.optionText}>Take Photo</Text>
          </Pressable>

          <Pressable style={styles.optionButton} onPress={handlePickImage}>
            <Ionicons name="images-outline" size={28} color={t.primary} />
            <Text style={styles.optionText}>Choose from Library</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.footerContainer}>
        <Text style={styles.stepIndicator}>Step 3 of 3</Text>
        <Pressable
          style={[styles.completeButton, saving && styles.buttonDisabled]}
          onPress={handleComplete}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel="Complete onboarding"
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.completeButtonText}>Complete Setup</Text>
              <Ionicons name="checkmark" size={20} color="#fff" />
            </>
          )}
        </Pressable>
      </View>

      <Modal
        visible={showConfirmDialog}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmDialog(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowConfirmDialog(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.confirmCard}>
                <Text style={styles.confirmTitle}>Complete Setup?</Text>
                <Text style={styles.confirmBody}>
                  {profilePic
                    ? "You're all set! Ready to start using MyFlix?"
                    : "You haven't added a profile photo. You can always add one later in settings."}
                </Text>
                <View style={styles.confirmActions}>
                  <Pressable
                    style={[styles.confirmButton, styles.confirmButtonPrimary]}
                    onPress={handleConfirmComplete}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.confirmButtonPrimaryText}>
                        Yes, Let's Go!
                      </Text>
                    )}
                  </Pressable>
                  <Pressable
                    style={[
                      styles.confirmButton,
                      styles.confirmButtonSecondary,
                    ]}
                    onPress={() => setShowConfirmDialog(false)}
                    disabled={saving}
                  >
                    <Text style={styles.confirmButtonSecondaryText}>
                      Go Back
                    </Text>
                  </Pressable>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (t: ThemeColors) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: t.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
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
    content: {
      flex: 1,
      paddingHorizontal: 24,
      alignItems: "center",
      paddingTop: 40,
    },
    profilePreview: {
      alignItems: "center",
      marginBottom: 32,
    },
    avatarContainer: {
      position: "relative",
      marginBottom: 16,
    },
    avatar: {
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: t.posterPlaceholder,
    },
    avatarPlaceholder: {
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: t.posterPlaceholder,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 3,
      borderColor: t.border,
      borderStyle: "dashed",
    },
    editIcon: {
      position: "absolute",
      bottom: 4,
      right: 4,
      backgroundColor: t.primary,
      borderRadius: 20,
      width: 40,
      height: 40,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 3,
      borderColor: t.background,
    },
    userName: {
      fontSize: 24,
      fontWeight: "700",
      color: t.textPrimary,
      marginBottom: 4,
    },
    userEmail: {
      fontSize: 16,
      color: t.textMuted,
      marginBottom: 4,
    },
    usernameRow: {
      marginTop: 12,
      width: "100%",
      alignItems: "center",
    },
    usernameLabel: {
      fontSize: 14,
      color: t.textMuted,
      marginBottom: 6,
    },
    usernameInputRow: {
      flexDirection: "row",
      alignItems: "center",
      width: "100%",
      borderWidth: 1,
      borderColor: t.inputBorder,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: t.inputBackground,
    },
    usernamePrefix: {
      fontSize: 16,
      color: t.textMuted,
      marginRight: 4,
    },
    usernameInput: {
      flex: 1,
      fontSize: 16,
      color: t.textPrimary,
    },
    usernameButton: {
      marginTop: 10,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 999,
      backgroundColor: t.card,
    },
    usernameButtonText: {
      fontSize: 13,
      fontWeight: "600",
      color: t.textSecondary,
    },
    description: {
      fontSize: 16,
      color: t.textMuted,
      textAlign: "center",
      marginBottom: 32,
      lineHeight: 24,
    },
    optionsContainer: {
      width: "100%",
      gap: 12,
    },
    optionButton: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      backgroundColor: t.card,
      borderRadius: 12,
      gap: 16,
      borderWidth: 1,
      borderColor: t.border,
    },
    optionText: {
      fontSize: 16,
      fontWeight: "600",
      color: t.textSecondary,
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
    completeButton: {
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
    buttonDisabled: {
      opacity: 0.6,
    },
    completeButtonText: {
      fontSize: 18,
      fontWeight: "700",
      color: "#fff",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: t.overlay,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    confirmCard: {
      backgroundColor: t.modalBackground,
      borderRadius: 24,
      padding: 24,
      width: "100%",
      maxWidth: 400,
    },
    confirmTitle: {
      fontSize: 24,
      fontWeight: "700",
      color: t.textPrimary,
      marginBottom: 12,
    },
    confirmBody: {
      fontSize: 16,
      color: t.textMuted,
      lineHeight: 24,
      marginBottom: 24,
    },
    confirmActions: {
      gap: 12,
    },
    confirmButton: {
      borderRadius: 999,
      paddingVertical: 14,
      paddingHorizontal: 24,
      alignItems: "center",
    },
    confirmButtonPrimary: {
      backgroundColor: t.primary,
    },
    confirmButtonPrimaryText: {
      fontSize: 16,
      fontWeight: "700",
      color: "#fff",
    },
    confirmButtonSecondary: {
      backgroundColor: t.card,
    },
    confirmButtonSecondaryText: {
      fontSize: 16,
      fontWeight: "600",
      color: t.textSecondary,
    },
  });
