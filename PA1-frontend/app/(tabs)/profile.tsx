import ProfileView from "@/components/ProfileView";
import { ScrollView } from "react-native";

export default function ProfileScreen() {
  return (
    <ScrollView 
      className="flex-1"
      contentContainerStyle={{ 
        flexGrow: 1, 
        alignItems: "center", 
        justifyContent: "center" 
      }}
    >
      <ProfileView />
    </ScrollView>
  );
}