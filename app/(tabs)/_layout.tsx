import { Tabs } from "expo-router";
import { BottomTabBar } from "../../src/components/BottomTabBar";
export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="today"
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <BottomTabBar {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="orders" />
      <Tabs.Screen name="ai" />
      <Tabs.Screen name="stock" />
      <Tabs.Screen name="today" />
    </Tabs>
  );
}
