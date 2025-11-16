// components/login.tsx
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import db from "@/database/db";

const ACCENT_RED = "#B3261E";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const signInWithEmail = async () => {
    setLoading(true);
    try {
      const { error } = await db.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        Alert.alert("Sign in error", error.message);
      }
      // On success, the auth listener in app/index.tsx will
      // redirect to /(tabs)
    } catch (err) {
      console.error("Unexpected sign in error", err);
      Alert.alert("Sign in error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isSignInDisabled =
    loading || email.trim().length === 0 || password.trim().length === 0;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.inner}>
        {/* Logo / branding */}
        <View style={styles.splash}>
          <MaterialCommunityIcons
            size={64}
            name="movie-open-outline"
            color={ACCENT_RED}
          />
          <Text style={styles.splashText}>MyFlix</Text>
        </View>

        {/* Email */}
        <TextInput
          onChangeText={setEmail}
          value={email}
          placeholder="email@address.com"
          placeholderTextColor="#999999"
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />

        {/* Password */}
        <TextInput
          onChangeText={setPassword}
          value={password}
          placeholder="Password"
          placeholderTextColor="#999999"
          secureTextEntry
          autoCapitalize="none"
          style={styles.input}
        />

        {/* Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={signInWithEmail}
            disabled={isSignInDisabled}
            style={[
              styles.button,
              isSignInDisabled && styles.buttonDisabledBackground,
            ]}
          >
            <Text
              style={[
                styles.buttonText,
                isSignInDisabled && styles.buttonTextDisabled,
              ]}
            >
              {loading ? "Signing in..." : "Sign in"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 24,
  },
  inner: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  splash: {
    alignItems: "center",
    marginBottom: 32,
  },
  splashText: {
    fontWeight: "700",
    color: ACCENT_RED,
    fontSize: 40,
    marginTop: 8,
  },
  input: {
    color: "#000000",
    backgroundColor: "#f5f5f5",
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  buttonContainer: {
    marginTop: 16,
    width: "100%",
    alignItems: "center",
  },
  button: {
    backgroundColor: ACCENT_RED,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 999,
  },
  buttonDisabledBackground: {
    backgroundColor: "#cccccc",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "600",
  },
  buttonTextDisabled: {
    color: "#f2f2f2",
  },
});
