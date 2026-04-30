import React, { useMemo } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { TMDBMediaResult, getPosterUrl } from "../TMDB";

import { useAppTheme } from "../contexts/ThemeContext";
import { ThemeColors } from "../constants/theme";

type PersonRowProps = {
  item: TMDBMediaResult;
  onPress: () => void;
};

const getPersonRole = (item: TMDBMediaResult): string => {
  const department = item.known_for_department?.toLowerCase();
  const gender = item.gender;

  if (department === "directing") return "Director";
  if (department === "acting") return gender === 1 ? "Actress" : "Actor";
  if (department === "writing") return "Writer";
  if (department === "production") return "Producer";
  return "Person";
};

const PersonRow: React.FC<PersonRowProps> = ({ item, onPress }) => {
  const { colors: t } = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const displayName = item.name ?? item.title ?? "(no name)";
  const profileUri = getPosterUrl(undefined, item.profile_path);

  return (
    <Pressable style={styles.row} onPress={onPress}>
      {profileUri ? (
        <Image source={{ uri: profileUri }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarFallback}>
          <Text style={styles.avatarText}>No Img</Text>
        </View>
      )}
      <View style={styles.metaCol}>
        <Text style={styles.nameText}>{displayName}</Text>
        <Text style={styles.roleText}>{getPersonRole(item)}</Text>
      </View>
    </Pressable>
  );
};

const makeStyles = (t: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: t.divider,
      gap: 12,
      backgroundColor: t.surface,
    },
    avatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: t.avatarFallback,
    },
    avatarFallback: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: t.avatarFallback,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: {
      fontSize: 10,
      color: t.textMuted,
      fontFamily: "DM Sans",
    },
    metaCol: {
      justifyContent: "center",
    },
    nameText: {
      fontSize: 15,
      color: t.textPrimary,
      fontWeight: "600",
      fontFamily: "DM Sans",
    },
    roleText: {
      fontSize: 12,
      color: t.textMuted,
      marginTop: 4,
      fontFamily: "DM Sans",
    },
  });

export default PersonRow;
