import { Redirect } from "expo-router";
import { useEffect, useState } from "react";

import db from "@/database/db";
import Loading from "../components/loading";
import { isOnboardingComplete } from "../utils/auth";

import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

type AppState =
  | "loading"
  | "unauthenticated"
  | "needs_onboarding"
  | "authenticated";

export default function AppIndex() {
  const [appState, setAppState] = useState<AppState>("loading");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthAndOnboarding = async () => {
      try {
        // First, check for existing session
        const {
          data: { session },
        } = await db.auth.getSession();

        if (!session?.user) {
          setAppState("unauthenticated");
          return;
        }

        const currentUserId = session.user.id;
        setUserId(currentUserId);

        // Check if user has a profile in the database
        const { data: profile } = await db
          .from("profiles")
          .select("id, first_name")
          .eq("id", currentUserId)
          .maybeSingle();

        // If no profile exists, this is a stale session - sign out and go to auth
        if (!profile) {
          await db.auth.signOut();
          setAppState("unauthenticated");
          return;
        }

        // Check if onboarding is complete (using AsyncStorage)
        const onboardingDone = await isOnboardingComplete(currentUserId);

        if (onboardingDone) {
          setAppState("authenticated");
        } else {
          // Profile exists but onboarding not marked complete
          // Check if profile has required fields (first_name) - if so, mark as complete
          if (profile.first_name) {
            setAppState("authenticated");
          } else {
            setAppState("needs_onboarding");
          }
        }
      } catch (error) {
        console.error("Error checking auth state:", error);
        setAppState("unauthenticated");
      }
    };

    checkAuthAndOnboarding();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = db.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, newSession: Session | null) => {
        if (!newSession?.user) {
          setAppState("unauthenticated");
          setUserId(null);
          return;
        }

        const currentUserId = newSession.user.id;
        setUserId(currentUserId);

        // Check onboarding status (using AsyncStorage)
        const onboardingDone = await isOnboardingComplete(currentUserId);

        if (onboardingDone) {
          setAppState("authenticated");
        } else {
          setAppState("needs_onboarding");
        }
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  // Show loading while checking auth state
  if (appState === "loading") {
    return <Loading />;
  }

  // Not authenticated - show auth screen
  if (appState === "unauthenticated") {
    return <Redirect href="/auth" />;
  }

  // Authenticated but needs onboarding
  if (appState === "needs_onboarding" && userId) {
    return <Redirect href={`/onboarding1?userId=${userId}`} />;
  }

  // Fully authenticated and onboarded - go to main app
  return <Redirect href="/(tabs)/feed" />;
}
