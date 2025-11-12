import "../global.css"; // Import CSS first
import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import React, { useEffect } from "react";

import { Text, TextInput, View, ActivityIndicator } from "react-native";
import {
	useFonts,
	Inter_300Light,
	Inter_400Regular,
	Inter_500Medium,
	Inter_600SemiBold,
	Inter_700Bold,
	Inter_800ExtraBold,
	Inter_900Black,
} from "@expo-google-fonts/inter";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
// (View and ActivityIndicator are imported above together with Text/TextInput)

// Import global CSS - this must be imported to enable NativeWind

export const unstable_settings = {
	anchor: "(tabs)",
};

function RootController() {
	const { userId, loading } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (loading) return;
		if (userId) router.replace("/(tabs)/community" as any);
		else router.replace("/welcome" as any);
	}, [userId, loading, router]);

	if (loading) {
		return (
			<View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
				<ActivityIndicator size="large" />
			</View>
		);
	}

	return null;
}

export default function RootLayout() {
	const colorScheme = useColorScheme();
	const [fontsLoaded] = useFonts({
		Inter_300Light,
		Inter_400Regular,
		Inter_500Medium,
		Inter_600SemiBold,
		Inter_700Bold,
		Inter_800ExtraBold,
		Inter_900Black,
	});

	if (!fontsLoaded) {
		return (
			<View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
				<ActivityIndicator size="large" />
			</View>
		);
	}

	if (!(global as any).__interFontApplied) {
		const defaultFont = "Inter_400Regular"; // exact name you loaded
		(Text as any).defaultProps = (Text as any).defaultProps || {};
		(Text as any).defaultProps.style = {
			...((Text as any).defaultProps.style || {}),
			fontFamily: defaultFont,
		};
		(TextInput as any).defaultProps = (TextInput as any).defaultProps || {};
		(TextInput as any).defaultProps.style = {
			...((TextInput as any).defaultProps.style || {}),
			fontFamily: defaultFont,
		};
		(global as any).__interFontApplied = true;
	}

	return (
		<AuthProvider>
			<ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
				<RootController />
				<Stack>
					<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
					<Stack.Screen name="welcome" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)/signup" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
					<Stack.Screen
						name="modal"
						options={{ presentation: "modal", title: "Modal" }}
					/>
				</Stack>
				<StatusBar style="auto" />
			</ThemeProvider>
		</AuthProvider>
	);
}
