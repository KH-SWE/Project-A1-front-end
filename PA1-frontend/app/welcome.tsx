import React from "react";
import { View, Text, Pressable, StyleSheet, Image, Dimensions } from "react-native";
import LottieView from "lottie-react-native";
import { Link } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height } = Dimensions.get("window");

export default function Welcome() {
    const insets = useSafeAreaInsets();
    const bottomOffset = height * 0.04 + insets.bottom;

	return (
		<View
			style={StyleSheet.absoluteFill}
			className="bg-backgroundLight"
		>
			{/* Background animation */}
			<LottieView
				source={require("@/assets/animations/gradient-bg.json")}
				autoPlay
				loop
				style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
			/>
            
			{/* Overlay content */}
			<View
				style={{
					...StyleSheet.absoluteFillObject,
                    width: "100%",
					alignItems: "center",
					justifyContent: "flex-end",
					paddingHorizontal: 36,
                    paddingBottom: bottomOffset
				}}
			>
				{/* Mascot + Text block (left-aligned) */}
				<View
					style={{
						width: "100%",
						alignItems: "flex-start", // left align
						marginBottom: 32,
					}}
				>
                    <Image
						source={require("@/assets/mascot/mascot-waving-standing.png")}
						style={{
							width: 125,
							height: 125,
							resizeMode: "contain",
                            marginBottom: 16
						}}
					/>

					<Text className="text-xl font-inter-regular mb-1">welcome to</Text>
					<Text className="text-6xl font-inter-black mb-4">
						the ultimate UofC campus hub
					</Text>
				</View>

				{/* 🧩 Buttons (center-aligned) */}
				<View style={{ alignItems: "center", width: "100%" }}>
					<Link href="/(auth)/signup" asChild>
						<Pressable
							className="bg-secondary px-6 py-5 rounded-3xl mb-3 w-11/12 items-center"
							style={{
								// 👇 iOS shadow
								shadowColor: "#000",
								shadowOffset: { width: 0, height: 4 },
								shadowOpacity: 0.25,
								shadowRadius: 6,
								// 👇 Android shadow
								elevation: 6,
							}}
						>
							<Text className="text-black font-inter-bold text-center">
								sign up
							</Text>
						</Pressable>
					</Link>

					<Link href="/(auth)/login" asChild>
						<Pressable className="px-6 py-5 rounded-3xl w-11/12 items-center">
							<Text className="text-black font-inter-bold text-center">
								log in
							</Text>
						</Pressable>
					</Link>
				</View>
			</View>
		</View>
	);
}
