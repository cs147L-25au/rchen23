// lib/index.ts
// Export all library functions

// Supabase data access layer
export {
  ensureTitleExists,
  fetchUserRatingsByCategory,
  fetchTotalRatingCount,
  fetchTitleTypeRatingCount,
  upsertRatingAtRank,
  setWatchedWith,
  getWatchedWith,
  fetchFriends,
  createFriend,
  getCurrentUserId,
} from "./ratingsDb";

export type {
  TitleType,
  RatingCategory,
  TitleInput,
  RatingRow,
  UpsertRatingPayload,
  Friend,
} from "./ratingsDb";

// Binary insertion algorithm
export {
  computeInsertionRank,
  getComparisonPhase,
  estimateMaxComparisons,
} from "./beliInsert";

export type { CompareCallback } from "./beliInsert";
