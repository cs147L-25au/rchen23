// app/auth.tsx
// Authentication screen with login and signup functionality

import { Ionicons } from "@expo/vector-icons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import db from "@/database/db";
import { createProfile, getProfileById } from "@/database/profileQueries";
import { clearStoredUserId, storeUserId } from "@/utils/auth";

const ACCENT_RED = "#B3261E";

type AuthMode = "login" | "signup";

export default function AuthScreen() {
  const params = useLocalSearchParams<{ restoreForm?: string }>();

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showEmailVerificationModal, setShowEmailVerificationModal] =
    useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationUserId, setVerificationUserId] = useState<string | null>(
    null,
  );
  const [pendingSignupPassword, setPendingSignupPassword] = useState<
    string | null
  >(null);

  // Restore signup form if coming back from onboarding
  useEffect(() => {
    if (params.restoreForm === "true") {
      setMode("signup");
    }
  }, [params.restoreForm]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const signInWithEmail = async () => {
    if (!validateEmail(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      await db.auth.signOut();
      await clearStoredUserId();

      const { data, error } = await db.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        Alert.alert("Sign In Error", error.message);
        return;
      }

      const {
        data: { user: currentUser },
      } = await db.auth.getUser();
      const authedUser = currentUser ?? data.user;

      if (authedUser) {
        await storeUserId(authedUser.id);

        const existingProfile = await getProfileById(authedUser.id);
        if (!existingProfile) {
          const meta = authedUser.user_metadata || {};
          const first = (meta.first_name || "").trim();
          const last = (meta.last_name || "").trim();
          const display =
            (meta.display_name || "").trim() ||
            [first, last].filter(Boolean).join(" ") ||
            authedUser.email?.split("@")[0] ||
            "User";
          await createProfile({
            id: authedUser.id,
            email: authedUser.email || email.trim(),
            first_name: first || display,
            last_name: last || "",
            display_name: display,
          });
        }

        // Signed-in users go straight to the app
        router.replace("/(tabs)/feed");
      }
    } catch (err) {
      console.error("Unexpected sign in error", err);
      Alert.alert("Sign In Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async () => {
    // Validation
    if (!firstName.trim()) {
      Alert.alert("Missing Information", "Please enter your first name.");
      return;
    }
    if (!lastName.trim()) {
      Alert.alert("Missing Information", "Please enter your last name.");
      return;
    }
    if (!validateEmail(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Weak Password", "Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      setPendingSignupPassword(password);
      // First, sign out any existing user to ensure clean signup
      await db.auth.signOut();
      await clearStoredUserId();

      // Create the auth user
      const { data, error } = await db.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            display_name: `${firstName.trim()} ${lastName.trim()}`,
          },
        },
      });

      if (error) {
        Alert.alert("Sign Up Error", error.message);
        return;
      }

      if (data.user) {
        // Store the user ID
        await storeUserId(data.user.id);

        // Create the profile in the database with all fields
        console.log("🧾 Creating profile:", {
          id: data.user.id,
          email: email.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          display_name: `${firstName.trim()} ${lastName.trim()}`,
        });
        const profile = await createProfile({
          id: data.user.id,
          email: email.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          display_name: `${firstName.trim()} ${lastName.trim()}`,
        });

        if (!profile) {
          console.warn("⚠️ Profile creation failed, but user was created");
        } else {
          console.log("✅ Profile created:", profile.id);
        }

        // Check if email confirmation is required
        // If session is null but user exists, email confirmation is needed
        if (data.session === null && data.user) {
          // Show email verification modal
          setVerificationEmail(email.trim());
          setVerificationUserId(data.user.id);
          setShowEmailVerificationModal(true);
        } else {
          // No email confirmation required, proceed to onboarding
          router.replace({
            pathname: "/onboarding1",
            params: { userId: data.user.id },
          });
        }
      }
    } catch (err) {
      console.error("Unexpected sign up error", err);
      Alert.alert("Sign Up Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationModalClose = () => {
    setShowEmailVerificationModal(false);
    const attemptAutoSignIn = async () => {
      if (!verificationEmail || !pendingSignupPassword) {
        setMode("login");
        setEmail(verificationEmail);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await db.auth.signInWithPassword({
          email: verificationEmail,
          password: pendingSignupPassword,
        });
        if (error || !data.user) {
          setMode("login");
          setEmail(verificationEmail);
          return;
        }
        await storeUserId(data.user.id);
        router.replace({
          pathname: "/onboarding1",
          params: { userId: data.user.id, email: verificationEmail },
        });
      } finally {
        setPendingSignupPassword(null);
        setPassword("");
        setConfirmPassword("");
        setFirstName("");
        setLastName("");
        setMode("login");
        setLoading(false);
      }
    };

    attemptAutoSignIn();
  };

  const toggleMode = () => {
    setMode(mode === "login" ? "signup" : "login");
    // Clear form fields when switching
    setPassword("");
    setConfirmPassword("");
  };

  const isLoginDisabled =
    loading || email.trim().length === 0 || password.trim().length === 0;

  const isSignupDisabled =
    loading ||
    firstName.trim().length === 0 ||
    lastName.trim().length === 0 ||
    email.trim().length === 0 ||
    password.trim().length === 0 ||
    confirmPassword.trim().length === 0;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <StatusBar style="dark" />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
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

            {/* Mode toggle */}
            <View style={styles.modeToggle}>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  mode === "login" && styles.modeButtonActive,
                ]}
                onPress={() => setMode("login")}
              >
                <Text
                  style={[
                    styles.modeButtonText,
                    mode === "login" && styles.modeButtonTextActive,
                  ]}
                >
                  Sign In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  mode === "signup" && styles.modeButtonActive,
                ]}
                onPress={() => setMode("signup")}
              >
                <Text
                  style={[
                    styles.modeButtonText,
                    mode === "signup" && styles.modeButtonTextActive,
                  ]}
                >
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>

            {/* Signup fields */}
            {mode === "signup" && (
              <>
                <View style={styles.nameRow}>
                  <TextInput
                    onChangeText={setFirstName}
                    value={firstName}
                    placeholder="First Name"
                    placeholderTextColor="#999999"
                    autoCapitalize="words"
                    style={[styles.input, styles.nameInput]}
                  />
                  <TextInput
                    onChangeText={setLastName}
                    value={lastName}
                    placeholder="Last Name"
                    placeholderTextColor="#999999"
                    autoCapitalize="words"
                    style={[styles.input, styles.nameInput]}
                  />
                </View>
              </>
            )}

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
              autoCorrect={false}
              textContentType="oneTimeCode"
              autoComplete="off"
              importantForAutofill="no"
              style={styles.input}
            />

            {/* Confirm Password (signup only) */}
            {mode === "signup" && (
              <TextInput
                onChangeText={setConfirmPassword}
                value={confirmPassword}
                placeholder="Confirm Password"
                placeholderTextColor="#999999"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="oneTimeCode"
                autoComplete="off"
                importantForAutofill="no"
                style={styles.input}
              />
            )}

            {/* Button */}
            <View style={styles.buttonContainer}>
              {mode === "login" ? (
                <TouchableOpacity
                  onPress={signInWithEmail}
                  disabled={isLoginDisabled}
                  style={[
                    styles.button,
                    isLoginDisabled && styles.buttonDisabledBackground,
                  ]}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text
                      style={[
                        styles.buttonText,
                        isLoginDisabled && styles.buttonTextDisabled,
                      ]}
                    >
                      Sign In
                    </Text>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={signUpWithEmail}
                  disabled={isSignupDisabled}
                  style={[
                    styles.button,
                    isSignupDisabled && styles.buttonDisabledBackground,
                  ]}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text
                      style={[
                        styles.buttonText,
                        isSignupDisabled && styles.buttonTextDisabled,
                      ]}
                    >
                      Create Account
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* Toggle text */}
            <TouchableOpacity onPress={toggleMode} style={styles.toggleLink}>
              <Text style={styles.toggleText}>
                {mode === "login"
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Email Verification Modal */}
        <Modal
          visible={showEmailVerificationModal}
          transparent
          animationType="fade"
          onRequestClose={handleVerificationModalClose}
        >
          <TouchableWithoutFeedback onPress={handleVerificationModalClose}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.modalContent}>
                  <View style={styles.modalIconContainer}>
                    <Ionicons
                      name="mail-outline"
                      size={60}
                      color={ACCENT_RED}
                    />
                  </View>

                  <Text style={styles.modalTitle}>Check Your Email</Text>

                  <Text style={styles.modalMessage}>
                    We've sent a verification link to:
                  </Text>
                  <Text style={styles.modalEmail}>{verificationEmail}</Text>

                  <Text style={styles.modalInstructions}>
                    Please click the link in your email to verify your account,
                    then come back and sign in.
                  </Text>

                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={handleVerificationModalClose}
                  >
                    <Text style={styles.modalButtonText}>Got it!</Text>
                  </TouchableOpacity>

                  <Text style={styles.modalNote}>
                    Didn't receive the email? Check your spam folder or try
                    signing up again.
                  </Text>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  inner: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
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
  modeToggle: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    padding: 4,
    marginBottom: 24,
    width: "100%",
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modeButtonActive: {
    backgroundColor: ACCENT_RED,
  },
  modeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666666",
  },
  modeButtonTextActive: {
    color: "#ffffff",
  },
  nameRow: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
  },
  nameInput: {
    flex: 1,
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
    paddingVertical: 14,
    borderRadius: 999,
    width: "100%",
    alignItems: "center",
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
  toggleLink: {
    marginTop: 20,
    padding: 8,
  },
  toggleText: {
    color: ACCENT_RED,
    fontSize: 14,
    fontWeight: "500",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 32,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  modalIconContainer: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: "#FFF5F5",
    borderRadius: 50,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 16,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 8,
  },
  modalEmail: {
    fontSize: 16,
    fontWeight: "600",
    color: ACCENT_RED,
    textAlign: "center",
    marginBottom: 16,
  },
  modalInstructions: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  modalButton: {
    backgroundColor: ACCENT_RED,
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 40,
    width: "100%",
    alignItems: "center",
    marginBottom: 16,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  modalNote: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    lineHeight: 18,
  },
});
