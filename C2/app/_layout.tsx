// app/_layout.tsx
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* Index handles auth gate, redirects to appropriate screen */}
        <Stack.Screen name="index" options={{ headerShown: false }} />

        {/* Auth screen (login/signup) */}
        <Stack.Screen name="auth" options={{ headerShown: false }} />

        {/* Onboarding screens */}
        <Stack.Screen
          name="onboarding1"
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen name="onboarding2" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding3" options={{ headerShown: false }} />

        {/* Main tab navigator */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* User profile screen */}
        <Stack.Screen name="user" options={{ headerShown: false }} />
      </Stack>

      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
