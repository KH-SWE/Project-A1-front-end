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
import { api } from "../lib/api";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height } = Dimensions.get("window");

export default function LoginScreen() {
	const insets = useSafeAreaInsets();
	const bottomOffset = height * 0.04 + insets.bottom;

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
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

		setLoading(true);
		try {
			// NOTE: when testing on a physical device using Expo Go, replace API_BASE in app/lib/api.ts
			// with your machine LAN IP (e.g. http://192.168.1.10:3000) so the device can reach your backend.
			const res = await api.post('/api/auth/login', { email: email.trim(), password });
			const data = res.data || {};
			// backend returns { user: { id, username, email }, accessToken, refreshToken }
			const rawId = data?.user?.id ?? data?.userId ?? data?.id;
			let uid: number | string | undefined = undefined;
			if (typeof rawId === 'number') {
				uid = rawId;
			} else if (typeof rawId === 'string' && rawId.trim() !== '') {
				const parsed = Number(rawId);
				if (Number.isFinite(parsed)) uid = parsed;
			}
			if (uid === undefined) {
				console.warn('login: server did not return numeric user id', data);
				Alert.alert('Login error', 'Server did not return a valid user id.');
				return;
			}

			// pass tokens (if returned) to AuthProvider so they are persisted
			await login(uid, { accessToken: data.accessToken, refreshToken: data.refreshToken });
			router.replace("/(tabs)/community" as any);
		} catch (err: any) {
			console.warn('login error', err);
			const message = err?.response?.data?.message || err.message || 'Login failed';
			Alert.alert('Login error', message);
		} finally {
			setLoading(false);
		}
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
						disabled={loading}
						className="bg-secondary px-6 py-5 rounded-3xl mb-3 w-11/12 items-center"
						style={{
							shadowColor: "#000",
							shadowOffset: { width: 0, height: 4 },
							shadowOpacity: 0.25,
							shadowRadius: 6,
							elevation: 6,
							opacity: loading ? 0.6 : 1,
						}}
					>
						<Text className="text-black font-inter-bold text-center">{loading ? 'loading...' : 'continue'}</Text>
					</Pressable>

					<Pressable
						onPress={() => router.back()}
						className="px-6 py-5 rounded-3xl w-11/12 items-center"
					>
						<Text className="text-black font-inter-regular text-center underline">back</Text>
					</Pressable>
				</View>
			</View>
		</View>
	);
}
