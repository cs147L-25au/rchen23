// utils/ratingSystem.ts
// Binary search-based rating system similar to Beli

export type RatingCategory = "good" | "alright" | "bad";

export interface RatedMovie {
  id: string;
  title: string;
  genres: string[];
  category: RatingCategory;
  order: number; // Global rank (1 = best)
  score: number | null; // null until totalCount >= 10
  dateAdded: number; // timestamp
}

export interface RatingState {
  itemsById: Record<string, RatedMovie>;
  lists: {
    good: string[];
    alright: string[];
    bad: string[];
  };
  totalCount: number;
  showScores: boolean;
}

// Score ranges for each category
const RANGE: Record<RatingCategory, { max: number; min: number }> = {
  good: { max: 10.0, min: 7.0 },
  alright: { max: 6.9, min: 4.0 },
  bad: { max: 3.9, min: 1.0 },
};

// Initialize empty state
export function createEmptyState(): RatingState {
  return {
    itemsById: {},
    lists: {
      good: [],
      alright: [],
      bad: [],
    },
    totalCount: 0,
    showScores: false,
  };
}

// Round to 1 decimal place
function roundTo1(n: number): number {
  return Math.round(n * 10) / 10;
}

// Recalculate evenly spaced scores for a category
export function recalcScoresForCategory(
  state: RatingState,
  category: RatingCategory
): void {
  const list = state.lists[category];
  const k = list.length;
  const { max: maxScore, min: minScore } = RANGE[category];

  if (k === 0) return;

  if (k === 1) {
    state.itemsById[list[0]].score = maxScore;
    return;
  }

  const step = (maxScore - minScore) / (k - 1);

  for (let i = 0; i < k; i++) {
    const id = list[i];
    const raw = maxScore - i * step;
    state.itemsById[id].score = roundTo1(raw);
  }
}

// Recalculate global order ranks
export function recalcGlobalOrders(state: RatingState): void {
  const globalList = [
    ...state.lists.good,
    ...state.lists.alright,
    ...state.lists.bad,
  ];

  for (let idx = 0; idx < globalList.length; idx++) {
    const id = globalList[idx];
    state.itemsById[id].order = idx + 1;
  }
}

// Insert item at a specific position in category list
export function insertAtPosition(
  state: RatingState,
  itemId: string,
  category: RatingCategory,
  position: number
): void {
  state.lists[category].splice(position, 0, itemId);
}

// Add first item (no comparison needed)
export function addFirstItem(
  state: RatingState,
  itemId: string,
  title: string,
  genres: string[],
  category: RatingCategory
): RatingState {
  const newItem: RatedMovie = {
    id: itemId,
    title,
    genres,
    category,
    order: -1,
    score: null,
    dateAdded: Date.now(),
  };

  state.itemsById[itemId] = newItem;
  state.lists[category].push(itemId);
  state.totalCount += 1;

  if (state.totalCount >= 10) {
    state.showScores = true;
  }

  // Recalculate scores if unlocked
  if (state.showScores) {
    recalcScoresForCategory(state, category);
  }

  recalcGlobalOrders(state);

  return state;
}

// Get comparison items for binary insertion
export interface ComparisonStep {
  type: "top" | "bottom" | "mid";
  compareWithId: string;
  compareWithTitle: string;
  lo: number;
  hi: number;
}

export function getNextComparison(
  state: RatingState,
  category: RatingCategory,
  currentStep: { lo: number; hi: number; phase: "top" | "bottom" | "binary" }
): ComparisonStep | null {
  const list = state.lists[category];

  if (list.length === 0) {
    return null; // No comparison needed, just add
  }

  if (currentStep.phase === "top") {
    const topId = list[0];
    return {
      type: "top",
      compareWithId: topId,
      compareWithTitle: state.itemsById[topId].title,
      lo: 0,
      hi: list.length - 1,
    };
  }

  if (currentStep.phase === "bottom") {
    const bottomId = list[list.length - 1];
    return {
      type: "bottom",
      compareWithId: bottomId,
      compareWithTitle: state.itemsById[bottomId].title,
      lo: 0,
      hi: list.length - 1,
    };
  }

  // Binary phase
  if (currentStep.hi - currentStep.lo <= 1) {
    return null; // Done, insert at hi
  }

  const mid = Math.floor((currentStep.lo + currentStep.hi) / 2);
  const midId = list[mid];
  return {
    type: "mid",
    compareWithId: midId,
    compareWithTitle: state.itemsById[midId].title,
    lo: currentStep.lo,
    hi: currentStep.hi,
  };
}

// Process comparison result and get next step or final position
export interface ComparisonResult {
  done: boolean;
  insertPosition?: number;
  nextStep?: { lo: number; hi: number; phase: "top" | "bottom" | "binary" };
}

export function processComparison(
  state: RatingState,
  category: RatingCategory,
  currentStep: { lo: number; hi: number; phase: "top" | "bottom" | "binary" },
  newIsBetter: boolean
): ComparisonResult {
  const list = state.lists[category];

  if (currentStep.phase === "top") {
    if (newIsBetter) {
      // New item is better than top, insert at position 0
      return { done: true, insertPosition: 0 };
    }
    // Move to bottom comparison
    return {
      done: false,
      nextStep: { lo: 0, hi: list.length - 1, phase: "bottom" },
    };
  }

  if (currentStep.phase === "bottom") {
    if (!newIsBetter) {
      // New item is worse than bottom, insert at end
      return { done: true, insertPosition: list.length };
    }
    // Move to binary search
    return {
      done: false,
      nextStep: { lo: 0, hi: list.length - 1, phase: "binary" },
    };
  }

  // Binary phase
  const mid = Math.floor((currentStep.lo + currentStep.hi) / 2);

  let newLo = currentStep.lo;
  let newHi = currentStep.hi;

  if (newIsBetter) {
    // New beats mid, belongs above mid
    newHi = mid;
  } else {
    // New loses to mid, belongs below mid
    newLo = mid;
  }

  if (newHi - newLo <= 1) {
    // Done, insert at newHi
    return { done: true, insertPosition: newHi };
  }

  return {
    done: false,
    nextStep: { lo: newLo, hi: newHi, phase: "binary" },
  };
}

// Finalize insertion after all comparisons
export function finalizeInsertion(
  state: RatingState,
  itemId: string,
  title: string,
  genres: string[],
  category: RatingCategory,
  insertPosition: number
): RatingState {
  const newItem: RatedMovie = {
    id: itemId,
    title,
    genres,
    category,
    order: -1,
    score: null,
    dateAdded: Date.now(),
  };

  state.itemsById[itemId] = newItem;
  state.lists[category].splice(insertPosition, 0, itemId);
  state.totalCount += 1;

  if (state.totalCount >= 10) {
    state.showScores = true;
  }

  // Recalculate scores if unlocked
  if (state.showScores) {
    recalcScoresForCategory(state, category);
  }

  recalcGlobalOrders(state);

  return state;
}

// Get all items sorted by global order
export function getAllItemsSorted(state: RatingState): RatedMovie[] {
  const globalList = [
    ...state.lists.good,
    ...state.lists.alright,
    ...state.lists.bad,
  ];
  return globalList.map((id) => state.itemsById[id]);
}

// Get items by category
export function getItemsByCategory(
  state: RatingState,
  category: RatingCategory
): RatedMovie[] {
  return state.lists[category].map((id) => state.itemsById[id]);
}

// Serialize state to JSON (for storage)
export function serializeState(state: RatingState): string {
  return JSON.stringify(state);
}

// Deserialize state from JSON
export function deserializeState(json: string): RatingState {
  return JSON.parse(json);
}
