// components/RatingModal/RatingModal.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  computeInsertionRank,
  estimateMaxComparisons,
} from "../../lib/beliInsert";
import {
  ensureTitleExists,
  fetchTotalRatingCount,
  fetchUserRatingsByCategory,
  getCurrentUserId,
  RatingCategory,
  RatingRow,
  setWatchedWith,
  TitleType,
  upsertRatingAtRank,
} from "../../lib/ratingsDb";
import CategoryPicker from "./CategoryPicker";
import TitleTypePicker from "./TitleTypePicker";
import WatchWithPicker from "./WatchWithPicker";

// ============ Types ============

export interface TMDBTitleData {
  tmdb_id: number;
  tmdb_media_type: "movie" | "tv";
  title: string;
  genres: string[];
  poster_path?: string | null;
}

export type RatingModalProps = {
  visible: boolean;
  tmdbData: TMDBTitleData | null;
  onClose: () => void;
  onSuccess?: () => void;
  currentRating?: RatingRow | null; // If updating existing rating
};

type FlowStep = "input" | "comparing" | "saving" | "done";

interface ComparisonState {
  newItem: { title: string; poster_path?: string | null };
  compareItem: { title: string; poster_path?: string | null };
  comparisonNumber: number;
  totalEstimate: number;
  resolve: (result: "A" | "B") => void;
}

// ============ Component ============

