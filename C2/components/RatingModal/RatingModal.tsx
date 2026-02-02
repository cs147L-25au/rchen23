// components/RatingModal/RatingModal.tsx
import db from "@/database/db";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageBackground,
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
  fetchTitleTypeRatingCount,
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
  release_year?: number | null;
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

interface PostPreview {
  displayName: string;
  username: string;
  title: string;
  subtitle: string;
  notes: string | null;
  score: number | null;
  showScore: boolean;
  posterPath: string | null;
  profilePic: string | null;
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
  const [titleTypeRatingCount, setTitleTypeRatingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [postPreview, setPostPreview] = useState<PostPreview | null>(null);

  // Load user ID on mount
  useEffect(() => {
    loadUserId();
  }, []);

  const wasVisibleRef = useRef(false);

  // Reset state only when modal transitions closed -> open
  useEffect(() => {
    if (!wasVisibleRef.current && visible && tmdbData) {
      resetForm();

      // Infer title type from TMDB data
      let nextTitleType: TitleType =
        tmdbData.tmdb_media_type === "tv" ? "tv" : "movie";

      // If updating existing rating, pre-fill form
      if (currentRating) {
        setCategory(currentRating.category);
        nextTitleType = currentRating.title_type;
        setNotes(currentRating.review_body || "");
        setReviewTitle(currentRating.review_title || "");
      }

      setTitleType(nextTitleType);
      loadTitleTypeRatingCount(nextTitleType);
    }
    wasVisibleRef.current = visible;
  }, [visible, tmdbData, currentRating]);

  useEffect(() => {
    if (visible && userId) {
      loadTitleTypeRatingCount();
    }
  }, [visible, userId, titleType]);

  const loadUserId = async () => {
    const id = await getCurrentUserId();
    setUserId(id);
  };

  const loadTitleTypeRatingCount = async (type: TitleType = titleType) => {
    if (!userId) return;
    try {
      const count = await fetchTitleTypeRatingCount(userId, type);
      setTitleTypeRatingCount(count);
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
    setPostPreview(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // ============ Comparison Flow ============

  // Store the resolve function in a ref so it persists across renders
  const comparisonResolveRef = useRef<((choice: "A" | "B") => void) | null>(
    null,
  );

  const compareCallback = useCallback(
    (
      newItem: { title: string; poster_path?: string | null },
      existingItem: { title: string; poster_path?: string | null },
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
    [],
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
        release_year: tmdbData.release_year,
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
          categoryList.length,
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
          compareCallback,
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

      // Refresh counts for score visibility
      const updatedCount = await fetchTitleTypeRatingCount(userId, titleType);
      setTitleTypeRatingCount(updatedCount);

      // Fetch score for the new rating from v_user_ratings
      const { data: ratingRow } = await db
        .from("v_user_ratings")
        .select("score")
        .eq("rating_id", ratingId)
        .maybeSingle();

      // Fetch user profile info for post preview
      const { data: profileRow } = await db
        .from("profiles")
        .select("display_name, username, profile_pic, first_name")
        .eq("id", userId)
        .maybeSingle();

      const displayName =
        profileRow?.display_name || profileRow?.first_name || "User";
      const username = profileRow?.username ? `@${profileRow.username}` : "";

      setPostPreview({
        displayName,
        username,
        title: tmdbData.title,
        subtitle,
        notes: notes.trim() || null,
        score: ratingRow?.score ?? null,
        showScore: updatedCount >= 10,
        posterPath: tmdbData.poster_path || null,
        profilePic: profileRow?.profile_pic || null,
      });

      // Done!
      setFlowStep("done");

      // Keep the post preview open so user can take a photo/screenshot
      onSuccess?.();
    } catch (err) {
      console.error("Rating submission failed:", err);
      setError("Failed to save rating. Please try again.");
      setFlowStep("input");
    }
  };

  // ============ Render ============

  if (!tmdbData) return null;

  const scoresUnlocked = titleTypeRatingCount >= 10;
  const remainingToUnlock = Math.max(0, 10 - titleTypeRatingCount);
  const subtitle = `${tmdbData.tmdb_media_type === "tv" ? "TV" : "Movie"} | ${
    tmdbData.genres.length > 0
      ? tmdbData.genres.slice(0, 2).join(", ")
      : "Unknown Genre"
  }`;
  const posterUri = tmdbData.poster_path
    ? `https://image.tmdb.org/t/p/w780${tmdbData.poster_path}`
    : null;

  return (
    <>
      <Modal visible={visible} transparent animationType="slide">
        <View
          style={[
            styles.container,
            flowStep === "done" && styles.containerFull,
          ]}
        >
          {/* Header */}
          {flowStep !== "done" && (
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
          )}

          {/* Loading/Saving State */}
          {flowStep === "saving" && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1a535c" />
              <Text style={styles.loadingText}>Saving your rating...</Text>
            </View>
          )}

          {/* Done State */}
          {flowStep === "done" && postPreview && (
            <View style={styles.postPreviewContainer}>
              <ImageBackground
                source={posterUri ? { uri: posterUri } : undefined}
                style={styles.postPreviewBackground}
                imageStyle={styles.postPreviewImage}
                resizeMode="cover"
              >
                <View style={styles.postPreviewOverlay} />
                <Pressable
                  style={styles.postPreviewClose}
                  onPress={handleClose}
                >
                  <Ionicons name="chevron-back" size={26} color="#fff" />
                </Pressable>
                <View style={styles.postCard}>
                  <View style={styles.postHeader}>
                    <View style={styles.postHeaderTopRow}>
                      <View style={styles.postUserRow}>
                        <Image
                          source={
                            postPreview.profilePic
                              ? { uri: postPreview.profilePic }
                              : undefined
                          }
                          style={styles.postAvatar}
                        />
                        <View>
                          <Text style={styles.postName}>
                            {postPreview.displayName}
                          </Text>
                          {postPreview.username ? (
                            <Text style={styles.postHandle}>
                              {postPreview.username}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                      <Text style={styles.postBrand}>MyFlix</Text>
                    </View>
                  </View>

                  <View style={styles.postTitleRow}>
                    <View style={styles.postTitleColumn}>
                      <Text style={styles.postTitle}>{postPreview.title}</Text>
                      <Text style={styles.postSubtitle}>
                        {postPreview.subtitle}
                      </Text>
                    </View>
                    {postPreview.showScore ? (
                      <View style={styles.postScoreBadge}>
                        <Text style={styles.postScoreText}>
                          {postPreview.score?.toFixed(1) ?? "—"}
                        </Text>
                      </View>
                    ) : (
                      <Ionicons
                        name="checkmark-circle"
                        size={42}
                        color="#1a535c"
                        style={styles.postCheck}
                      />
                    )}
                  </View>

                  {postPreview.notes ? (
                    <View style={styles.postNotes}>
                      <Text style={styles.postNotesText}>
                        <Text style={styles.postNotesLabel}>Review: </Text>
                        {postPreview.notes}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </ImageBackground>
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
                    <Text style={styles.optionLabel}>Write a Review</Text>
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
                      Rate {remainingToUnlock} more to unlock scores
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
  containerFull: {
    marginTop: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
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
  postPreviewContainer: {
    flex: 1,
  },
  postPreviewBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  postPreviewImage: {
    width: "100%",
    height: "100%",
    alignSelf: "center",
  },
  postPreviewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  postPreviewClose: {
    position: "absolute",
    top: 48,
    left: 18,
    zIndex: 2,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  postCard: {
    width: "82%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    zIndex: 1,
  },
  postHeader: {
    gap: 8,
    marginBottom: 8,
  },
  postHeaderTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  postUserRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  postAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#eee",
  },
  postName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
  },
  postHandle: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  postScoreBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "#E6E6E6",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  postScoreText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a535c",
  },
  postCheck: {
    alignSelf: "center",
  },
  postTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  postTitleColumn: {
    flex: 1,
    minWidth: 0,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  postSubtitle: {
    fontSize: 12,
    color: "#777",
    marginTop: 4,
  },
  postNotes: {
    marginTop: 12,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 0,
    paddingVertical: 8,
  },
  postNotesLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
  },
  postNotesText: {
    fontSize: 12,
    color: "#555",
  },
  postBrandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  postBrand: {
    fontSize: 24.5,
    fontWeight: "700",
    color: "#B3261E",
    marginTop: 2,
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
