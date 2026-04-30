import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAppTheme } from "../../contexts/ThemeContext";
import { ThemeColors } from "../../constants/theme";

export type RatingBucket = "liked" | "alright" | "disliked";

export interface RatingResult {
  bucket: RatingBucket;
  userRating: number;
  review?: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (result: RatingResult) => void;
  title: string;
}

const RatingModal: React.FC<Props> = ({
  visible,
  onClose,
  onSubmit,
  title,
}) => {
  const [selectedBucket, setSelectedBucket] = useState<RatingBucket>("liked");
  const [ratingText, setRatingText] = useState("");
  const [review, setReview] = useState("");

  const { colors: t } = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const handleSubmit = () => {
    const parsed = parseFloat(ratingText);

    if (isNaN(parsed)) {
      alert("Please enter a number for your rating.");
      return;
    }

    onSubmit({
      bucket: selectedBucket,
      userRating: parsed,
      review: review.trim().length > 0 ? review : undefined,
    });

    setRatingText("");
    setReview("");
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>How was it?</Text>

          <View style={styles.bucketRow}>
            <Pressable
              onPress={() => setSelectedBucket("liked")}
              style={[
                styles.bucketBtn,
                selectedBucket === "liked" && styles.bucketSelectedLiked,
              ]}
            >
              <Feather name="thumbs-up" size={22} color={t.scoreHigh} />
              <Text style={styles.bucketText}>I liked it!</Text>
            </Pressable>

            <Pressable
              onPress={() => setSelectedBucket("alright")}
              style={[
                styles.bucketBtn,
                selectedBucket === "alright" && styles.bucketSelectedAlright,
              ]}
            >
              <Feather name="meh" size={22} color={t.scoreMid} />
              <Text style={styles.bucketText}>It was alright</Text>
            </Pressable>

            <Pressable
              onPress={() => setSelectedBucket("disliked")}
              style={[
                styles.bucketBtn,
                selectedBucket === "disliked" && styles.bucketSelectedDisliked,
              ]}
            >
              <Feather name="thumbs-down" size={22} color={t.scoreLow} />
              <Text style={styles.bucketText}>I didn't like it</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionLabel}>
            Enter rating ({selectedBucket})
          </Text>
          <TextInput
            style={styles.input}
            placeholder="1.0 - 10.0"
            placeholderTextColor={t.placeholder}
            keyboardType="numeric"
            value={ratingText}
            onChangeText={setRatingText}
          />

          <Text style={styles.sectionLabel}>Add a review (optional)</Text>
          <TextInput
            style={[styles.input, styles.reviewInput]}
            multiline
            placeholderTextColor={t.placeholder}
            value={review}
            onChangeText={setReview}
          />

          <View style={styles.buttonRow}>
            <Pressable style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>

            <Pressable style={styles.okayBtn} onPress={handleSubmit}>
              <Text style={styles.okayText}>Okay</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default RatingModal;

const makeStyles = (t: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: t.overlayLight,
      justifyContent: "center",
      padding: 16,
    },
    modal: {
      backgroundColor: t.modalBackground,
      borderRadius: 16,
      padding: 20,
    },
    title: {
      fontSize: 22,
      fontWeight: "700",
      marginBottom: 4,
      color: t.textPrimary,
    },
    subtitle: {
      fontSize: 16,
      color: t.textSecondary,
      marginBottom: 12,
    },
    bucketRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 16,
    },
    bucketBtn: {
      width: "30%",
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: "center",
      backgroundColor: t.inputBackground,
    },
    bucketSelectedLiked: {
      backgroundColor: t.ratingLikedBg,
    },
    bucketSelectedAlright: {
      backgroundColor: t.ratingAlrightBg,
    },
    bucketSelectedDisliked: {
      backgroundColor: t.ratingDislikedBg,
    },
    bucketText: {
      marginTop: 6,
      fontSize: 13,
      fontWeight: "500",
      textAlign: "center",
      color: t.textSecondary,
    },
    sectionLabel: {
      fontSize: 14,
      fontWeight: "600",
      marginBottom: 6,
      marginTop: 8,
      color: t.textPrimary,
    },
    input: {
      borderWidth: 1,
      borderColor: t.inputBorder,
      borderRadius: 10,
      padding: 10,
      fontSize: 14,
      marginBottom: 12,
      color: t.textPrimary,
      backgroundColor: t.inputBackground,
    },
    reviewInput: {
      height: 80,
    },
    buttonRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 8,
    },
    cancelBtn: {
      paddingVertical: 10,
      paddingHorizontal: 20,
    },
    cancelText: {
      color: t.textSecondary,
      fontSize: 16,
    },
    okayBtn: {
      backgroundColor: t.primary,
      paddingVertical: 10,
      paddingHorizontal: 22,
      borderRadius: 12,
    },
    okayText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "600",
    },
  });
