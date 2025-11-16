import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { AppState } from "react-native";
import "react-native-url-polyfill/auto";

const supabaseUrl = "https://eagksfoqgydjaqoijjtj.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZ2tzZm9xZ3lkamFxb2lqanRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyNDU2NzUsImV4cCI6MjA3ODgyMTY3NX0.mLjD2TcsYoXvCIui0HprlRfR3PALXOeYsCHwtVLSPDc";

const db = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

AppState.addEventListener("change", (state) => {
  if (state === "active") {
    db.auth.startAutoRefresh();
  } else {
    db.auth.stopAutoRefresh();
  }
});

export default db;
