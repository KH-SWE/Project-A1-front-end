import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from "react-native-safe-area-context";


export default function SearchScreen() {
	const insets = useSafeAreaInsets();
	return (
		<ScrollView
			className="bg-backgroundLight w-full"
			contentContainerStyle={{
				paddingTop: 8 + (insets.top || 0),
				paddingBottom: 32,
				paddingHorizontal: 20,
			}}
		>
			{/* Title */}
			<View style={{ marginBottom: 12 }}>
				<Text className="text-4xl text-left font-inter-black">search</Text>
			</View>
			<View style={{ height: insets.bottom }} />
		</ScrollView>
	);
}
