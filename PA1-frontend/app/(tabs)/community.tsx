import React, { useCallback, useEffect, useState } from "react";
import {
	ScrollView,
	Text,
	View,
	ActivityIndicator,
	Alert,
	Pressable,
	RefreshControl,
	useWindowDimensions,
	ImageBackground,
	NativeSyntheticEvent,
	NativeScrollEvent,
} from "react-native";
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withSpring,
} from "react-native-reanimated";
import { colors } from "../../constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../lib/api";
import { useAuth } from "@/components/AuthProvider";
import { shadows } from "@/constants/shadows";

import DefaultAvatar from "@/assets/profile/default-avatar.png";
import { LinearGradient } from "expo-linear-gradient";

type PillBarProps = {
	categories: string[];
	selectedCategory: string | null;
	onSelectCategory: (c: string) => void;
};

function CategoryPillBar({
	categories,
	selectedCategory,
	onSelectCategory,
}: PillBarProps) {
	const { width: windowWidth } = useWindowDimensions();
	const tabHeight = 44;
	const count = Math.max(1, categories.length);

	// account for ScrollView horizontal padding (20 left + 20 right) so pills fit nicely
	const horizontalPadding = 40;
	const availableWidth = Math.max(200, windowWidth - horizontalPadding);

	const minTab = 80;
	const maxTab = 160;
	let tabWidth = Math.floor(availableWidth / count);
	if (tabWidth < minTab) tabWidth = minTab;
	if (tabWidth > maxTab) tabWidth = maxTab;

	const pillWidth = tabWidth * count;

	const focusedIndex = Math.max(
		0,
		categories.findIndex((c) => c === (selectedCategory ?? categories[0]))
	);
	const translateX = useSharedValue(focusedIndex * tabWidth);

	useEffect(() => {
		translateX.value = withSpring(focusedIndex * tabWidth, {
			damping: 15,
			stiffness: 200,
			mass: 0.25,
		});
	}, [focusedIndex, translateX, tabWidth]);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: translateX.value }],
	}));

	return (
		<View style={{ width: pillWidth, height: tabHeight, alignSelf: "center" }}>
			<View
				style={{
					position: "absolute",
					left: 0,
					right: 0,
					height: tabHeight,
					justifyContent: "center",
					alignItems: "center",
				}}
			>
				<View
					style={{
						width: pillWidth,
						height: tabHeight,
						borderRadius: tabHeight / 2,
						backgroundColor: "#fff",
                        ...shadows.soft,
					}}
				/>
			</View>

			<Animated.View
				style={[
					{
						position: "absolute",
						top: 0,
						left: 0,
						width: tabWidth,
						height: tabHeight,
						borderRadius: tabHeight / 2,
						backgroundColor: colors.secondary,
                        ...shadows.soft,
					},
					animatedStyle,
				]}
			/>

						<View style={{ flexDirection: "row", height: tabHeight }}>
				{categories.map((cat) => {
					return (
						<Pressable
							key={cat}
							onPress={() => onSelectCategory(cat)}
							style={{
											width: tabWidth,
								height: tabHeight,
											justifyContent: "center",
											alignItems: "center",
											paddingHorizontal: 8,
							}}
						>
							<Text
											style={{ color: "#000", textAlign: "center" }}
								className="font-inter-bold text-sm"
											numberOfLines={1}
											ellipsizeMode="tail"
							>
								{cat}
							</Text>
						</Pressable>
					);
				})}
			</View>
		</View>
	);
}

