import React, { useState } from "react";
import {
	View,
	Text,
	TextInput,
	Pressable,
	StyleSheet,
	Dimensions,
	Alert,
	ScrollView,
} from "react-native";
import LottieView from "lottie-react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/components/AuthProvider";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height } = Dimensions.get("window");

export default function LoginScreen() {
	const insets = useSafeAreaInsets();
	const bottomOffset = height * 0.04 + insets.bottom;

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const { login } = useAuth();
	const router = useRouter();

	const submit = async () => {
		// basic validation
		if (!email?.trim()) {
			Alert.alert("Please enter your email.");
			return;
		}
		if (!password) {
			Alert.alert("Please enter your password.");
			return;
		}

		// TODO: replace with real authentication call
		const uid = email.trim();
		await login(uid);
		router.replace("/(tabs)/home" as any);
	};

	return (
		<View style={StyleSheet.absoluteFill} className="bg-backgroundLight">
			{/* Background animation */}
			<LottieView
				source={require("@/assets/animations/gradient-bg.json")}
				autoPlay
				loop
				style={{ width: "100%", height: "100%" }}
				resizeMode="cover"
			/>

			{/* Overlay content using simple flex layout; inputs placed higher, buttons fixed at bottom */}
			<View
				style={{
					...StyleSheet.absoluteFillObject,
					width: "100%",
					flexDirection: "column",
					paddingHorizontal: 36,
					justifyContent: "flex-start",
				}}
			>
				{/* Top container: smaller so inputs sit higher on screen */}
				<View style={{ flex: 0.3, justifyContent: 'center', alignItems: 'center', paddingTop: insets.top + 12 }}>
					<Text className="text-6xl font-inter-light">log in</Text>
				</View>

				{/* Middle: inputs (kept scrollable just in case) */}
				<View style={{ flex: 0.5 }}>
					<ScrollView
						contentContainerStyle={{ width: '100%', alignItems: 'center', paddingTop: 8 }}
						keyboardShouldPersistTaps="handled"
					>
						<TextInput
							value={email}
							onChangeText={setEmail}
							placeholder="email"
							keyboardType="email-address"
							autoCapitalize="none"
							className="bg-white px-6 py-5 rounded-3xl font-inter-regular mb-3 mt-4 w-11/12"
							style={{
								shadowColor: "#000",
								shadowOffset: { width: 0, height: 4 },
								shadowOpacity: 0.25,
								shadowRadius: 6,
								elevation: 6,
							}}
						/>

						<TextInput
							value={password}
							onChangeText={setPassword}
							placeholder="password"
							secureTextEntry
							className="bg-white px-6 py-5 rounded-3xl font-inter-regular mb-3 w-11/12"
							style={{
								shadowColor: "#000",
								shadowOffset: { width: 0, height: 4 },
								shadowOpacity: 0.25,
								shadowRadius: 6,
								elevation: 6,
							}}
						/>
					</ScrollView>
				</View>

				{/* Fixed bottom buttons: keep positioned at bottomOffset above screen bottom */}
				<View
					style={{
						position: 'absolute',
						left: 36,
						right: 36,
						bottom: bottomOffset,
						alignItems: 'center',
					}}
				>
					<Pressable
						onPress={submit}
						className="bg-secondary px-6 py-5 rounded-3xl mb-3 w-11/12 items-center"
						style={{
							shadowColor: "#000",
							shadowOffset: { width: 0, height: 4 },
							shadowOpacity: 0.25,
							shadowRadius: 6,
							elevation: 6,
						}}
					>
						<Text className="text-black font-inter-bold text-center">continue</Text>
					</Pressable>

					<Pressable
						onPress={() => router.back()}
						className="px-6 py-5 rounded-3xl w-11/12 items-center"
					>
						<Text className="text-black font-inter-bold text-center">go back</Text>
					</Pressable>
				</View>
			</View>
		</View>
	);
}
