/**
 * Hook that returns the current Supabase auth session.
 * Starts as null and returns the session once it's found.
 * If the user is not logged in, returns null.
 */

import { useEffect, useState } from "react";

import db from "@/database/db";
import { Session } from "@supabase/supabase-js";

export default function useSession(): Session | null {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session } } = await db.auth.getSession();
        if (!session) {
          throw new Error("No session found");
        }
        setSession(session);
      } catch (error) {
        console.error("Error getting session:", error);
      }
    };

    const {
      data: { subscription },
    } = db.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return session;
}
