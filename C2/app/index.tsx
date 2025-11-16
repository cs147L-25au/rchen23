import { Redirect } from "expo-router";
import { useEffect, useState } from "react";

import db from "@/database/db";
import Loading from "../components/loading";
import Login from "../components/login";

import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

export default function AppIndex() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const getSession = async () => {
      try {
        const {
          data: { session },
        } = await db.auth.getSession();
        setSession(session);
      } catch (error) {
        console.error("Error getting session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    setIsLoading(true);
    getSession();

    const {
      data: { subscription },
    } = db.auth.onAuthStateChange(
      (_event: AuthChangeEvent, newSession: Session | null) => {
        setSession(newSession);
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) {
    return <Loading />;
  }

  if (session) {
    // ✅ point to the actual screen that exists now
    return <Redirect href="/(tabs)/feed" />;
  }

  return <Login />;
}
