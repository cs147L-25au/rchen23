import { Stack, useNavigation } from "expo-router";
import { StyleSheet } from "react-native";
import { useEffect } from "react";

export default function FeedLayout() {
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  return (
    <Stack>
      <Stack.Screen
        name="feed.index"
        options={{ headerTitle: "Fizz", headerShown: true }}
      />
      <Stack.Screen
        name="details"
        options={{
          headerTitle: "Comments",
          headerBackTitle: "Back",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="newpost"
        options={{ headerTitle: "New Post", presentation: "modal" }}
      />
    </Stack>
  );
}

// TODO: Create styles for your layout here
const styles = StyleSheet.create({});
