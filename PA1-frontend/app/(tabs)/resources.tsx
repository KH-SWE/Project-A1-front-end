import React, { useEffect, useMemo, useState } from "react";
import {
	ScrollView,
	Text,
	View,
	ActivityIndicator,
	Pressable,
	Linking,
	Alert,
	useWindowDimensions,
	RefreshControl,
} from "react-native";
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../lib/api";
import { colors } from "../../constants/colors";
import ExternalIcon from "@/assets/icons/external.svg";
import { shadows } from "@/constants/shadows";

type ResourceRow = {
	id: number;
	resource_category: string;
	resource_name: string;
	resource_url: string;
};

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
					style={[
						shadows.soft,
						{
							width: pillWidth,
							height: tabHeight,
							borderRadius: tabHeight / 2,
							backgroundColor: "#fff",
						},
					]}
				/>
			</View>

			<Animated.View
				style={[
					shadows.soft,
					{
						position: "absolute",
						top: 0,
						left: 0,
						width: tabWidth,
						height: tabHeight,
						borderRadius: tabHeight / 2,
						backgroundColor: colors.secondary,
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
															className="font-inter-bold text-sm text-black text-center"
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

export default function ResourcesScreen() {
	const insets = useSafeAreaInsets();
	const [resources, setResources] = useState<ResourceRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

	const [refreshing, setRefreshing] = useState(false);

	const fetchResources = async () => {
		let mounted = true;
		setLoading(true);
		try {
			const res = await api.get("/api/resources/");
			if (!mounted) return;
			const data: ResourceRow[] = Array.isArray(res?.data) ? res.data : [];
			// sort by category name asc then id asc
			data.sort((a, b) => {
				const ca = (a.resource_category || "").localeCompare(
					b.resource_category || ""
				);
				if (ca !== 0) return ca;
				return (a.id ?? 0) - (b.id ?? 0);
			});
			setResources(data);
			// set initial selected category to first category (if any)
			const firstCat = data.length > 0 ? data[0].resource_category : null;
			setSelectedCategory(firstCat);
			setError(null);
		} catch (e: any) {
			console.warn("failed to load resources", e);
			setError(
				e?.response?.data?.error ?? e?.message ?? "Failed to load resources"
			);
		} finally {
			setLoading(false);
		}
		return () => {
			mounted = false;
		};
	};

	useEffect(() => {
		fetchResources();
	}, []);

	const onRefresh = async () => {
		setRefreshing(true);
		await fetchResources();
		setRefreshing(false);
	};

	const categories = useMemo(() => {
		const set = new Set<string>();
		for (const r of resources) set.add(r.resource_category || "");
		return Array.from(set).sort((a, b) => a.localeCompare(b));
	}, [resources]);

	const grouped = useMemo(() => {
		const map = new Map<string, ResourceRow[]>();
		for (const r of resources) {
			const key = r.resource_category || "";
			if (!map.has(key)) map.set(key, []);
			map.get(key)!.push(r);
		}
		// ensure each list sorted by id asc (already sorted globally, but be safe)
		for (const list of map.values()) {
			list.sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
		}
		return map;
	}, [resources]);

	const open = async (url?: string) => {
		if (!url) return;
		try {
			await Linking.openURL(url);
		} catch (e) {
			console.warn("open url failed", e);
			Alert.alert("Open link", "Failed to open link");
		}
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
				<Text className="text-4xl text-left font-inter-black">Resources</Text>
			</View>

			{loading ? (
				<View
					style={{
						alignItems: "center",
						justifyContent: "center",
						paddingVertical: 40,
					}}
				>
					<ActivityIndicator size="large" />
				</View>
			) : error ? (
				<View style={{ paddingVertical: 20 }}>
					<Text className="text-red-700 font-inter-regular text-base">{error}</Text>
				</View>
			) : (
				<View>
					{/* Category sub-tab bar (animated pill like navbar) */}
					{categories.length > 0 && (
						<View style={{ alignItems: "center", marginBottom: 12 }}>
							{/** sizes and animation set up at component scope (hooks below) */}
							<CategoryPillBar
								categories={categories}
								selectedCategory={selectedCategory}
								onSelectCategory={(c: string) => setSelectedCategory(c)}
							/>
						</View>
					)}

					{/* Resources list for selected category - 2 columns, white cards with shadow */}
					<View>
						{(() => {
							const items = selectedCategory
								? grouped.get(selectedCategory) ?? []
								: [];
							if (items.length === 0) {
								return (
									<Text className="text-gray-500 font-inter-regular text-base">
										No resources in this category.
									</Text>
								);
							}
							return (
								<View style={{ marginVertical: 8 }}>
									{items.map((r) => (
										<Pressable
											key={r.id}
											onPress={() => open(r.resource_url)}
											style={[
												shadows.soft,
												{
													width: "100%",
													backgroundColor: "#fff",
													padding: 14,
													borderRadius: 12,
													marginBottom: 12,
												},
											]}
										>
											<View
												style={{
													flexDirection: "row",
													alignItems: "center",
													justifyContent: "space-between",
												}}
											>
												<Text
													className="font-inter-medium text-lg mr-2 text-textOnBgLight"
												>
													{r.resource_name}
												</Text>
												<ExternalIcon width={20} height={20} />
											</View>
										</Pressable>
									))}
								</View>
							);
						})()}
					</View>
				</View>
			)}
		</ScrollView>
	);
}
