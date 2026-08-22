import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import { Platform, StyleSheet, View, type ColorValue } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { tabBarContentHeight } from "@/constants/spacing";
import { minTouchTarget } from "@/constants/typography";
import { useTheme } from "@/hooks/use-theme";

type TabIconName = ComponentProps<typeof Ionicons>["name"];

const ICON_SIZE = 22;

type TabIconProps = {
  name: TabIconName;
  color: ColorValue;
  focused: boolean;
  emphasized?: boolean;
};

function TabIcon({ name, color, focused, emphasized }: TabIconProps) {
  const theme = useTheme();
  const iconName = focused
    ? (name.replace("-outline", "") as TabIconName)
    : name;

  if (emphasized) {
    return (
      <View
        style={[
          styles.addIconWrap,
          {
            backgroundColor: focused ? theme.primary : theme.surfaceMuted,
          },
        ]}
      >
        <Ionicons
          name="add"
          size={ICON_SIZE}
          color={focused ? theme.textOnPrimary : theme.tabBarAdd}
        />
      </View>
    );
  }

  return <Ionicons name={iconName} size={ICON_SIZE} color={color} />;
}

export default function TabLayout() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = tabBarContentHeight + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.tabBarActive,
        tabBarInactiveTintColor: theme.tabBarInactive,
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopColor: theme.tabBarBorder,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: tabBarHeight,
          paddingTop: spacingTop,
          paddingBottom: Math.max(insets.bottom, Platform.OS === "ios" ? 2 : 4),
        },
        tabBarItemStyle: {
          minHeight: minTouchTarget,
          paddingVertical: 2,
        },
        tabBarLabelStyle: styles.tabLabel,
        tabBarAllowFontScaling: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarAccessibilityLabel: "Home tab",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="home-outline" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="reminders"
        options={{
          title: "Reminders",
          tabBarAccessibilityLabel: "Reminders tab",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="list-outline" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: "Add",
          tabBarAccessibilityLabel: "Add reminder tab",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name="add-circle-outline"
              color={color}
              focused={focused}
              emphasized
            />
          ),
        }}
      />
      <Tabs.Screen
        name="trips"
        options={{
          title: "Trips",
          tabBarAccessibilityLabel: "Trips tab",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="airplane-outline" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarAccessibilityLabel: "Profile and settings tab",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="leaf-outline" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const spacingTop = Platform.select({ ios: 4, default: 4 });

const styles = StyleSheet.create({
  tabLabel: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
  },
  addIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 1,
  },
});
