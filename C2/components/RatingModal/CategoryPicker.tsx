// components/RatingModal/CategoryPicker.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export type RatingCategory = "good" | "alright" | "bad";

interface CategoryPickerProps {
  selected: RatingCategory | null;
  onSelect: (category: RatingCategory) => void;
}

const CategoryPicker: React.FC<CategoryPickerProps> = ({
  selected,
  onSelect,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>How was it?</Text>
      <View style={styles.buttonRow}>
        {/* Good / Liked */}
        <Pressable style={styles.button} onPress={() => onSelect("good")}>
          <View
            style={[
              styles.circle,
              styles.circleGood,
              selected === "good" && styles.circleGoodActive,
            ]}
          >
            {selected === "good" && (
              <Ionicons name="checkmark" size={28} color="#2E7D32" />
            )}
          </View>
          <Text style={styles.label}>I liked it!</Text>
        </Pressable>

        {/* Alright / Fine */}
        <Pressable style={styles.button} onPress={() => onSelect("alright")}>
          <View
            style={[
              styles.circle,
              styles.circleAlright,
              selected === "alright" && styles.circleAlrightActive,
            ]}
          >
            {selected === "alright" && (
              <Ionicons name="checkmark" size={28} color="#F9A825" />
            )}
          </View>
          <Text style={styles.label}>It was fine</Text>
        </Pressable>

        {/* Bad / Disliked */}
        <Pressable style={styles.button} onPress={() => onSelect("bad")}>
          <View
            style={[
              styles.circle,
              styles.circleBad,
              selected === "bad" && styles.circleBadActive,
            ]}
          >
            {selected === "bad" && (
              <Ionicons name="checkmark" size={28} color="#C62828" />
            )}
          </View>
          <Text style={styles.label}>I didn't like it</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default CategoryPicker;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: "#f9f9f9",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    textAlign: "center",
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  button: {
    alignItems: "center",
    width: 90,
  },
  circle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  circleGood: {
    backgroundColor: "#d4edda",
  },
  circleGoodActive: {
    backgroundColor: "#a8e6cf",
    borderWidth: 3,
    borderColor: "#2E7D32",
  },
  circleAlright: {
    backgroundColor: "#fff3cd",
  },
  circleAlrightActive: {
    backgroundColor: "#ffe082",
    borderWidth: 3,
    borderColor: "#F9A825",
  },
  circleBad: {
    backgroundColor: "#f8d7da",
  },
  circleBadActive: {
    backgroundColor: "#f5b7b1",
    borderWidth: 3,
    borderColor: "#C62828",
  },
  label: {
    fontSize: 12,
    color: "#333",
    textAlign: "center",
  },
});
