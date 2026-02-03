import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

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
  const initials = getInitials(
    profile.displayName || profile.username || "User",
  );
  const buttonLabel = isFollowing ? "Following" : "Follow";

  return (
    <View style={styles.row}>
      <Pressable style={styles.info} onPress={onPress}>
        {profile.profilePic ? (
          <Image source={{ uri: profile.profilePic }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        )}
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

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#efefef",
    paddingHorizontal: 16,
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
    backgroundColor: "#e6e6e6",
    marginRight: 12,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#e6e6e6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
    fontFamily: "DM Sans",
  },
  meta: {
    flexShrink: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
    fontFamily: "DM Sans",
  },
  handle: {
    marginTop: 2,
    fontSize: 12,
    color: "#6e6e6e",
    fontFamily: "DM Sans",
  },
  followButton: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#0f4c5c",
    backgroundColor: "#0f4c5c",
  },
  followingButton: {
    backgroundColor: "#f2f2f2",
    borderColor: "#d6d6d6",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  followText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
    fontFamily: "DM Sans",
  },
  followingText: {
    color: "#555",
  },
});

export default MemberRow;
