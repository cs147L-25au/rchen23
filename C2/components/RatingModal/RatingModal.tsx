// components/RatingModal/RatingModal.tsx
import React, { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const ACCENT_RED = "#B3261E";

export type RatingBucket = "liked" | "alright" | "disliked";

export type RatingResult = {
  bucket: RatingBucket;
  userRating: number;
  review?: string;
};

type RatingModalProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  onSubmit: (result: RatingResult) => void;
};

const RatingModal: React.FC<RatingModalProps> = ({
  visible,
  title,
  onClose,
  onSubmit,
}) => {
  const [bucket, setBucket] = useState<RatingBucket>("alright");
  const [review, setReview] = useState("");
  const [ratingInput, setRatingInput] = useState("");

  const handleOkay = () => {
    const numeric = Number(ratingInput);

    if (isNaN(numeric)) {
      Alert.alert("Invalid rating", "Please enter a valid number.");
      return;
    }

    onSubmit({
      bucket,
      userRating: numeric,
      review: review.trim() || undefined,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.titleText}>{title}</Text>
          <Text style={styles.subtitle}>How was it?</Text>

          {/* Sentiment buttons */}
          <View style={styles.bucketRow}>
            <Pressable
              style={[
                styles.bucketButton,
                bucket === "liked" && styles.bucketSelectedLiked,
              ]}
              onPress={() => setBucket("liked")}
            >
              <View
                style={[
                  styles.bucketCircle,
                  styles.bucketCircleLiked,
                  bucket === "liked" && styles.bucketCircleLikedActive,
                ]}
              />
              <Text style={styles.bucketLabel}>I liked it!</Text>
            </Pressable>

            <Pressable
              style={[
                styles.bucketButton,
                bucket === "alright" && styles.bucketSelectedAlright,
              ]}
              onPress={() => setBucket("alright")}
            >
              <View
                style={[
                  styles.bucketCircle,
                  styles.bucketCircleAlright,
                  bucket === "alright" && styles.bucketCircleAlrightActive,
                ]}
              />
              <Text style={styles.bucketLabel}>It was alright</Text>
            </Pressable>

            <Pressable
              style={[
                styles.bucketButton,
                bucket === "disliked" && styles.bucketSelectedDisliked,
              ]}
              onPress={() => setBucket("disliked")}
            >
              <View
                style={[
                  styles.bucketCircle,
                  styles.bucketCircleDisliked,
                  bucket === "disliked" && styles.bucketCircleDislikedActive,
                ]}
              />
              <Text style={styles.bucketLabel}>I didn't like it</Text>
            </Pressable>
          </View>

          {/* Rating input */}
          <Text style={styles.inputLabel}>Your rating (1–10)</Text>
          <TextInput
            value={ratingInput}
            onChangeText={setRatingInput}
            placeholder="Enter rating…"
            keyboardType="numeric"
            style={styles.input}
          />

          {/* Review */}
          <Text style={styles.inputLabel}>Add a review (optional)</Text>
          <TextInput
            value={review}
            onChangeText={setReview}
            placeholder="What did you think?"
            multiline
            style={[styles.input, styles.textArea]}
          />

          {/* Actions */}
          <View style={styles.actionsRow}>
            <Pressable style={styles.secondaryBtn} onPress={onClose}>
              <Text style={styles.secondaryText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.primaryBtn} onPress={handleOkay}>
              <Text style={styles.primaryText}>Okay</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default RatingModal;

/* ---- Styles ---- */
const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "#00000066",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "90%",
    borderRadius: 16,
    backgroundColor: "#fff",
    padding: 16,
  },
  titleText: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 12,
  },

  bucketRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  bucketButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    marginHorizontal: 2,
    borderRadius: 12,
  },
  bucketLabel: {
    fontSize: 11,
    textAlign: "center",
  },

  bucketCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    marginBottom: 4,
  },

  // base colors
  bucketCircleLiked: {
    borderColor: "#8BD48B",
    backgroundColor: "#E6F7E6",
  },
  bucketCircleAlright: {
    borderColor: "#F4D44D",
    backgroundColor: "#FFF6D9",
  },
  bucketCircleDisliked: {
    borderColor: "#F28B82",
    backgroundColor: "#FDE1DE",
  },

  // active states
  bucketCircleLikedActive: {
    borderColor: "#2E7D32",
    backgroundColor: "#A5D6A7",
  },
  bucketCircleAlrightActive: {
    borderColor: "#F9A825",
    backgroundColor: "#FFE082",
  },
  bucketCircleDislikedActive: {
    borderColor: "#C62828",
    backgroundColor: "#FFABAB",
  },

  // selected background
  bucketSelectedLiked: { backgroundColor: "#F0FFF0" },
  bucketSelectedAlright: { backgroundColor: "#FFFBEA" },
  bucketSelectedDisliked: { backgroundColor: "#FFF5F5" },

  inputLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
    fontSize: 14,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },

  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  secondaryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  secondaryText: {
    color: "#555",
  },
  primaryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: ACCENT_RED,
  },
  primaryText: {
    color: "#fff",
    fontWeight: "600",
  },
});
