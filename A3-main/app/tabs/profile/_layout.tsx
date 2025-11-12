import { Stack } from "expo-router";
import { StyleSheet } from "react-native";
import Theme from "../../../assets/theme";

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: Theme.colors.textPrimary,
        headerStyle: styles.headerStyle,
        headerTitleStyle: styles.headerTitleStyle,
        headerTitleAlign: "center",
      }}
    >
      <Stack.Screen
        name="profile.index"
        options={{
          headerTitle: "My Profile",
          headerShown: true,
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  headerStyle: {
    backgroundColor: Theme.colors.backgroundSecondary,
  },
  headerTitleStyle: {
    fontWeight: "bold",
    fontSize: 18,
    color: Theme.colors.textPrimary,
  },
});
