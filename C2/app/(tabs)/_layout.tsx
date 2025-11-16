import { Stack } from "expo-router";

export default function TabsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* home/feed */}
      <Stack.Screen name="index" />

      {/* list page */}
      <Stack.Screen name="list" />

      {/* non-interactive pages */}
      <Stack.Screen name="search" />
      <Stack.Screen name="leaderboard" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}
