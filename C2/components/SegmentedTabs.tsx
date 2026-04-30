import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "../contexts/ThemeContext";
import { ThemeColors } from "../constants/theme";

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
  const { colors: t } = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

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

const makeStyles = (t: ThemeColors) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: t.border,
      backgroundColor: t.surface,
    },
    tab: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 10,
    },
    label: {
      fontSize: 14,
      color: t.textMuted,
      fontWeight: "600",
      fontFamily: "DM Sans",
    },
    labelActive: {
      color: t.primary,
    },
    underline: {
      marginTop: 6,
      height: 2,
      width: "60%",
      backgroundColor: "transparent",
      borderRadius: 2,
    },
    underlineActive: {
      backgroundColor: t.primary,
    },
  });

export default SegmentedTabs;
