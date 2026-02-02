// app/onboarding3.tsx
// Onboarding Step 3: Profile photo and complete onboarding

import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  getProfileById,
  updateProfile,
  uploadProfilePicture,
  UserProfile,
} from "@/database/profileQueries";
import { getAuthUserId, setOnboardingComplete } from "@/utils/auth";

const ACCENT_RED = "#B3261E";

export default function OnboardingProfilePhotoScreen() {
  const params = useLocalSearchParams<{ userId?: string }>();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, []);

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
      // Request permission
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please allow access to your photo library to upload a profile picture.",
        );
        return;
      }

      // Launch image picker
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
      // Request permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please allow access to your camera to take a profile picture.",
        );
        return;
      }

      // Launch camera
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
      const userId = await getAuthUserId({ userId: params.userId });

      if (!userId) {
        Alert.alert(
          "Authentication Error",
          "You are not logged in. Please sign in again.",
        );
        setSaving(false);
        return;
      }

      // Upload profile picture if selected and it's a local URI
      if (profilePic && profilePic.startsWith("file://")) {
        console.log("📸 Uploading profile picture...");
        const uploadedUrl = await uploadProfilePicture(userId, profilePic);
        if (uploadedUrl) {
          console.log("✅ Profile picture uploaded:", uploadedUrl);
        } else {
          console.warn("⚠️ Profile picture upload failed, continuing...");
        }
      } else if (profilePic && !profilePic.startsWith("file://")) {
        // It's already a URL, just update the profile
        await updateProfile(userId, { profile_pic: profilePic });
      }

      // Mark onboarding as complete (stored in AsyncStorage)
      await setOnboardingComplete(userId);

      console.log("✅ Onboarding complete! Navigating to main app...");

      // Navigate to main app
      router.replace({
        pathname: "/(tabs)/feed",
        params: { userId: userId },
      });
    } catch (error: any) {
      console.error("❌ Error completing onboarding:", error);
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
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ACCENT_RED} />
        </View>
      </SafeAreaView>
    );
  }

  return (
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

      {/* Content */}
      <View style={styles.content}>
        {/* Profile Preview */}
        <View style={styles.profilePreview}>
          <Pressable style={styles.avatarContainer} onPress={showImageOptions}>
            {profilePic ? (
              <Image source={{ uri: profilePic }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={60} color="#999" />
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
        </View>

        <Text style={styles.description}>
          Add a profile photo so your friends can recognize you!
        </Text>

        {/* Photo Options */}
        <View style={styles.optionsContainer}>
          <Pressable style={styles.optionButton} onPress={handleTakePhoto}>
            <Ionicons name="camera-outline" size={28} color={ACCENT_RED} />
            <Text style={styles.optionText}>Take Photo</Text>
          </Pressable>

          <Pressable style={styles.optionButton} onPress={handlePickImage}>
            <Ionicons name="images-outline" size={28} color={ACCENT_RED} />
            <Text style={styles.optionText}>Choose from Library</Text>
          </Pressable>
        </View>
      </View>

      {/* Footer */}
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

      {/* Confirmation Dialog */}
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

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fff",
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
    backgroundColor: "#f0f0f0",
  },
  avatarPlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#e0e0e0",
    borderStyle: "dashed",
  },
  editIcon: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: ACCENT_RED,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: "#666",
    marginBottom: 4,
  },
  description: {
    fontSize: 16,
    color: "#666",
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
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    gap: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  optionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
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
  completeButton: {
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
  buttonDisabled: {
    opacity: 0.6,
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  confirmCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  confirmTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 12,
  },
  confirmBody: {
    fontSize: 16,
    color: "#666",
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
    backgroundColor: ACCENT_RED,
  },
  confirmButtonPrimaryText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  confirmButtonSecondary: {
    backgroundColor: "#f0f0f0",
  },
  confirmButtonSecondaryText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
});
