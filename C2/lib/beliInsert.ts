// lib/beliInsert.ts
// Binary insertion algorithm for Beli-style ranking

import { RatingRow } from "./ratingsDb";

/**
 * Compare callback type.
 * Returns "A" if the new item (A) is preferred, "B" if the existing item (B) is preferred.
 */
export type CompareCallback = (
  newItem: { title: string; poster_path?: string | null },
  existingItem: { title: string; poster_path?: string | null }
) => Promise<"A" | "B">;

/**
 * Compute the insertion rank for a new item using binary insertion.
 *
 * Algorithm:
 * 1. If categoryList is empty: return rank 1
 * 2. Compare new vs TOP item (rank 1):
 *    - If new is better => rank 1
 * 3. Compare new vs BOTTOM item (rank = len):
 *    - If new is worse => rank len+1
 * 4. Binary search between to find exact position
 *
 * @param categoryList - Existing rated items in the category, sorted best->worst (rank 1 = best)
 * @param newTitle - The title being rated
 * @param newPosterPath - Poster path for the new title
 * @param compare - UI callback that prompts user and returns which they prefer
 * @returns The 1-based category_rank where the new item should be inserted
 */
export async function computeInsertionRank(
  categoryList: RatingRow[],
  newTitle: string,
  newPosterPath: string | null | undefined,
  compare: CompareCallback
): Promise<number> {
  const newItem = { title: newTitle, poster_path: newPosterPath };
  const len = categoryList.length;

  // Case 1: Empty list - insert at rank 1
  if (len === 0) {
    return 1;
  }

  // Case 2: Compare with TOP (best) item
  const topItem = categoryList[0];
  const topResult = await compare(newItem, {
    title: topItem.title,
    poster_path: topItem.poster_path,
  });

  if (topResult === "A") {
    // New is better than the best -> rank 1
    return 1;
  }

  // Case 3: Compare with BOTTOM (worst) item
  const bottomItem = categoryList[len - 1];
  const bottomResult = await compare(newItem, {
    title: bottomItem.title,
    poster_path: bottomItem.poster_path,
  });

  if (bottomResult === "B") {
    // New is worse than the worst -> insert after bottom (rank len+1)
    return len + 1;
  }

  // Case 4: Binary search to find exact position
  // At this point we know: new is worse than top, better than bottom
  // So it belongs somewhere in between
  let lo = 0;
  let hi = len - 1;

  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    const midItem = categoryList[mid];

    const midResult = await compare(newItem, {
      title: midItem.title,
      poster_path: midItem.poster_path,
    });

    if (midResult === "A") {
      // New is better than mid -> belongs above mid
      hi = mid;
    } else {
      // New is worse than mid -> belongs below mid
      lo = mid;
    }
  }

  // Insert at position hi (which is 0-indexed, so rank = hi + 1)
  return hi + 1;
}

/**
 * Get the comparison phase description for UI display.
 */
export function getComparisonPhase(step: number, totalSteps: number): string {
  if (step === 1) return "Comparing with your top pick...";
  if (step === 2) return "Comparing with your lowest ranked...";
  return `Narrowing down position (${step}/${totalSteps})...`;
}

/**
 * Estimate maximum comparisons needed for a given list size.
 * Top + Bottom + log2(n) binary search steps
 */
export function estimateMaxComparisons(listSize: number): number {
  if (listSize === 0) return 0;
  if (listSize === 1) return 1;
  // 2 (top + bottom) + ceil(log2(n-1)) for binary search
  return 2 + Math.ceil(Math.log2(Math.max(1, listSize - 1)));
}
