import { Stack, useNavigation } from "expo-router";
import { Platform, StyleSheet, View, Text } from "react-native";
import { useEffect } from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Theme from "../../../assets/theme";

export default function FeedLayout() {
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

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
        name="feed.index"
        options={{
          headerTitle: () => (
            <View style={styles.headerTitleContainer}>
              <MaterialCommunityIcons
                name="bee"
                size={45}
                color={Theme.colors.iconHighlighted}
              />
              <Text style={styles.headerTitleText}>Fizz</Text>
            </View>
          ),
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="details"
        options={{
          headerTitle: "Comments",
          headerShown: true,
          headerBackTitle: Platform.OS === "ios" ? "Back" : undefined,
          headerLeft:
            Platform.OS === "android"
              ? () => (
                  <Ionicons
                    name="arrow-back"
                    size={24}
                    color={Theme.colors.textPrimary}
                    style={styles.headerBackIcon}
                  />
                )
              : undefined,
        }}
      />
      <Stack.Screen
        name="newpost"
        options={{
          headerTitle: "New Post",
          presentation: "modal",
          headerShadowVisible: false,
        }}
      />
    </Stack>
  );
}

// styles
const styles = StyleSheet.create({
  headerStyle: {
    backgroundColor: Theme.colors.backgroundSecondary,
  },
  headerTitleStyle: {
    fontWeight: "bold",
    fontSize: 20,
    color: Theme.colors.textPrimary,
  },
  headerIcon: {
    marginLeft: 16,
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitleText: {
    fontWeight: "bold",
    fontSize: 20,
    color: Theme.colors.textPrimary,
  },
  headerBackIcon: {
    marginLeft: 16,
  },
});