const RatingModal: React.FC<RatingModalProps> = ({
  visible,
  tmdbData,
  onClose,
  onSuccess,
  currentRating,
}) => {
  // User state
  const [userId, setUserId] = useState<string | null>(null);

  // Form state
  const [category, setCategory] = useState<RatingCategory | null>(null);
  const [titleType, setTitleType] = useState<TitleType>("movie");
  const [notes, setNotes] = useState("");
  const [reviewTitle, setReviewTitle] = useState("");
  const [watchedAt, setWatchedAt] = useState<Date>(new Date());
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [stealthMode, setStealthMode] = useState(false);

  // Flow state
  const [flowStep, setFlowStep] = useState<FlowStep>("input");
  const [comparisonState, setComparisonState] =
    useState<ComparisonState | null>(null);
  const [totalRatings, setTotalRatings] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Load user ID on mount
  useEffect(() => {
    loadUserId();
  }, []);

  // Reset state when modal opens
  useEffect(() => {
    if (visible && tmdbData) {
      resetForm();
      loadTotalRatings();

      // Infer title type from TMDB data
      if (tmdbData.tmdb_media_type === "tv") {
        setTitleType("tv");
      } else {
        setTitleType("movie");
      }

      // If updating existing rating, pre-fill form
      if (currentRating) {
        setCategory(currentRating.category);
        setTitleType(currentRating.title_type);
        setNotes(currentRating.review_body || "");
        setReviewTitle(currentRating.review_title || "");
      }
    }
  }, [visible, tmdbData, currentRating]);

  const loadUserId = async () => {
    const id = await getCurrentUserId();
    setUserId(id);
  };

  const loadTotalRatings = async () => {
    if (!userId) return;
    try {
      const count = await fetchTotalRatingCount(userId);
      setTotalRatings(count);
    } catch (err) {
      console.error("Failed to load rating count:", err);
    }
  };

  const resetForm = () => {
    setCategory(null);
    setNotes("");
    setReviewTitle("");
    setWatchedAt(new Date());
    setSelectedFriendIds([]);
    setStealthMode(false);
    setFlowStep("input");
    setComparisonState(null);
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // ============ Comparison Flow ============

  // Store the resolve function in a ref so it persists across renders
  const comparisonResolveRef = useRef<((choice: "A" | "B") => void) | null>(
    null
  );

  const compareCallback = useCallback(
    (
      newItem: { title: string; poster_path?: string | null },
      existingItem: { title: string; poster_path?: string | null }
    ): Promise<"A" | "B"> => {
      return new Promise((resolve) => {
        // Store resolve in ref
        comparisonResolveRef.current = resolve;

        // Update state to show comparison modal
        setComparisonState((prev) => ({
          newItem,
          compareItem: existingItem,
          comparisonNumber: prev ? prev.comparisonNumber + 1 : 1,
          totalEstimate: prev?.totalEstimate || 3,
          resolve,
        }));
      });
    },
    []
  );

  const handleComparisonSelect = (choice: "A" | "B") => {
    // Use the ref to resolve, then clear state for next comparison
    if (comparisonResolveRef.current) {
      const resolveFunc = comparisonResolveRef.current;
      comparisonResolveRef.current = null;
      // Small delay to ensure state is cleared before next comparison
      setTimeout(() => {
        resolveFunc(choice);
      }, 50);
    }
  };

  const handleComparisonCancel = () => {
    comparisonResolveRef.current = null;
    setFlowStep("input");
    setComparisonState(null);
  };

  // ============ Submit Flow ============

  const handleSubmit = async () => {
    if (!category || !tmdbData || !userId) return;

    setError(null);

    try {
      // Step 1: Ensure title exists in DB
      setFlowStep("saving");

      const titleId = await ensureTitleExists({
        tmdb_id: tmdbData.tmdb_id,
        tmdb_media_type: tmdbData.tmdb_media_type,
        title: tmdbData.title,
        genres: tmdbData.genres,
        title_type: titleType,
        poster_path: tmdbData.poster_path,
      });

      // Step 2: Fetch current ratings by category
      const ratings = await fetchUserRatingsByCategory(userId);
      const categoryList = ratings[category];

      // Calculate estimated comparisons
      const maxComparisons = estimateMaxComparisons(categoryList.length);

      // Step 3: Determine insertion rank
      let categoryRank: number;

      if (categoryList.length === 0) {
        // No comparisons needed - first item in category
        categoryRank = 1;
      } else {
        // Start comparison flow
        console.log(
          "Starting comparison flow, categoryList length:",
          categoryList.length
        );

        // Set up initial comparison state BEFORE changing flow step
        const topItem = categoryList[0];
        setComparisonState({
          newItem: { title: tmdbData.title, poster_path: tmdbData.poster_path },
          compareItem: {
            title: topItem.title,
            poster_path: topItem.poster_path,
          },
          comparisonNumber: 1,
          totalEstimate: maxComparisons,
          resolve: () => {},
        });

        // Now switch to comparing mode
        setFlowStep("comparing");

        // Allow React to render the comparison modal
        await new Promise((resolve) => setTimeout(resolve, 200));

        console.log("Comparison state set, starting algorithm");

        categoryRank = await computeInsertionRank(
          categoryList,
          tmdbData.title,
          tmdbData.poster_path,
          compareCallback
        );

        console.log("Comparison done, rank:", categoryRank);
      }

      // Step 4: Save to DB
      setFlowStep("saving");
      setComparisonState(null);

      const ratingId = await upsertRatingAtRank({
        title_id: titleId,
        category,
        category_rank: categoryRank,
        review_title: reviewTitle.trim() || null,
        review_body: notes.trim() || null,
        user_comments: null,
        watched_at: watchedAt.toISOString(),
      });

      // Step 5: Save watch-with relations
      if (selectedFriendIds.length > 0) {
        await setWatchedWith(ratingId, selectedFriendIds);
      }

      // Done!
      setFlowStep("done");

      // Close modal after brief delay to show success
      setTimeout(() => {
        handleClose();
        onSuccess?.();
      }, 500);
    } catch (err) {
      console.error("Rating submission failed:", err);
      setError("Failed to save rating. Please try again.");
      setFlowStep("input");
    }
  };

  // ============ Render ============

  if (!tmdbData) return null;

  const scoresUnlocked = totalRatings >= 10;
  const subtitle = `${tmdbData.tmdb_media_type === "tv" ? "TV" : "Movie"} | ${
    tmdbData.genres.length > 0
      ? tmdbData.genres.slice(0, 2).join(", ")
      : "Unknown Genre"
  }`;

  return (
    <>
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {tmdbData.title}
              </Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            </View>
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </Pressable>
          </View>

          {/* Loading/Saving State */}
          {flowStep === "saving" && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1a535c" />
              <Text style={styles.loadingText}>Saving your rating...</Text>
            </View>
          )}

          {/* Done State */}
          {flowStep === "done" && (
            <View style={styles.loadingContainer}>
              <Ionicons name="checkmark-circle" size={64} color="#2E7D32" />
              <Text style={styles.successText}>Rating saved!</Text>
            </View>
          )}

          {/* Comparing State - show comparison UI directly inside this modal */}
          {flowStep === "comparing" && comparisonState && (
            <View style={styles.comparisonContainer}>
              <Text style={styles.comparisonTitle}>Which do you prefer?</Text>
              {comparisonState.comparisonNumber > 0 &&
                comparisonState.totalEstimate > 0 && (
                  <Text style={styles.comparisonProgress}>
                    Comparison {comparisonState.comparisonNumber} of ~
                    {comparisonState.totalEstimate}
                  </Text>
                )}

              <View style={styles.comparisonRow}>
                {/* Option A - New Item */}
                <Pressable
                  style={styles.comparisonCard}
                  onPress={() => handleComparisonSelect("A")}
                >
                  <View style={styles.comparisonPoster}>
                    <Text style={styles.posterInitial}>
                      {comparisonState.newItem.title.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.comparisonCardTitle} numberOfLines={2}>
                    {comparisonState.newItem.title}
                  </Text>
                </Pressable>

                {/* OR Badge */}
                <View style={styles.orBadge}>
                  <Text style={styles.orText}>OR</Text>
                </View>

                {/* Option B - Existing Item */}
                <Pressable
                  style={styles.comparisonCard}
                  onPress={() => handleComparisonSelect("B")}
                >
                  <View style={styles.comparisonPoster}>
                    <Text style={styles.posterInitial}>
                      {comparisonState.compareItem.title
                        .charAt(0)
                        .toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.comparisonCardTitle} numberOfLines={2}>
                    {comparisonState.compareItem.title}
                  </Text>
                </Pressable>
              </View>

              {/* Cancel button */}
              <Pressable
                style={styles.cancelComparisonBtn}
                onPress={handleComparisonCancel}
              >
                <Text style={styles.cancelComparisonText}>← Cancel</Text>
              </Pressable>
            </View>
          )}

          {/* Comparing State - loading fallback if no comparison state yet */}
          {flowStep === "comparing" && !comparisonState && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1a535c" />
              <Text style={styles.loadingText}>Loading comparison...</Text>
            </View>
          )}

          {/* Input Form */}
          {flowStep === "input" && (
            <>
              <ScrollView style={styles.content} bounces={false}>
                {/* Title Type Picker */}
                <TitleTypePicker selected={titleType} onSelect={setTitleType} />

                {/* Category Picker (Good/Alright/Bad) */}
                <CategoryPicker selected={category} onSelect={setCategory} />

                <View style={styles.divider} />

                {/* Watch With Picker */}
                {userId && (
                  <WatchWithPicker
                    userId={userId}
                    selectedFriendIds={selectedFriendIds}
                    onSelect={setSelectedFriendIds}
                  />
                )}

                {/* Add Labels */}
                <Pressable style={styles.optionRow}>
                  <Ionicons name="pricetag-outline" size={22} color="#555" />
                  <View style={styles.optionContent}>
                    <Text style={styles.optionLabel}>
                      Add labels (good for, etc.)
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </Pressable>

                {/* Notes */}
                <Pressable style={styles.optionRow}>
                  <Ionicons name="create-outline" size={22} color="#555" />
                  <View style={styles.optionContent}>
                    <Text style={styles.optionLabel}>Add notes</Text>
                    {notes.length > 0 && (
                      <Text style={styles.optionValue} numberOfLines={1}>
                        {notes}
                      </Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </Pressable>

                {/* Notes Input */}
                <View style={styles.notesContainer}>
                  <TextInput
                    style={styles.notesInput}
                    placeholder="What did you think?"
                    placeholderTextColor="#999"
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                  />
                </View>

                {/* Add favorite dishes/scenes */}
                <Pressable style={styles.optionRow}>
                  <Ionicons name="star-outline" size={22} color="#555" />
                  <View style={styles.optionContent}>
                    <Text style={styles.optionLabel}>Add favorite scenes</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </Pressable>

                {/* Add photos */}
                <Pressable style={styles.optionRow}>
                  <Ionicons name="camera-outline" size={22} color="#555" />
                  <View style={styles.optionContent}>
                    <Text style={styles.optionLabel}>Add photos</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </Pressable>

                {/* Watch Date */}
                <Pressable style={styles.optionRow}>
                  <Ionicons name="calendar-outline" size={22} color="#555" />
                  <View style={styles.optionContent}>
                    <Text style={styles.optionLabel}>Add watch date</Text>
                    <Text style={styles.optionValue}>
                      {watchedAt.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </Pressable>

                {/* Stealth Mode */}
                <View style={styles.optionRow}>
                  <Ionicons name="lock-closed-outline" size={22} color="#555" />
                  <View style={styles.optionContent}>
                    <Text style={styles.optionLabel}>Stealth mode 🔒</Text>
                    <Text style={styles.optionSubtext}>
                      Hide this activity from newsfeed
                    </Text>
                  </View>
                  <Switch
                    value={stealthMode}
                    onValueChange={setStealthMode}
                    trackColor={{ false: "#e5e5e5", true: "#1a535c" }}
                  />
                </View>

                {/* Scores unlock message */}
                {!scoresUnlocked && (
                  <View style={styles.unlockMessage}>
                    <Ionicons name="lock-open-outline" size={16} color="#888" />
                    <Text style={styles.unlockText}>
                      Rate {10 - totalRatings} more to unlock scores
                    </Text>
                  </View>
                )}

                {/* Error message */}
                {error && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}
              </ScrollView>

              {/* Footer */}
              <View style={styles.footer}>
                {currentRating ? (
                  <>
                    <Pressable
                      style={styles.footerButton}
                      onPress={handleClose}
                    >
                      <Text style={styles.footerButtonText}>
                        Keep at {currentRating.score?.toFixed(1) ?? "—"}
                      </Text>
                    </Pressable>
                    <View style={styles.footerDivider} />
                    <Pressable
                      style={styles.footerButton}
                      onPress={handleSubmit}
                      disabled={!category}
                    >
                      <Text
                        style={[
                          styles.footerButtonText,
                          !category && styles.footerButtonDisabled,
                        ]}
                      >
                        Change rank
                      </Text>
                    </Pressable>
                  </>
                ) : (
                  <Pressable
                    style={[
                      styles.footerButtonFull,
                      !category && styles.footerDisabled,
                    ]}
                    onPress={handleSubmit}
                    disabled={!category}
                  >
                    <Text
                      style={[
                        styles.footerButtonTextFull,
                        !category && styles.footerButtonDisabled,
                      ]}
                    >
                      Okay
                    </Text>
                  </Pressable>
                )}
              </View>
            </>
          )}
        </View>
      </Modal>
    </>
  );
};

export default RatingModal;

// ============ Styles ============

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    marginTop: 50,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
  },
  header: {
    backgroundColor: "#1a1a1a",
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerContent: {
    flex: 1,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#aaa",
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  successText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2E7D32",
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e5e5",
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    gap: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 15,
    color: "#000",
  },
  optionValue: {
    fontSize: 13,
    color: "#888",
    marginTop: 2,
  },
  optionSubtext: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  notesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  notesInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: "top",
  },
  unlockMessage: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  unlockText: {
    fontSize: 13,
    color: "#888",
  },
  errorContainer: {
    backgroundColor: "#fee",
    padding: 12,
    margin: 16,
    borderRadius: 8,
  },
  errorText: {
    color: "#c00",
    fontSize: 14,
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
    backgroundColor: "#fff",
  },
  footerButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
  },
  footerDivider: {
    width: 1,
    backgroundColor: "#e5e5e5",
  },
  footerButtonText: {
    fontSize: 16,
    color: "#1a535c",
    fontWeight: "600",
  },
  footerButtonFull: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    backgroundColor: "#1a535c",
  },
  footerButtonTextFull: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  footerDisabled: {
    backgroundColor: "#ccc",
  },
  footerButtonDisabled: {
    color: "#999",
  },
  // Comparison styles
  comparisonContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  comparisonTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000",
    textAlign: "center",
    marginBottom: 8,
  },
  comparisonProgress: {
    fontSize: 14,
    color: "#888",
    marginBottom: 24,
  },
  comparisonRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    width: "100%",
  },
  comparisonCard: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: "#e0e0e0",
  },
  comparisonPoster: {
    width: 100,
    height: 140,
    borderRadius: 12,
    backgroundColor: "#1a535c",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  posterInitial: {
    fontSize: 48,
    fontWeight: "700",
    color: "#fff",
  },
  comparisonCardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    textAlign: "center",
    height: 40,
  },
  orBadge: {
    position: "absolute",
    zIndex: 10,
    backgroundColor: "#1a535c",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  orText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
  cancelComparisonBtn: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  cancelComparisonText: {
    fontSize: 16,
    color: "#888",
  },
});
