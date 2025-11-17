import React, { useCallback, useEffect, useState } from "react";
import {
	View,
	Text,
	ScrollView,
	ActivityIndicator,
	RefreshControl,
	Image,
	ImageBackground,
	Alert,
	Linking,
	Pressable,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../lib/api";
import { LinearGradient } from "expo-linear-gradient";
import DefaultAvatar from "@/assets/profile/default-avatar.png";
import SocialRow from "@/components/SocialRow";
import { Ionicons } from "@expo/vector-icons";
import { shadows } from "@/constants/shadows";

type Club = {
	id: number;
	name: string;
	description?: string;
	avatar_url?: string;
	banner_url?: string;
	is_verified?: boolean;
	created_at?: string;
	website_url?: string;
	instagram_url?: string;
	discord_url?: string;
	tiktok_url?: string;
	linkedin_url?: string;
	twitter_url?: string;
	tags?: string[];
	member_count?: number;
	admins?: { user_id: number; role: string }[];
	my_role?: string | null;
};

export default function ClubDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const insets = useSafeAreaInsets();
	const router = useRouter();

	const [loading, setLoading] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const [club, setClub] = useState<Club | null>(null);

	const loadClub = useCallback(async () => {
		if (!id) return;
		setLoading(true);
		try {
			const res = await api.get(`/api/clubs/${id}`);
			setClub(res?.data || null);
		} catch (e: any) {
			console.warn("load club failed", e?.response?.data || e?.message || e);
			Alert.alert("Club", "Failed to load club details");
		} finally {
			setLoading(false);
		}
	}, [id]);

	useEffect(() => {
		loadClub();
	}, [loadClub]);

	const onRefresh = async () => {
		setRefreshing(true);
		await loadClub();
		setRefreshing(false);
	};

	const bannerUri = club?.banner_url && String(club.banner_url).trim().length > 0 ? String(club.banner_url).trim() : undefined;
	const avatarUri = club?.avatar_url && String(club.avatar_url).trim().length > 0 ? String(club.avatar_url).trim() : undefined;

	return (
		<ScrollView
			className="bg-backgroundLight w-full"
			contentContainerStyle={{ paddingTop: 0, paddingBottom: 24 + (insets.bottom || 0) }}
			refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
		>
			{/* Back button */}
			<View style={{ position: "absolute", top: (insets.top || 0) + 8, left: 12, zIndex: 50 }}>
				<Pressable
					onPress={() => router.back()}
					style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: "rgba(255,255,255,1)", alignItems: "center", justifyContent: "center" }}
					accessibilityRole="button"
					accessibilityLabel="Go back"
				>
					<Ionicons name="chevron-back" size={22} color="#000" />
				</Pressable>
			</View>

			{loading && !club ? (
				<View style={{ paddingVertical: 40, alignItems: "center" }}>
					<ActivityIndicator size="large" />
				</View>
			) : club ? (
				<View>
					{/* Banner fills top (under notch) */}
					<View style={{ width: "100%", height: 220, marginBottom: 12 }}>
						<ImageBackground source={bannerUri ? { uri: bannerUri } : DefaultAvatar} style={{ flex: 1 }} imageStyle={{ resizeMode: "cover" }}>
							<LinearGradient colors={["rgba(0,0,0,0.6)", "transparent"]} start={[0, 1]} end={[0, 0]} style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 96 }} />

							{/* member count */}
											<View style={{ position: "absolute", right: 12, top: 12, backgroundColor: "rgba(0,0,0,0.45)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
												<Text className="text-white text-xs font-inter-medium">{(club.member_count ?? 0) + " members"}</Text>
							</View>

							{/* Avatar + Name inside banner at bottom-left */}
							<View style={{ position: "absolute", left: 16, bottom: 12, right: 16, flexDirection: "row", alignItems: "center" }}>
								<Image source={avatarUri ? { uri: avatarUri } : DefaultAvatar} style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: "#f3f4f6" }} />
												<View style={{ marginLeft: 12, flex: 1 }}>
													<Text className="text-white text-2xl font-inter-extrabold" numberOfLines={1}>
										{club.name}
									</Text>
									{club.is_verified ? (
														<View style={{ marginTop: 4, alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.25)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
															<Text className="text-white text-xs font-inter-medium">Verified</Text>
										</View>
									) : null}
								</View>
							</View>
						</ImageBackground>
					</View>

					{/* Info */}
					<View style={{ paddingHorizontal: 20 }}>
										{club.description ? <Text className="text-textOnBgLight mb-3 font-inter-regular text-base">{club.description}</Text> : null}

						{/* Tags */}
						{Array.isArray(club.tags) && club.tags.length > 0 ? (
											<View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12, ...shadows.soft }}>
								{club.tags.map((t, idx) => (
									<View key={idx} style={{ backgroundColor: "#F3F4F6", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 }}>
														<Text className="text-gray-700 text-xs font-inter-medium">#{t}</Text>
									</View>
								))}
							</View>
						) : null}

						{/* Socials */}
						<SocialRow
							websiteUrl={club.website_url}
							instagramUrl={club.instagram_url}
							linkedinUrl={club.linkedin_url}
							twitterUrl={club.twitter_url}
							discordUrl={club.discord_url}
							tiktokUrl={club.tiktok_url}
							onOpenUrl={async (url?: string) => {
								if (!url) return;
								try {
									await Linking.openURL(url);
								} catch (e) {
									console.warn("open url failed", e);
								}
							}}
						/>

						{/* Admins */}
									{Array.isArray(club.admins) && club.admins.length > 0 ? (
							<View style={{ marginTop: 12 }}>
											<Text className="font-inter-bold mb-1.5 text-base">Admins</Text>
								{club.admins.map((a) => (
												<Text key={`${a.user_id}-${a.role}`} className="text-gray-700 font-inter-regular text-base">
										{a.role} · User #{a.user_id}
									</Text>
								))}
							</View>
						) : null}

						{/* My role */}
									{club.my_role ? (
							<View style={{ marginTop: 12 }}>
											<Text className="text-gray-500 font-inter-regular text-base">Your role: {club.my_role}</Text>
							</View>
						) : null}
					</View>
				</View>
			) : (
				<View style={{ paddingVertical: 40, alignItems: "center" }}>
								<Text className="text-gray-500 font-inter-regular text-base">Club not found.</Text>
				</View>
			)}
		</ScrollView>
	);
}

