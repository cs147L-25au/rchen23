// components/RatingModal/TitleTypePicker.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "../../contexts/ThemeContext";
import { ThemeColors } from "../../constants/theme";

export type TitleType = "movie" | "tv" | "documentary";

interface TitleTypePickerProps {
  selected: TitleType;
  onSelect: (type: TitleType) => void;
}

const TITLE_TYPES: { value: TitleType; label: string; icon: string }[] = [
  { value: "movie", label: "Movie", icon: "film-outline" },
  { value: "tv", label: "TV Show", icon: "tv-outline" },
  { value: "documentary", label: "Documentary", icon: "document-text-outline" },
];

const TitleTypePicker: React.FC<TitleTypePickerProps> = ({
  selected,
  onSelect,
}) => {
  const { colors: t } = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const [modalVisible, setModalVisible] = useState(false);

  const selectedType = TITLE_TYPES.find((type) => type.value === selected);

  return (
    <>
      <View style={styles.container}>
        <Text style={styles.label}>Add to my list of</Text>
        <Pressable
          style={styles.dropdown}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons
            name={selectedType?.icon as any}
            size={18}
            color={t.primary}
          />
          <Text style={styles.dropdownText}>{selectedType?.label}</Text>
          <Ionicons name="chevron-down" size={16} color={t.primary} />
        </Pressable>
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Category</Text>
            {TITLE_TYPES.map((type) => (
              <Pressable
                key={type.value}
                style={styles.modalOption}
                onPress={() => {
                  onSelect(type.value);
                  setModalVisible(false);
                }}
              >
                <Ionicons
                  name={type.icon as any}
                  size={22}
                  color={selected === type.value ? t.primary : t.textSecondary}
                />
                <Text
                  style={[
                    styles.modalOptionText,
                    selected === type.value && styles.modalOptionSelected,
                  ]}
                >
                  {type.label}
                </Text>
                {selected === type.value && (
                  <Ionicons name="checkmark" size={22} color={t.primary} />
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

export default TitleTypePicker;

const makeStyles = (t: ThemeColors) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: t.card,
      gap: 12,
    },
    label: {
      fontSize: 14,
      color: t.textSecondary,
    },
    dropdown: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: t.background,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: t.primary,
      gap: 6,
    },
    dropdownText: {
      fontSize: 14,
      color: t.primary,
      fontWeight: "500",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.4)",
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: t.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: 20,
      paddingBottom: 40,
      paddingHorizontal: 20,
    },
    modalTitle: {
      fontSize: 14,
      color: t.textMuted,
      textAlign: "center",
      marginBottom: 16,
    },
    modalOption: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 16,
      gap: 12,
    },
    modalOptionText: {
      flex: 1,
      fontSize: 18,
      color: t.textPrimary,
    },
    modalOptionSelected: {
      fontWeight: "600",
      color: t.primary,
    },
  });
