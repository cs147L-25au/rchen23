// components/RatingModal/TitleTypePicker.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

export type TitleType = "movie" | "tv" | "documentary" | "animated";

interface TitleTypePickerProps {
  selected: TitleType;
  onSelect: (type: TitleType) => void;
}

const TITLE_TYPES: { value: TitleType; label: string; icon: string }[] = [
  { value: "movie", label: "Movie", icon: "film-outline" },
  { value: "tv", label: "TV Show", icon: "tv-outline" },
  { value: "documentary", label: "Documentary", icon: "document-text-outline" },
  { value: "animated", label: "Animated", icon: "sparkles-outline" },
];

const TitleTypePicker: React.FC<TitleTypePickerProps> = ({
  selected,
  onSelect,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedType = TITLE_TYPES.find((t) => t.value === selected);

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
            color="#1a535c"
          />
          <Text style={styles.dropdownText}>{selectedType?.label}</Text>
          <Ionicons name="chevron-down" size={16} color="#1a535c" />
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
                  color={selected === type.value ? "#1a535c" : "#666"}
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
                  <Ionicons name="checkmark" size={22} color="#1a535c" />
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

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#f5f5f5",
    gap: 12,
  },
  label: {
    fontSize: 14,
    color: "#333",
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#1a535c",
    gap: 6,
  },
  dropdownText: {
    fontSize: 14,
    color: "#1a535c",
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  modalTitle: {
    fontSize: 14,
    color: "#888",
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
    color: "#000",
  },
  modalOptionSelected: {
    fontWeight: "600",
    color: "#1a535c",
  },
});
