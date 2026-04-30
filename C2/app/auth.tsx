// app/auth.tsx
import { Ionicons } from "@expo/vector-icons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
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
import {
  clearPendingSignup,
  clearStoredUserId,
  getPendingSignup,
  storePendingSignup,
  storeUserId,
} from "@/utils/auth";
import { useAppTheme } from "@/contexts/ThemeContext";
import { ThemeColors } from "@/constants/theme";

type AuthMode = "login" | "signup";

export default function AuthScreen() {
  const params = useLocalSearchParams<{ restoreForm?: string }>();
  const { colors: t, mode } = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showEmailVerificationModal, setShowEmailVerificationModal] =
    useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationUserId, setVerificationUserId] = useState<string | null>(null);
  const [pendingSignupPassword, setPendingSignupPassword] = useState<string | null>(null);

  useEffect(() => {
    if (params.restoreForm === "true") {
      setAuthMode("signup");
    }
  }, [params.restoreForm]);

  useEffect(() => {
    const checkPendingSignup = async () => {
      const pending = await getPendingSignup();
      if (!pending) return;

      console.log("🔄 Found pending signup, attempting auto sign-in...");
      setLoading(true);

      try {
        const { data, error } = await db.auth.signInWithPassword({
          email: pending.email,
          password: pending.password,
        });

        if (error || !data.user) {
          console.log("⚠️ Auto sign-in failed, user needs to sign in manually");
          await clearPendingSignup();
          setAuthMode("login");
          setEmail(pending.email);
          setLoading(false);
          return;
        }

        console.log("✅ Auto sign-in successful after email verification");
        await clearPendingSignup();
        await storeUserId(data.user.id);
        router.replace({
          pathname: "/onboarding1",
          params: { userId: data.user.id, email: pending.email },
        });
      } catch (err) {
        console.error("Auto sign-in error:", err);
        await clearPendingSignup();
        setAuthMode("login");
        setEmail(pending.email);
      } finally {
        setLoading(false);
      }
    };

    checkPendingSignup();
  }, []);

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
      await db.auth.signOut();
      await clearStoredUserId();

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
        const errorMessage = error.message.toLowerCase();
        if (
          errorMessage.includes("already registered") ||
          errorMessage.includes("already been registered") ||
          errorMessage.includes("user already exists") ||
          error.message.includes("User already registered")
        ) {
          Alert.alert(
            "Account Exists",
            "An account with this email already exists. Please sign in instead.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Sign In",
                onPress: () => {
                  setAuthMode("login");
                  setPassword("");
                  setConfirmPassword("");
                  setFirstName("");
                  setLastName("");
                },
              },
            ],
          );
        } else {
          Alert.alert("Sign Up Error", error.message);
        }
        return;
      }

      if (data.user) {
        if (data.user.identities && data.user.identities.length === 0) {
          Alert.alert(
            "Account Exists",
            "An account with this email already exists. Please sign in instead.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Sign In",
                onPress: () => {
                  setAuthMode("login");
                  setPassword("");
                  setConfirmPassword("");
                  setFirstName("");
                  setLastName("");
                },
              },
            ],
          );
          return;
        }

        await storeUserId(data.user.id);

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

        if (data.session === null && data.user) {
          await storePendingSignup({
            email: email.trim(),
            password: password,
            userId: data.user.id,
          });
          setVerificationEmail(email.trim());
          setVerificationUserId(data.user.id);
          setShowEmailVerificationModal(true);
        } else {
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
      const pending = await getPendingSignup();

      if (!pending) {
        setAuthMode("login");
        setEmail(verificationEmail);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await db.auth.signInWithPassword({
          email: pending.email,
          password: pending.password,
        });

        if (error || !data.user) {
          setAuthMode("login");
          setEmail(pending.email);
          Alert.alert(
            "Email Not Verified",
            "Please verify your email first, then sign in.",
          );
          return;
        }

        await clearPendingSignup();
        await storeUserId(data.user.id);
        router.replace({
          pathname: "/onboarding1",
          params: { userId: data.user.id, email: pending.email },
        });
      } catch (err) {
        console.error("Auto sign-in error:", err);
        setAuthMode("login");
        setEmail(pending.email);
      } finally {
        setPendingSignupPassword(null);
        setPassword("");
        setConfirmPassword("");
        setFirstName("");
        setLastName("");
        setAuthMode("login");
        setLoading(false);
      }
    };

    attemptAutoSignIn();
  };

  const toggleMode = () => {
    setAuthMode(authMode === "login" ? "signup" : "login");
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
        <StatusBar style={mode === "dark" ? "light" : "dark"} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.inner}>
            <View style={styles.splash}>
              <MaterialCommunityIcons
                size={64}
                name="movie-open-outline"
                color={t.primary}
              />
              <Text style={styles.splashText}>MyFlix</Text>
            </View>

            <View style={styles.modeToggle}>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  authMode === "login" && styles.modeButtonActive,
                ]}
                onPress={() => setAuthMode("login")}
              >
                <Text
                  style={[
                    styles.modeButtonText,
                    authMode === "login" && styles.modeButtonTextActive,
                  ]}
                >
                  Sign In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  authMode === "signup" && styles.modeButtonActive,
                ]}
                onPress={() => setAuthMode("signup")}
              >
                <Text
                  style={[
                    styles.modeButtonText,
                    authMode === "signup" && styles.modeButtonTextActive,
                  ]}
                >
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>

            {authMode === "signup" && (
              <>
                <View style={styles.nameRow}>
                  <TextInput
                    onChangeText={setFirstName}
                    value={firstName}
                    placeholder="First Name"
                    placeholderTextColor={t.placeholder}
                    autoCapitalize="words"
                    style={[styles.input, styles.nameInput]}
                  />
                  <TextInput
                    onChangeText={setLastName}
                    value={lastName}
                    placeholder="Last Name"
                    placeholderTextColor={t.placeholder}
                    autoCapitalize="words"
                    style={[styles.input, styles.nameInput]}
                  />
                </View>
              </>
            )}

            <TextInput
              onChangeText={setEmail}
              value={email}
              placeholder="email@address.com"
              placeholderTextColor={t.placeholder}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />

            <TextInput
              onChangeText={setPassword}
              value={password}
              placeholder="Password"
              placeholderTextColor={t.placeholder}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="oneTimeCode"
              autoComplete="off"
              importantForAutofill="no"
              style={styles.input}
            />

            {authMode === "signup" && (
              <TextInput
                onChangeText={setConfirmPassword}
                value={confirmPassword}
                placeholder="Confirm Password"
                placeholderTextColor={t.placeholder}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="oneTimeCode"
                autoComplete="off"
                importantForAutofill="no"
                style={styles.input}
              />
            )}

            <View style={styles.buttonContainer}>
              {authMode === "login" ? (
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

            <TouchableOpacity onPress={toggleMode} style={styles.toggleLink}>
              <Text style={styles.toggleText}>
                {authMode === "login"
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

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
                      color={t.primary}
                    />
                  </View>

                  <Text style={styles.modalTitle}>Check Your Email</Text>

                  <Text style={styles.modalMessage}>
                    We've sent a verification link to:
                  </Text>
                  <Text style={styles.modalEmail}>{verificationEmail}</Text>

                  <Text style={styles.modalInstructions}>
                    Please click the link in your email to verify your account,
                    then come back and finish your profile. You may see a "form
                    not submitted" or access error page after clicking the link
                    — that's expected. Your account will still be verified
                    automatically.
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

const makeStyles = (t: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.background,
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
      color: t.primary,
      fontSize: 40,
      marginTop: 8,
    },
    modeToggle: {
      flexDirection: "row",
      backgroundColor: t.surface,
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
      backgroundColor: t.primary,
    },
    modeButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: t.textMuted,
    },
    modeButtonTextActive: {
      color: "#FFFFFF",
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
      color: t.textPrimary,
      backgroundColor: t.inputBackground,
      width: "100%",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 10,
      fontSize: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: t.inputBorder,
    },
    buttonContainer: {
      marginTop: 16,
      width: "100%",
      alignItems: "center",
    },
    button: {
      backgroundColor: t.primary,
      paddingHorizontal: 32,
      paddingVertical: 14,
      borderRadius: 999,
      width: "100%",
      alignItems: "center",
    },
    buttonDisabledBackground: {
      backgroundColor: t.disabled,
    },
    buttonText: {
      color: "#FFFFFF",
      fontSize: 17,
      fontWeight: "600",
    },
    buttonTextDisabled: {
      color: t.disabledText,
    },
    toggleLink: {
      marginTop: 20,
      padding: 8,
    },
    toggleText: {
      color: t.primary,
      fontSize: 14,
      fontWeight: "500",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: t.overlay,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    modalContent: {
      backgroundColor: t.modalBackground,
      borderRadius: 24,
      padding: 32,
      width: "100%",
      maxWidth: 400,
      alignItems: "center",
    },
    modalIconContainer: {
      marginBottom: 20,
      padding: 16,
      backgroundColor: t.primarySubtle,
      borderRadius: 50,
    },
    modalTitle: {
      fontSize: 24,
      fontWeight: "700",
      color: t.textPrimary,
      marginBottom: 16,
      textAlign: "center",
    },
    modalMessage: {
      fontSize: 16,
      color: t.textSecondary,
      textAlign: "center",
      marginBottom: 8,
    },
    modalEmail: {
      fontSize: 16,
      fontWeight: "600",
      color: t.primary,
      textAlign: "center",
      marginBottom: 16,
    },
    modalInstructions: {
      fontSize: 14,
      color: t.textSecondary,
      textAlign: "center",
      lineHeight: 20,
      marginBottom: 24,
    },
    modalButton: {
      backgroundColor: t.primary,
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
      color: "#FFFFFF",
    },
    modalNote: {
      fontSize: 12,
      color: t.textMuted,
      textAlign: "center",
      lineHeight: 18,
    },
  });
