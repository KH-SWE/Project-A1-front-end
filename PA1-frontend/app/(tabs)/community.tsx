import React, { useEffect, useState } from "react";
import { ScrollView, Text, View, Image, ActivityIndicator, Alert, Pressable, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../lib/api";

import DefaultAvatar from "@/assets/profile/default-avatar.png";


export default function CommunityScreen() {
	const insets = useSafeAreaInsets();

	const [clubs, setClubs] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [refreshing, setRefreshing] = useState(false);

	const fetchClubs = async () => {
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
	};

	useEffect(() => {
		fetchClubs();
	}, []);

	const onRefresh = async () => {
		setRefreshing(true);
		await fetchClubs();
		setRefreshing(false);
	};
	return (
		<ScrollView
			className="bg-backgroundLight w-full"
			contentContainerStyle={{
				paddingTop: 8 + (insets.top || 0),
				paddingBottom: 32,
				paddingHorizontal: 20,
			}}
			refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} progressViewOffset={8 + (insets.top || 0)} />}
		>
			{/* Title */}
			<View style={{ marginBottom: 12 }}>
				<Text className="text-4xl text-left font-inter-black">community</Text>
			</View>

			{loading ? (
				<View style={{ alignItems: "center", marginTop: 24 }}>
					<ActivityIndicator size="large" />
				</View>
			) : (
				<View style={{ width: "100%", gap: 12 }}>
					{clubs.map((c) => (
						<Pressable
							key={c.id}
							style={{
								flexDirection: "row",
								alignItems: "center",
								padding: 12,
								backgroundColor: "#fff",
								borderRadius: 12,
								borderWidth: 1,
								borderColor: "#e5e7eb",
							}}
						>
							<Image
								source={c.avatar_url ? { uri: String(c.avatar_url) } : DefaultAvatar}
								style={{ width: 56, height: 56, borderRadius: 10, marginRight: 12, backgroundColor: "#f3f4f6" }}
							/>
							<View style={{ flex: 1 }}>
								<Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 4 }}>{c.name}</Text>
								<Text numberOfLines={2} style={{ color: "#6b7280" }}>{c.description || ""}</Text>
							</View>
							<View style={{ marginLeft: 8, alignItems: "flex-end" }}>
								<Text style={{ fontSize: 12, color: "#6b7280" }}>{c.member_count ?? 0} members</Text>
								{c.is_verified ? (
									<Text style={{ fontSize: 12, color: "#059669", marginTop: 6 }}>Verified</Text>
								) : null}
							</View>
						</Pressable>
					))}
				</View>
			)}

			<View style={{ height: insets.bottom }} />
		</ScrollView>
	);
}
