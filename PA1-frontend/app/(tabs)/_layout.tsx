import { Tabs } from "expo-router";
import CustomTabBar from "@/components/CustomTabBar";

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />} // 👈 use your custom bar
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen 
        name="index" 
        options={{ 
          href: null, // This hides the tab from the tab bar
        }} 
      />
  <Tabs.Screen name="community" options={{ title: "Community" }} />
  <Tabs.Screen name="spaces" options={{ title: "Spaces" }} />
  <Tabs.Screen name="search" options={{ title: "Search" }} />
  <Tabs.Screen name="resources" options={{ title: "Resources" }} />
  <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
