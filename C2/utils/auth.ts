// utils/auth.ts
// Shared authentication helper for getting the authenticated user ID
// This centralizes the logic for obtaining the user ID across all screens

import AsyncStorage from "@react-native-async-storage/async-storage";
import db from "../database/db";

// Key for storing user ID in AsyncStorage (used when session isn't available yet)
const STORED_USER_ID_KEY = "@myflix_stored_user_id";

// Key for tracking if user has completed onboarding
const ONBOARDING_COMPLETE_KEY = "@myflix_onboarding_complete";

// Key for storing pending signup credentials (for email verification flow)
const PENDING_SIGNUP_KEY = "@myflix_pending_signup";

/**
 * Store the user ID after signup for later retrieval
 * This is necessary because tab navigation doesn't preserve params
 * and the Supabase session may not be immediately available
 */
export async function storeUserId(userId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(STORED_USER_ID_KEY, userId);
    console.log("✅ storeUserId: Stored user ID:", userId);
  } catch (e) {
    console.error("❌ storeUserId: Failed to store:", e);
  }
}

/**
 * Clear the stored user ID (call on logout)
 */
export async function clearStoredUserId(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORED_USER_ID_KEY);
    console.log("✅ clearStoredUserId: Cleared stored user ID");
  } catch (e) {
    console.error("❌ clearStoredUserId: Failed to clear:", e);
  }
}

/**
 * Get the authenticated user ID using multiple fallback methods
 * @param params - Optional navigation params that may contain userId
 * @param options - Optional settings like retry count
 * @returns The authenticated user ID, or null if not found
 */
export async function getAuthUserId(
  params?: { userId?: string },
  options?: { retries?: number; silent?: boolean },
): Promise<string | null> {
  const maxRetries = options?.retries ?? 0;
  const silent = options?.silent ?? false;

  // Method 1: Prefer userId passed via navigation params (most reliable after signup/onboarding)
  if (params?.userId) {
    if (!silent) {
      console.log(
        "✅ getAuthUserId: Got user ID from navigation params:",
        params.userId,
      );
    }
    // Also store it for future use (in case we navigate to tabs)
    await storeUserId(params.userId);
    return params.userId;
  }

  // Try to get from session/user with optional retries
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // Method 2: Try db.auth.getSession()
    try {
      const {
        data: { session },
        error: sessionError,
      } = await db.auth.getSession();
      if (!sessionError && session?.user?.id) {
        if (!silent) {
          console.log(
            "✅ getAuthUserId: Got user ID from getSession():",
            session.user.id,
          );
        }
        return session.user.id;
      }
      if (sessionError && !silent) {
        console.warn("⚠️ getAuthUserId: getSession() error:", sessionError);
      }
    } catch (e) {
      if (!silent) {
        console.warn("⚠️ getAuthUserId: getSession() failed:", e);
      }
    }

    // Method 3: Fallback to db.auth.getUser()
    try {
      const {
        data: { user },
        error: userError,
      } = await db.auth.getUser();
      if (!userError && user?.id) {
        if (!silent) {
          console.log("✅ getAuthUserId: Got user ID from getUser():", user.id);
        }
        return user.id;
      }
      if (userError && !silent) {
        console.warn("⚠️ getAuthUserId: getUser() error:", userError);
      }
    } catch (e) {
      if (!silent) {
        console.warn("⚠️ getAuthUserId: getUser() failed:", e);
      }
    }

    // Wait before retrying (if not the last attempt)
    if (attempt < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  // Method 4: Fallback to AsyncStorage (for users who just signed up but session isn't active)
  try {
    const storedUserId = await AsyncStorage.getItem(STORED_USER_ID_KEY);
    if (storedUserId) {
      if (!silent) {
        console.log(
          "✅ getAuthUserId: Got user ID from AsyncStorage:",
          storedUserId,
        );
      }
      return storedUserId;
    }
  } catch (e) {
    if (!silent) {
      console.warn("⚠️ getAuthUserId: AsyncStorage fallback failed:", e);
    }
  }

  // If all methods failed
  if (!silent) {
    console.error(
      "❌ getAuthUserId: Could not get authenticated user ID from any method",
    );
  }

  return null;
}

/**
 * Mark onboarding as complete for the current user
 */
export async function setOnboardingComplete(userId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(`${ONBOARDING_COMPLETE_KEY}_${userId}`, "true");
    console.log(
      "✅ setOnboardingComplete: Marked onboarding complete for:",
      userId,
    );
  } catch (e) {
    console.error("❌ setOnboardingComplete: Failed to set:", e);
  }
}

/**
 * Check if onboarding is complete for a user
 */
export async function isOnboardingComplete(userId: string): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(
      `${ONBOARDING_COMPLETE_KEY}_${userId}`,
    );
    return value === "true";
  } catch (e) {
    console.error("❌ isOnboardingComplete: Failed to check:", e);
    return false;
  }
}

/**
 * Clear onboarding status (call on logout)
 */
export async function clearOnboardingStatus(userId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(`${ONBOARDING_COMPLETE_KEY}_${userId}`);
    console.log("✅ clearOnboardingStatus: Cleared for:", userId);
  } catch (e) {
    console.error("❌ clearOnboardingStatus: Failed to clear:", e);
  }
}

/**
 * Sign out the user and clear all stored data
 */
export async function signOut(): Promise<void> {
  try {
    // Get current user ID before signing out
    const userId = await getAuthUserId(undefined, { silent: true });

    // Sign out from Supabase
    await db.auth.signOut();

    // Clear stored data
    await clearStoredUserId();
    await clearPendingSignup();
    // Keep onboarding status so returning users don't repeat it

    console.log("✅ signOut: Successfully signed out");
  } catch (e) {
    console.error("❌ signOut: Error during sign out:", e);
    throw e;
  }
}

/**
 * Store pending signup credentials for email verification flow
 * These are stored temporarily so we can auto sign-in after email verification
 */
export interface PendingSignup {
  email: string;
  password: string;
  userId: string;
  timestamp: number;
}

export async function storePendingSignup(
  data: Omit<PendingSignup, "timestamp">,
): Promise<void> {
  try {
    const pending: PendingSignup = {
      ...data,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(PENDING_SIGNUP_KEY, JSON.stringify(pending));
    console.log(
      "✅ storePendingSignup: Stored pending signup for:",
      data.email,
    );
  } catch (e) {
    console.error("❌ storePendingSignup: Failed to store:", e);
  }
}

/**
 * Get pending signup credentials (if they exist and aren't expired)
 * Credentials expire after 1 hour for security
 */
export async function getPendingSignup(): Promise<PendingSignup | null> {
  try {
    const stored = await AsyncStorage.getItem(PENDING_SIGNUP_KEY);
    if (!stored) return null;

    const pending: PendingSignup = JSON.parse(stored);

    // Check if expired (1 hour = 3600000ms)
    const ONE_HOUR = 60 * 60 * 1000;
    if (Date.now() - pending.timestamp > ONE_HOUR) {
      console.log("⚠️ getPendingSignup: Credentials expired, clearing...");
      await clearPendingSignup();
      return null;
    }

    console.log(
      "✅ getPendingSignup: Retrieved pending signup for:",
      pending.email,
    );
    return pending;
  } catch (e) {
    console.error("❌ getPendingSignup: Failed to get:", e);
    return null;
  }
}

/**
 * Clear pending signup credentials
 */
export async function clearPendingSignup(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PENDING_SIGNUP_KEY);
    console.log("✅ clearPendingSignup: Cleared pending signup");
  } catch (e) {
    console.error("❌ clearPendingSignup: Failed to clear:", e);
  }
}
