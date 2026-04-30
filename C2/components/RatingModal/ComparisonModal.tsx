// components/RatingModal/ComparisonModal.tsx
import React, { useMemo } from "react";
import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "../../contexts/ThemeContext";
import { ThemeColors } from "../../constants/theme";

interface ComparisonItem {
  title: string;
  poster_path?: string | null;
}

interface ComparisonModalProps {
  visible: boolean;
  newItem: ComparisonItem;
  compareItem: ComparisonItem;
  onSelectNew: () => void;
  onSelectExisting: () => void;
  onCancel: () => void;
  comparisonNumber?: number;
  totalEstimate?: number;
}

const ComparisonModal: React.FC<ComparisonModalProps> = ({
  visible,
  newItem,
  compareItem,
  onSelectNew,
  onSelectExisting,
  onCancel,
  comparisonNumber,
  totalEstimate,
}) => {
  const { colors: t } = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const getPosterUri = (path?: string | null) => {
    if (!path) return null;
    return `https://image.tmdb.org/t/p/w185${path}`;
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Which do you prefer?</Text>
          {comparisonNumber && totalEstimate && (
            <Text style={styles.progress}>
              Comparison {comparisonNumber} of ~{totalEstimate}
            </Text>
          )}

          <View style={styles.optionsRow}>
            {/* Option A - New Item */}
            <Pressable style={styles.optionCard} onPress={onSelectNew}>
              {getPosterUri(newItem.poster_path) ? (
                <Image
                  source={{ uri: getPosterUri(newItem.poster_path)! }}
                  style={styles.poster}
                />
              ) : (
                <View style={styles.noPoster}>
                  <Text style={styles.noPosterText}>No Image</Text>
                </View>
              )}
              <Text style={styles.optionTitle} numberOfLines={2}>
                {newItem.title}
              </Text>
            </Pressable>

            {/* OR Badge */}
            <View style={styles.orBadge}>
              <Text style={styles.orText}>OR</Text>
            </View>

            {/* Option B - Existing Item */}
            <Pressable style={styles.optionCard} onPress={onSelectExisting}>
              {getPosterUri(compareItem.poster_path) ? (
                <Image
                  source={{ uri: getPosterUri(compareItem.poster_path)! }}
                  style={styles.poster}
                />
              ) : (
                <View style={styles.noPoster}>
                  <Text style={styles.noPosterText}>No Image</Text>
                </View>
              )}
              <Text style={styles.optionTitle} numberOfLines={2}>
                {compareItem.title}
              </Text>
            </Pressable>
          </View>

          {/* Action buttons */}
          <View style={styles.actionsRow}>
            <Pressable style={styles.actionButton} onPress={onCancel}>
              <Text style={styles.actionText}>← Undo</Text>
            </Pressable>
            <Pressable style={styles.skipButton} onPress={onCancel}>
              <Text style={styles.skipText}>Skip →</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ComparisonModal;

const makeStyles = (t: ThemeColors) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.7)",
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    card: {
      width: "100%",
      backgroundColor: t.card,
      borderRadius: 20,
      padding: 20,
      alignItems: "center",
    },
    title: {
      fontSize: 20,
      fontWeight: "700",
      color: t.textPrimary,
      textAlign: "center",
      marginBottom: 4,
    },
    progress: {
      fontSize: 13,
      color: t.textMuted,
      marginBottom: 20,
    },
    optionsRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
    },
    optionCard: {
      flex: 1,
      alignItems: "center",
      backgroundColor: t.surface,
      borderRadius: 16,
      padding: 12,
      borderWidth: 2,
      borderColor: t.border,
    },
    poster: {
      width: 100,
      height: 150,
      borderRadius: 8,
      backgroundColor: t.posterPlaceholder,
    },
    noPoster: {
      width: 100,
      height: 150,
      borderRadius: 8,
      backgroundColor: t.posterPlaceholder,
      justifyContent: "center",
      alignItems: "center",
    },
    noPosterText: {
      fontSize: 12,
      color: t.textMuted,
    },
    optionTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: t.textPrimary,
      textAlign: "center",
      marginTop: 10,
      height: 36,
    },
    orBadge: {
      position: "absolute",
      zIndex: 10,
      backgroundColor: t.primary,
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
    },
    orText: {
      fontSize: 14,
      fontWeight: "700",
      color: "#fff",
    },
    actionsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      width: "100%",
      marginTop: 20,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: t.divider,
    },
    actionButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
    },
    actionText: {
      fontSize: 15,
      color: t.textSecondary,
    },
    skipButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 20,
    },
    skipText: {
      fontSize: 15,
      color: t.textPrimary,
    },
  });
