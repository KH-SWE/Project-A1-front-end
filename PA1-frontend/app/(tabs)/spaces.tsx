import { ScrollView, Text, View } from "react-native";

export default function SpacesScreen() {
  return (
    <ScrollView 
      className="flex-1 bg-red-500"
      contentContainerStyle={{ 
        flexGrow: 1, 
        alignItems: "center", 
        justifyContent: "center" 
      }}
    >
      <Text className="text-white text-xl font-bold">If this is red, NativeWind works ✅</Text>
      <View className="w-20 h-20 bg-blue-500 mt-4 rounded-lg"></View>
      <Text className="text-black bg-yellow-300 p-2 mt-2">More test styling</Text>
    </ScrollView>
  );
}