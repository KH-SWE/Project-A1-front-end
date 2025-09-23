import { Text, View } from "react-native";
import "react-native-gesture-handler";

export default function HomeScreen() {
	return (
		<View style={{ flex: 1, alignItems: "center", justifyContent: "center" }} className="bg-primary">
			<Text>Home</Text>
			<Text className="text-primary font-bold">Hello!</Text>
		</View>
	);
}