export default function CommunityScreen() {
	const insets = useSafeAreaInsets();
	const { width: windowWidth } = useWindowDimensions();
  const { userId } = useAuth();

	const [clubs, setClubs] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const [activeTab, setActiveTab] = useState<string>("Explore");

	const fetchClubs = useCallback(async () => {
		// Only fetch when authenticated
		if (!userId) {
			setClubs([]);
			return;
		}
		setLoading(true);
		try {
			const res = await api.get("/api/clubs/");
			setClubs(res.data || []);
		} catch (e) {
			console.warn("failed to load clubs", e);
			Alert.alert("Clubs", "Failed to load clubs");
		} finally {
			setLoading(false);
		}
	}, [userId]);

	useEffect(() => {
		// Re-run when auth changes; no-op when logged out
		fetchClubs();
	}, [fetchClubs]);

	const onRefresh = async () => {
		setRefreshing(true);
		await fetchClubs();
		setRefreshing(false);
	};

	// helpers
	const chunk = (arr: any[], size: number) => {
		const out: any[] = [];
		for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
		return out;
	};

	const slides = chunk(clubs, 3); // each slide contains up to 3 clubs

	const slideWidth = Math.max(320, windowWidth - 40); // account for paddingHorizontal: 20
	const [activeSlide, setActiveSlide] = useState(0);

	const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
		const x = e.nativeEvent.contentOffset.x || 0;
		const idx = Math.round(x / slideWidth);
		setActiveSlide(idx);
	};

	return (
		<ScrollView
			className="bg-backgroundLight w-full"
			contentContainerStyle={{
				paddingTop: 8 + (insets.top || 0),
				paddingBottom: 32,
				paddingHorizontal: 20,
			}}
			refreshControl={
				<RefreshControl
					refreshing={refreshing}
					onRefresh={onRefresh}
					progressViewOffset={8 + (insets.top || 0)}
				/>
			}
		>
			{/* Title */}
			<View style={{ marginBottom: 12 }}>
				<Text className="text-4xl text-left font-inter-black">Community</Text>
			</View>

			{/* Sub-tab bar (replicates Resources CategoryPillBar) */}
			<View style={{ alignItems: "center", marginBottom: 12 }}>
				<CategoryPillBar
					categories={["Explore", "Your Clubs", "Discussions"]}
					selectedCategory={activeTab}
					onSelectCategory={(c: string) => setActiveTab(c as any)}
				/>
			</View>

			{/* Active tab content: for now only Explore is implemented */}
			{activeTab === "Explore" && (
				<View style={{ width: "100%", marginBottom: 12 }}>
					{loading ? (
						<View style={{ alignItems: "center", marginTop: 24 }}>
							<ActivityIndicator size="large" />
						</View>
					) : (
						// Carousel: horizontal paging, each page contains 3 full-width cards stacked vertically
						<View style={{ width: "100%", position: "relative" }}>
							<ScrollView
								horizontal
								pagingEnabled
								showsHorizontalScrollIndicator={false}
								style={{ width: "100%" }}
								contentContainerStyle={{ paddingBottom: 12 }}
								onMomentumScrollEnd={onMomentumScrollEnd}
							>
								{slides.length === 0 ? (
									<View style={{ width: slideWidth }}>
										<Text style={{ color: "#6b7280" }}>No clubs yet.</Text>
									</View>
								) : (
									slides.map((group, idx) => (
										<View
											key={idx}
											style={{ width: slideWidth, marginTop: 12 }}
										>
											{group.map((c: any) => (
												<Pressable key={c.id} style={{ marginBottom: 12, marginHorizontal: 6 }}>
													<View
														style={[
															shadows.medium,
															{
																borderRadius: 12,
																overflow: "visible",
																backgroundColor: "#fff",
                                                                marginHorizontal: 6,
															},
														]}
													>
														<ImageBackground
															source={
																c.banner_url
																	? { uri: String(c.banner_url) }
																	: DefaultAvatar
															}
															style={{
																width: "100%",
																height: 140,
																borderRadius: 12,
																overflow: "hidden",
																backgroundColor: "#f3f4f6",
															}}
															imageStyle={{ borderRadius: 12 }}
														>
															{/* bottom gradient using expo-linear-gradient */}
															<LinearGradient
																colors={["rgba(0,0,0,0.6)", "transparent"]}
																start={[0, 1]}
																end={[0, 0]}
																style={{
																	position: "absolute",
																	left: 0,
																	right: 0,
																	bottom: 0,
																	height: 72,
																}}
															/>

															{/* member count top-right */}
															<View
																style={{
																	position: "absolute",
																	right: 12,
																	top: 12,
																	backgroundColor: "rgba(0,0,0,0.45)",
																	paddingHorizontal: 8,
																	paddingVertical: 4,
																	borderRadius: 12,
																}}
															>
																<Text style={{ color: "#fff", fontSize: 12 }}>
																	{(c.member_count ?? 0) + " members"}
																</Text>
															</View>

															<View
																style={{
																	position: "absolute",
																	left: 12,
																	bottom: 12,
																	right: 12,
																}}
															>
																<Text
																	style={{
																		color: "#fff",
																		fontSize: 16,
																		fontWeight: "700",
																	}}
																>
																	{c.name}
																</Text>
																{c.description ? (
																	<Text
																		numberOfLines={2}
																		style={{
																			color: "#fff",
																			opacity: 0.95,
																			marginTop: 4,
																		}}
																	>
																		{c.description}
																	</Text>
																) : null}
															</View>
														</ImageBackground>
													</View>
												</Pressable>
											))}
										</View>
									))
								)}
							</ScrollView>

							{/* pagination dots */}
							<View
								style={{
									position: "absolute",
									bottom: 0,
									left: 0,
									right: 0,
									alignItems: "center",
									justifyContent: "center",
								}}
							>
								<View style={{ flexDirection: "row" }}>
									{slides.map((_, i) => (
										<View
											key={i}
											style={{
												width: 8,
												height: 8,
												borderRadius: 8,
												marginHorizontal: 4,
												backgroundColor: i === activeSlide ? "#111" : "#cfcfcf",
											}}
										/>
									))}
								</View>
							</View>
						</View>
					)}
				</View>
			)}

			{/* placeholders for other tabs */}
			{activeTab === "Your Clubs" && (
				<View style={{ paddingVertical: 20 }}>
					<Text style={{ color: "#6b7280" }}>Your clubs will appear here.</Text>
				</View>
			)}
			{activeTab === "Discussions" && (
				<View style={{ paddingVertical: 20 }}>
					<Text style={{ color: "#6b7280" }}>Discussions coming soon.</Text>
				</View>
			)}

			<View style={{ height: insets.bottom }} />
		</ScrollView>
	);
}
