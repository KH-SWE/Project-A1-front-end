import { View, Text } from "react-native";

export default function ProfileScreen() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>Profile</Text>
      <Text className="text-primary font-bold">Hello!</Text>
    </View>
  );
}