import { ScrollView, Text } from "react-native";

export default function ClubsScreen() {
  return (
    <ScrollView 
      className="flex-1"
      contentContainerStyle={{ 
        flexGrow: 1, 
        alignItems: "center", 
        justifyContent: "center" 
      }}
    >
      <Text>Clubs</Text>
    </ScrollView>
  );
}