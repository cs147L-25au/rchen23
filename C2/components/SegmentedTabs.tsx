import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type TabItem = {
  key: string;
  label: string;
};

type SegmentedTabsProps = {
  tabs: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
};

const SegmentedTabs: React.FC<SegmentedTabsProps> = ({
  tabs,
  activeKey,
  onChange,
}) => {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;
        return (
          <Pressable
            key={tab.key}
            style={styles.tab}
            onPress={() => onChange(tab.key)}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {tab.label}
            </Text>
            <View
              style={[styles.underline, isActive && styles.underlineActive]}
            />
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e6e6e6",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
  },
  label: {
    fontSize: 14,
    color: "#777",
    fontWeight: "600",
    fontFamily: "DM Sans",
  },
  labelActive: {
    color: "#0f4c5c",
  },
  underline: {
    marginTop: 6,
    height: 2,
    width: "60%",
    backgroundColor: "transparent",
    borderRadius: 2,
  },
  underlineActive: {
    backgroundColor: "#0f4c5c",
  },
});

export default SegmentedTabs;
