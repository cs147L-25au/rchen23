// contexts/RatingContext.tsx
// React Context for managing user ratings with Supabase persistence

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  fetchTotalRatingCount,
  fetchUserRatingsByCategory,
  getCurrentUserId,
  RatingCategory,
  RatingRow,
} from "../lib/ratingsDb";

// ============ Types ============

interface RatingsByCategory {
  good: RatingRow[];
  alright: RatingRow[];
  bad: RatingRow[];
}

interface RatingContextType {
  // User info
  userId: string | null;
  isLoading: boolean;

  // Rating data
  ratings: RatingsByCategory;
  totalCount: number;
  showScores: boolean;

  // Actions
  refreshRatings: () => Promise<void>;

  // Getters
  getAllRatingsSorted: () => RatingRow[];
  getRatingsByCategory: (category: RatingCategory) => RatingRow[];
}

const RatingContext = createContext<RatingContextType | null>(null);

// ============ Provider ============

export function RatingProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [ratings, setRatings] = useState<RatingsByCategory>({
    good: [],
    alright: [],
    bad: [],
  });
  const [totalCount, setTotalCount] = useState(0);

  // Load user and ratings on mount
  useEffect(() => {
    loadUserAndRatings();
  }, []);

  const loadUserAndRatings = async () => {
    setIsLoading(true);
    try {
      const id = await getCurrentUserId();
      setUserId(id);

      if (id) {
        await loadRatingsForUser(id);
      }
    } catch (err) {
      console.error("Failed to load user/ratings:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRatingsForUser = async (uid: string) => {
    try {
      const [ratingsData, count] = await Promise.all([
        fetchUserRatingsByCategory(uid),
        fetchTotalRatingCount(uid),
      ]);

      setRatings(ratingsData);
      setTotalCount(count);
    } catch (err) {
      console.error("Failed to load ratings:", err);
    }
  };

  const refreshRatings = useCallback(async () => {
    if (userId) {
      await loadRatingsForUser(userId);
    }
  }, [userId]);

  const getAllRatingsSorted = useCallback((): RatingRow[] => {
    // Return all ratings sorted by global_rank
    const all = [...ratings.good, ...ratings.alright, ...ratings.bad];
    return all.sort((a, b) => a.global_rank - b.global_rank);
  }, [ratings]);

  const getRatingsByCategory = useCallback(
    (category: RatingCategory): RatingRow[] => {
      return ratings[category];
    },
    [ratings]
  );

  const showScores = totalCount >= 10;

  return (
    <RatingContext.Provider
      value={{
        userId,
        isLoading,
        ratings,
        totalCount,
        showScores,
        refreshRatings,
        getAllRatingsSorted,
        getRatingsByCategory,
      }}
    >
      {children}
    </RatingContext.Provider>
  );
}

// ============ Hook ============

export function useRating() {
  const context = useContext(RatingContext);
  if (!context) {
    throw new Error("useRating must be used within a RatingProvider");
  }
  return context;
}
