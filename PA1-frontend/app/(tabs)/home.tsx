import { Text, ScrollView } from "react-native";
import "react-native-gesture-handler";

export default function HomeScreen() {
	return (
		<ScrollView 
			className="flex-1 bg-primary"
			contentContainerStyle={{ 
				flexGrow: 1, 
				alignItems: "center", 
				justifyContent: "center" 
			}}
		>
			<Text>Home</Text>
			<Text className="text-primary font-bold">Hello!</Text>
		</ScrollView>
	);
}
