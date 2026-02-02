import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  getProfileById,
  updateProfile,
  uploadProfilePicture,
  UserProfile,
} from "../../database/profileQueries";
import { getCurrentUserId } from "../../lib/ratingsDb";

const DEFAULT_PROFILE_PIC =
  "https://eagksfoqgydjaqoijjtj.supabase.co/storage/v1/object/public/RC_profile/profile_pic.png";

type EditField = "name" | "username" | "birthday";

export default function EditProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editField, setEditField] = useState<EditField | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [birthday, setBirthday] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const userId = await getCurrentUserId();
      if (!userId) {
        setProfile(null);
        return;
      }
      const data = await getProfileById(userId);
      setProfile(data);
      setFirstName(data?.first_name || "");
      setLastName(data?.last_name || "");
      setUsername(data?.username || "");
      setBirthday(data?.birthday || "");
      setProfilePhoto(data?.profile_pic || null);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, []),
  );

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please allow access to your photo library to update your profile photo.",
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
      await updatePhoto(result.assets[0].uri);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please allow access to your camera to update your profile photo.",
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await updatePhoto(result.assets[0].uri);
    }
  };

  const updatePhoto = async (uri: string | null) => {
    if (!profile?.id) return;
    setSaving(true);
    try {
      let photoUrl = uri;
      if (uri?.startsWith("file://")) {
        const uploaded = await uploadProfilePicture(profile.id, uri);
        if (uploaded) photoUrl = uploaded;
      }
      const updated = await updateProfile(profile.id, {
        profile_pic: photoUrl || null,
      });
      if (updated) {
        setProfile(updated);
        setProfilePhoto(updated.profile_pic || null);
      }
    } catch (error) {
      console.error("Failed to update profile photo:", error);
      Alert.alert("Error", "Failed to update profile photo.");
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoOptions = () => {
    Alert.alert(
      "Edit Profile Photo",
      "Make it easier for your friends to find you by adding a profile photo",
      [
        { text: "Choose from library", onPress: handlePickPhoto },
        { text: "Take photo", onPress: handleTakePhoto },
        {
          text: "Delete photo",
          style: "destructive",
          onPress: () => updatePhoto(null),
        },
        { text: "Cancel", style: "cancel" },
      ],
      { cancelable: true },
    );
  };

  const openEdit = (field: EditField) => setEditField(field);
  const closeEdit = () => setEditField(null);

  const saveEdit = async () => {
    if (!profile?.id) return;
    setSaving(true);
    try {
      const updates =
        editField === "name"
          ? {
              first_name: firstName.trim() || null,
              last_name: lastName.trim() || null,
              // Use first name as display name for feeds
              display_name: firstName.trim() || null,
            }
          : editField === "username"
            ? { username: username.trim() || null }
            : { birthday: birthday.trim() || null };

      const updated = await updateProfile(profile.id, updates);
      if (updated) {
        setProfile(updated);
        setFirstName(updated.first_name || "");
        setLastName(updated.last_name || "");
        setUsername(updated.username || "");
        setBirthday(updated.birthday || "");
      }
      closeEdit();
    } catch (error) {
      console.error("Failed to update profile:", error);
      Alert.alert("Error", "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0B5563" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </Pressable>
        <Text style={styles.headerTitle}>Edit profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatarSection}>
          <Image
            source={{ uri: profilePhoto || DEFAULT_PROFILE_PIC }}
            style={styles.avatar}
          />
          <TouchableOpacity onPress={handlePhotoOptions}>
            <Text style={styles.editPhotoText}>Edit profile photo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.list}>
          <Row
            label="Name"
            value={
              [firstName, lastName].filter(Boolean).join(" ") || "Add name"
            }
            onPress={() => openEdit("name")}
          />
          <Row
            label="Username"
            value={username ? `@${username}` : "Add username"}
            onPress={() => openEdit("username")}
          />
          <Row
            label="Birthday"
            value={birthday || "Add birthday"}
            onPress={() => openEdit("birthday")}
          />
          <Row label="Email" value={profile?.email || "—"} disabled />
          <Row label="Account settings" value="" disabled />
        </View>
      </ScrollView>

      <Modal visible={!!editField} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={closeEdit}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <KeyboardAvoidingView
                style={styles.modalCard}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
              >
                <View style={styles.modalHeader}>
                  <Pressable onPress={closeEdit}>
                    <Text style={styles.modalCancel}>Cancel</Text>
                  </Pressable>
                  <Text style={styles.modalTitle}>
                    {editField === "name"
                      ? "Change name"
                      : editField === "username"
                        ? "Change username"
                        : "Change birthday"}
                  </Text>
                  <Pressable onPress={saveEdit} disabled={saving}>
                    <Text style={styles.modalSave}>Save</Text>
                  </Pressable>
                </View>

                {editField === "name" && (
                  <View style={styles.modalBody}>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="First name"
                      value={firstName}
                      onChangeText={setFirstName}
                    />
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Last name"
                      value={lastName}
                      onChangeText={setLastName}
                    />
                  </View>
                )}

                {editField === "username" && (
                  <View style={styles.modalBody}>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="@username"
                      value={username}
                      autoCapitalize="none"
                      onChangeText={(text) =>
                        setUsername(text.replace(/^@/, ""))
                      }
                    />
                    <Text style={styles.modalHelper}>
                      Changing your username will also change your shareable
                      list link
                    </Text>
                  </View>
                )}

                {editField === "birthday" && (
                  <View style={styles.modalBody}>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="YYYY-MM-DD"
                      value={birthday}
                      onChangeText={setBirthday}
                    />
                  </View>
                )}
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

function Row({
  label,
  value,
  onPress,
  disabled,
}: {
  label: string;
  value: string;
  onPress?: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable style={styles.row} onPress={disabled ? undefined : onPress}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowRight}>
        <Text style={styles.rowValue}>{value}</Text>
        {!disabled && (
          <Ionicons name="chevron-forward" size={18} color="#9AA0A6" />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: "600" },
  headerSpacer: { width: 24 },
  content: { paddingBottom: 40 },
  avatarSection: { alignItems: "center", paddingVertical: 16 },
  avatar: { width: 88, height: 88, borderRadius: 44 },
  editPhotoText: {
    marginTop: 10,
    fontSize: 14,
    color: "#0B5563",
    fontWeight: "600",
  },
  list: { marginTop: 8 },
  row: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EFEFEF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowLabel: { fontSize: 15, color: "#111" },
  rowRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  rowValue: { fontSize: 15, color: "#8B8B8B" },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: "#fff",
    width: "100%",
    maxWidth: 420,
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 8,
    borderRadius: 16,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  modalCancel: { color: "#0B5563", fontSize: 14 },
  modalSave: { color: "#0B5563", fontSize: 14, fontWeight: "600" },
  modalTitle: { fontSize: 16, fontWeight: "600" },
  modalBody: { paddingTop: 12 },
  modalInput: {
    borderWidth: 1,
    borderColor: "#E7E7E7",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    marginBottom: 10,
  },
  modalHelper: {
    color: "#8B8B8B",
    fontSize: 12,
    marginTop: 4,
  },
});
