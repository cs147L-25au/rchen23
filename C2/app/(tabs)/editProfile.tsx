import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
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
import { useAppTheme } from "../../contexts/ThemeContext";
import { ThemeColors } from "../../constants/theme";

const DEFAULT_PROFILE_URL =
  "https://eagksfoqgydjaqoijjtj.supabase.co/storage/v1/object/public/RC_profile/profile_pic.png";
const DEFAULT_PROFILE_IMAGE = require("../../assets/anon_pfp.png");

type EditField = "name" | "username" | "birthday";

export default function EditProfileScreen() {
  const router = useRouter();
  const { colors: t } = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

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
      const cleaned =
        data?.profile_pic === DEFAULT_PROFILE_URL
          ? { ...data, profile_pic: null }
          : data;
      setProfile(cleaned);
      setFirstName(data?.first_name || "");
      setLastName(data?.last_name || "");
      setUsername(data?.username || "");
      setBirthday(data?.birthday || "");
      setProfilePhoto(cleaned?.profile_pic || null);
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
      Alert.alert("Permission Required", "Please allow access to your photo library.");
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
      Alert.alert("Permission Required", "Please allow access to your camera.");
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
      const updated = await updateProfile(profile.id, { profile_pic: photoUrl || null });
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
        { text: "Delete photo", style: "destructive", onPress: () => updatePhoto(null) },
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
          <ActivityIndicator size="large" color={t.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={t.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Edit profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatarSection}>
          <Image
            source={profilePhoto ? { uri: profilePhoto } : DEFAULT_PROFILE_IMAGE}
            style={styles.avatar}
          />
          <TouchableOpacity onPress={handlePhotoOptions}>
            <Text style={styles.editPhotoText}>Edit profile photo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.list}>
          <RowItem
            label="Name"
            value={[firstName, lastName].filter(Boolean).join(" ") || "Add name"}
            onPress={() => openEdit("name")}
            t={t}
          />
          <RowItem
            label="Username"
            value={username ? `@${username}` : "Add username"}
            onPress={() => openEdit("username")}
            t={t}
          />
          <RowItem
            label="Birthday"
            value={birthday || "Add birthday"}
            onPress={() => openEdit("birthday")}
            t={t}
          />
          <RowItem label="Email" value={profile?.email || "—"} disabled t={t} />
          <RowItem label="Account settings" value="" disabled t={t} />
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
                      placeholderTextColor={t.placeholder}
                      value={firstName}
                      onChangeText={setFirstName}
                    />
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Last name"
                      placeholderTextColor={t.placeholder}
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
                      placeholderTextColor={t.placeholder}
                      value={username}
                      autoCapitalize="none"
                      onChangeText={(text) => setUsername(text.replace(/^@/, ""))}
                    />
                    <Text style={styles.modalHelper}>
                      Changing your username will also change your shareable list link
                    </Text>
                  </View>
                )}

                {editField === "birthday" && (
                  <View style={styles.modalBody}>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={t.placeholder}
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

function RowItem({
  label,
  value,
  onPress,
  disabled,
  t,
}: {
  label: string;
  value: string;
  onPress?: () => void;
  disabled?: boolean;
  t: ThemeColors;
}) {
  return (
    <Pressable
      style={{
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: t.divider,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
      onPress={disabled ? undefined : onPress}
    >
      <Text style={{ fontSize: 15, color: t.textPrimary }}>{label}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Text style={{ fontSize: 15, color: t.textMuted }}>{value}</Text>
        {!disabled && (
          <Ionicons name="chevron-forward" size={18} color={t.textMuted} />
        )}
      </View>
    </Pressable>
  );
}

const makeStyles = (t: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.background },
    loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: t.surface,
      borderBottomWidth: 1,
      borderBottomColor: t.border,
    },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 16, fontWeight: "600", color: t.textPrimary },
    headerSpacer: { width: 24 },
    content: { paddingBottom: 40 },
    avatarSection: { alignItems: "center", paddingVertical: 16 },
    avatar: { width: 88, height: 88, borderRadius: 44 },
    editPhotoText: { marginTop: 10, fontSize: 14, color: t.primary, fontWeight: "600" },
    list: { marginTop: 8 },
    modalOverlay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: t.overlay,
      paddingHorizontal: 20,
    },
    modalCard: {
      backgroundColor: t.modalBackground,
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
    modalCancel: { color: t.primary, fontSize: 14 },
    modalSave: { color: t.primary, fontSize: 14, fontWeight: "600" },
    modalTitle: { fontSize: 16, fontWeight: "600", color: t.textPrimary },
    modalBody: { paddingTop: 12 },
    modalInput: {
      borderWidth: 1,
      borderColor: t.inputBorder,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
      fontSize: 14,
      marginBottom: 10,
      color: t.textPrimary,
      backgroundColor: t.inputBackground,
    },
    modalHelper: { color: t.textMuted, fontSize: 12, marginTop: 4 },
  });
