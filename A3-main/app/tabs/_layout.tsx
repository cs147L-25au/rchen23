import { Tabs } from "expo-router";
import { StyleSheet } from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import Theme from "../../assets/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        lazy: false,
        tabBarActiveTintColor: Theme.colors.iconPrimary,
        tabBarInactiveTintColor: Theme.colors.textSecondary,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarStyle: styles.tabBar,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          title: "Feed",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="beehive-outline"
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <Ionicons name="person" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Theme.colors.backgroundSecondary,
    borderTopColor: Theme.colors.tabBarBorder,
  },
  tabBarLabel: {
    fontSize: 12,
    color: Theme.colors.tabBarActive,
  },
});
