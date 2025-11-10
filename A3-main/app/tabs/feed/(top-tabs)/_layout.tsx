import {
  MaterialTopTabNavigationEventMap,
  MaterialTopTabNavigationOptions,
  createMaterialTopTabNavigator,
} from "@react-navigation/material-top-tabs";
import { withLayoutContext } from "expo-router";
import { ParamListBase, TabNavigationState } from "@react-navigation/native";
import { StyleSheet } from "react-native";
import Theme from "../../../../assets/theme";

const { Navigator } = createMaterialTopTabNavigator();

export const MaterialTopTabs = withLayoutContext<
  MaterialTopTabNavigationOptions,
  typeof Navigator,
  TabNavigationState<ParamListBase>,
  MaterialTopTabNavigationEventMap
>(Navigator);

export default function FeedTabsLayout() {
  return (
    <MaterialTopTabs
      screenOptions={{
        tabBarActiveTintColor: Theme.colors.iconHighlighted,
        tabBarInactiveTintColor: Theme.colors.textSecondary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIndicatorStyle: styles.tabBarIndicator,
      }}
    >
      <MaterialTopTabs.Screen name="new" options={{ title: "New" }} />
      <MaterialTopTabs.Screen name="top" options={{ title: "Top" }} />
    </MaterialTopTabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Theme.colors.backgroundPrimary,
  },
  tabBarLabel: {
    fontSize: 14,
    fontWeight: "400",
    textTransform: "capitalize",
  },
  tabBarIndicator: {
    backgroundColor: Theme.colors.iconHighlighted,
    height: 3,
  },
});
