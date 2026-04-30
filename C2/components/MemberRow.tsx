import React, { useMemo } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "../contexts/ThemeContext";
import { ThemeColors } from "../constants/theme";

const DEFAULT_PROFILE_IMAGE = require("../assets/anon_pfp.png");

type MemberRowProfile = {
  id: string;
  displayName: string;
  username?: string | null;
  profilePic?: string | null;
};

type MemberRowProps = {
  profile: MemberRowProfile;
  isFollowing: boolean;
  loading?: boolean;
  onPress: () => void;
  onToggleFollow: () => void;
};

const getInitials = (name: string): string => {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const MemberRow: React.FC<MemberRowProps> = ({
  profile,
  isFollowing,
  loading = false,
  onPress,
  onToggleFollow,
}) => {
  const { colors: t } = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const buttonLabel = isFollowing ? "Following" : "Follow";

  return (
    <View style={styles.row}>
      <Pressable style={styles.info} onPress={onPress}>
        <Image
          source={
            profile.profilePic && profile.profilePic.trim()
              ? { uri: profile.profilePic }
              : DEFAULT_PROFILE_IMAGE
          }
          style={styles.avatar}
        />
        <View style={styles.meta}>
          <Text style={styles.name}>{profile.displayName || "User"}</Text>
          {profile.username ? (
            <Text style={styles.handle}>{profile.username}</Text>
          ) : null}
        </View>
      </Pressable>
      <Pressable
        onPress={onToggleFollow}
        style={[
          styles.followButton,
          isFollowing && styles.followingButton,
          loading && styles.buttonDisabled,
        ]}
        disabled={loading}
      >
        <Text style={[styles.followText, isFollowing && styles.followingText]}>
          {buttonLabel}
        </Text>
      </Pressable>
    </View>
  );
};

const makeStyles = (t: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: t.divider,
      paddingHorizontal: 16,
      backgroundColor: t.surface,
    },
    info: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: t.avatarFallback,
      marginRight: 12,
    },
    meta: {
      flexShrink: 1,
    },
    name: {
      fontSize: 15,
      fontWeight: "600",
      color: t.textPrimary,
      fontFamily: "DM Sans",
    },
    handle: {
      marginTop: 2,
      fontSize: 12,
      color: t.textMuted,
      fontFamily: "DM Sans",
    },
    followButton: {
      borderRadius: 18,
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: t.followButton,
      backgroundColor: t.followButton,
    },
    followingButton: {
      backgroundColor: t.followingButton,
      borderColor: t.border,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    followText: {
      fontSize: 12,
      fontWeight: "600",
      color: "#FFFFFF",
      fontFamily: "DM Sans",
    },
    followingText: {
      color: t.followingButtonText,
    },
  });

export default MemberRow;
