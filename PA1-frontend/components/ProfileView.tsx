import React, { useEffect, useState, useMemo } from "react";
import {
	Pressable,
	View,
	Text,
	ScrollView,
	Alert,
	Image,
	Linking,
	ActivityIndicator,
	Modal,
	TextInput,
	TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "../constants/colors";

import GradCapIcon from "@/assets/profile/grad-cap.svg";
import SchoolIcon from "@/assets/profile/school.svg";
import HashtagIcon from "@/assets/profile/hashtag.svg";
import CircleIcon from "@/assets/profile/circle.svg";

import InstaIcon from "@/assets/social/instagram.svg";
import LinkedInIcon from "@/assets/social/linkedin.svg";
import TwitterIcon from "@/assets/social/twitter.svg";
import DiscordIcon from "@/assets/social/discord.svg";
import MascotHero from "@/assets/mascot/mascot-hero.png";
import SettingsIcon from "@/assets/icons/settings-gear.svg";

import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "expo-router";
import { api } from "../app/lib/api";
import { getRefreshToken } from "../app/lib/token";

export default function ProfileView() {
	const { logout, userId } = useAuth();
	const router = useRouter();
	const insets = useSafeAreaInsets();

	const [profile, setProfile] = useState<any | null>(null);
	const [loading, setLoading] = useState(false);
	const [editing, setEditing] = useState(false);
	const [saving, setSaving] = useState(false);
	const [form, setForm] = useState<any>({});
	const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
		null
	);
	const [majors, setMajors] = useState<any[]>([]);
	const [faculties, setFaculties] = useState<any[]>([]);
	const [studyEnum, setStudyEnum] = useState<any[]>([]);
	const [clubEnum, setClubEnum] = useState<any[]>([]);
	const [openDropdown, setOpenDropdown] = useState<
		null | "major" | "faculty" | "study" | "club"
	>(null);

	useEffect(() => {
		if (!userId) return;
		let mounted = true;
		(async () => {
			setLoading(true);
			try {
				const res = await api.get(`/api/users/id/${userId}`);
				if (!mounted) return;
				setProfile(res.data || null);
			} catch (e) {
				console.warn("failed to load profile", e);
				Alert.alert("Profile", "Failed to load profile");
			} finally {
				setLoading(false);
			}
		})();
		return () => {
			mounted = false;
		};
	}, [userId]);

	// detect whether form has any changes compared to original profile
	const formChanged = useMemo(() => {
		const original: any = {
			username: profile?.username ?? "",
			firstName: profile?.firstName ?? profile?.first_name ?? "",
			lastName: profile?.lastName ?? profile?.last_name ?? "",
			bio: profile?.bio ?? "",
			avatarUrl: profile?.avatar_url ?? "",
			twitterUrl: profile?.twitter_url ?? "",
			instagramUrl: profile?.instagram_url ?? "",
			discordUrl: profile?.discord_url ?? "",
			linkedinUrl: profile?.linkedin_url ?? "",
			major: profile?.major ?? "",
			faculty: profile?.faculty ?? "",
			studyYear: profile?.study_year ?? "",
			studyStatus: profile?.study_status ?? "",
			clubStatus: profile?.club_status ?? "",
		};

		const normalize = (v: any) => (v == null ? "" : String(v).trim());
		const keys = Object.keys(original);
		for (const k of keys) {
			if (normalize((form as any)[k]) !== normalize(original[k])) return true;
		}
		return false;
	}, [form, profile]);
	const handleLogout = async () => {
		try {
			const refreshToken = await getRefreshToken();
			if (refreshToken) {
				await api.post("/api/auth/logout", { refreshToken });
			}
		} catch (e) {
			console.warn("server logout failed", e);
			Alert.alert("Logout", "Server logout failed (ignored)");
		} finally {
			await logout();
			router.replace("/welcome" as any);
		}
	};
	const openUrl = async (url?: string) => {
		if (!url) return;
		try {
			await Linking.openURL(url);
		} catch (e) {
			console.warn("open url failed", e);
		}
	};

	if (loading) {
		return (
			<View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
				<ActivityIndicator size="large" />
			</View>
		);
	}

	const openEdit = () => {
		if (!profile) return;
		setForm({
			username: profile.username ?? "",
			firstName: profile.firstName ?? profile.first_name ?? "",
			lastName: profile.lastName ?? profile.last_name ?? "",
			bio: profile.bio ?? "",
			avatarUrl: profile.avatar_url ?? "",
			twitterUrl: profile.twitter_url ?? "",
			instagramUrl: profile.instagram_url ?? "",
			discordUrl: profile.discord_url ?? "",
			linkedinUrl: profile.linkedin_url ?? "",
			major: profile.major ?? "",
			faculty: profile.faculty ?? "",
			studyYear: profile.study_year ?? "",
			studyStatus: profile.study_status ?? "",
			clubStatus: profile.club_status ?? "",
		});
		setUsernameAvailable(null);
		setEditing(true);

		// load dropdowns when opening editor
		(async () => {
			try {
				const [majRes, facRes, studyRes, clubRes] = await Promise.all([
					api.get("/api/users/majors"),
					api.get("/api/users/faculties"),
					api.get("/api/users/studyenum"),
					api.get("/api/users/clubenum"),
				]);
				setMajors(majRes.data || []);
				setFaculties(facRes.data || []);
				setStudyEnum(studyRes.data || []);
				setClubEnum(clubRes.data || []);
			} catch (e) {
				console.warn("failed to load edit dropdowns", e);
			}
		})();
	};

	const checkUsernameAvailability = async (username?: string) => {
		if (!username) {
			Alert.alert("Username check", "Please enter a username to check.");
			return false;
		}
		try {
			const res = await api.post("/api/auth/check", { username });
			// backend may return { available: true } or similar
			const available = res?.data?.available ?? res?.data?.ok ?? false;
			setUsernameAvailable(Boolean(available));
			Alert.alert(
				"Username check",
				available ? "Username is available" : "Username is taken"
			);
			return available;
		} catch (e) {
			console.warn("username check failed", e);
			Alert.alert("Username check", "Failed to check username");
			return false;
		}
	};

	const handleSave = async () => {
		if (!userId) return Alert.alert("Error", "No user id");
		// double-check: don't submit if nothing changed
		if (!formChanged) {
			Alert.alert("No changes", "You haven't made any changes to save.");
			return;
		}
		// optional: check username availability if changed
		if (form.username && form.username !== profile?.username) {
			const ok = await checkUsernameAvailability(form.username);
			if (!ok) return;
		}
		setSaving(true);
		try {
			// send camelCase payload per frontend convention
			const payload = {
				username: form.username,
				firstName: form.firstName,
				lastName: form.lastName,
				bio: form.bio,
				avatarUrl: form.avatarUrl,
				twitterUrl: form.twitterUrl,
				instagramUrl: form.instagramUrl,
				discordUrl: form.discordUrl,
				linkedinUrl: form.linkedinUrl,
				major: form.major,
				faculty: form.faculty,
				studyYear: form.studyYear,
				studyStatus: form.studyStatus,
				clubStatus: form.clubStatus,
			};

			// Use PATCH to update; backend now returns the full canonical profile
			const res = await api.patch(`/api/users/update/${userId}`, payload);
			setProfile(res?.data || { ...profile, ...payload });
			setEditing(false);
			Alert.alert("Profile", "Profile updated");
		} catch (e) {
			console.warn("profile update failed", e);
			Alert.alert("Profile", "Failed to update profile");
		} finally {
			setSaving(false);
		}
	};

	// derive display name and handle (support both camelCase and snake_case from API)
	const displayName =
		[
			profile?.firstName ?? profile?.first_name,
			profile?.lastName ?? profile?.last_name,
		]
			.filter(Boolean)
			.join(" ")
			.trim() ||
		profile?.username ||
		"—";

	const handle = profile?.username
		? `@${profile.username}`
		: profile?.email
		? `@${profile.email.split("@")[0]}`
		: "";

	// normalize optional string fields: treat empty/whitespace as missing
	const avatarUrl =
		profile?.avatar_url && String(profile.avatar_url).trim().length > 0
			? String(profile.avatar_url).trim()
			: undefined;
	const bioText =
		profile?.bio && String(profile.bio).trim().length > 0
			? String(profile.bio).trim()
			: "No bio yet.";
	const instagramUrl =
		profile?.instagram_url && String(profile.instagram_url).trim().length > 0
			? String(profile.instagram_url).trim()
			: undefined;
	const linkedinUrl =
		profile?.linkedin_url && String(profile.linkedin_url).trim().length > 0
			? String(profile.linkedin_url).trim()
			: undefined;
	const twitterUrl =
		profile?.twitter_url && String(profile.twitter_url).trim().length > 0
			? String(profile.twitter_url).trim()
			: undefined;
	const discordUrl =
		profile?.discord_url && String(profile.discord_url).trim().length > 0
			? String(profile.discord_url).trim()
			: undefined;

	return (
		<ScrollView
			className="bg-backgroundLight w-full"
			contentContainerStyle={{
				paddingTop: 32 + (insets.top || 0),
				paddingBottom: 32,
				paddingHorizontal: 20,
				alignItems: "center",
				gap: 20,
			}}
		>
			{/* Profile card */}
			{/* Top profile header (avatar left, name/handle right, bio under) */}
			<View
				className="w-full max-w-lg bg-backgroundLight"
				style={{ position: "relative" }}
			>
				<View
					className="flex-row items-center"
					style={{ paddingVertical: 8, paddingHorizontal: 12 }}
				>
					{avatarUrl ? (
						<View
							style={{
								width: 96,
								height: 96,
								borderRadius: 48,
								shadowColor: "#000",
								shadowOffset: { width: 0, height: 4 },
								shadowOpacity: 0.25,
								shadowRadius: 6,
								elevation: 6, // for Android
							}}
						>
							<Image
								source={{ uri: avatarUrl }}
								style={{
									width: 96,
									height: 96,
									borderRadius: 48,
								}}
							/>
						</View>
					) : (
						<View
							style={{
								width: 96,
								height: 96,
								borderRadius: 48,
								shadowColor: "#000",
								shadowOffset: { width: 0, height: 4 },
								shadowOpacity: 0.25,
								shadowRadius: 6,
								elevation: 6, // for Android
							}}
						>
							<View
								style={{ width: 96, height: 96, borderRadius: 48 }}
								className="bg-blue-500"
							/>
						</View>
					)}
					<View style={{ marginLeft: 16, flex: 1 }}>
						<Text
							className="text-2xl font-inter-bold"
						>
							{displayName}
						</Text>
						{handle ? (
							<Text
								style={{ fontFamily: "Inter" }}
								className="text-sm text-textAccent mt-1"
							>
								{handle}
							</Text>
						) : null}
						<Text
							style={{ fontFamily: "Inter" }}
							className="text-xs text-textOnBgLight mt-2"
						>
							id: {userId ?? "(none)"}
						</Text>
					</View>
				</View>
				{/* edit button: settings gear icon */}
				<Pressable
					onPress={openEdit}
					style={{ position: "absolute", right: 12, top: 12, padding: 8 }}
					hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
					accessibilityLabel="Edit profile"
				>
					<SettingsIcon width={25} height={25} fill={colors.textAccent} />
				</Pressable>
				<View style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
					<Text
						style={{ fontFamily: "Inter" }}
						className="text-base text-textOnBgLight"
					>
						{bioText}
					</Text>
				</View>
			</View>

			{/* Academics card */}
			<View className="w-full max-w-lg bg-white rounded-3xl shadow-lg p-4">
				<View className="flex-row items-center mb-3">
					<GradCapIcon width={20} height={20} fill={colors.accent} />
					<Text
						style={{ fontFamily: "Inter" }}
						className="ml-3 text-sm font-semibold"
					>
						{profile?.major ?? "—"}
					</Text>
				</View>
				<View className="flex-row items-center mb-3">
					<SchoolIcon width={20} height={20} fill={colors.accent} />
					<Text
						style={{ fontFamily: "Inter" }}
						className="ml-3 text-sm font-semibold"
					>
						{profile?.faculty ?? "—"}
					</Text>
				</View>
				<View className="flex-row items-center mb-3">
					<HashtagIcon width={20} height={20} fill={colors.accent} />
					<Text
						style={{ fontFamily: "Inter" }}
						className="ml-3 text-sm font-semibold"
					>
						{profile?.study_year ? `${profile.study_year}th Year` : "—"}
					</Text>
				</View>
				<View className="flex-row items-center">
					<CircleIcon width={20} height={20} fill={colors.accent} />
					<Text
						style={{ fontFamily: "Inter" }}
						className="ml-3 text-sm font-semibold"
					>
						{`${profile?.study_status ?? "—"}${
							profile?.club_status ? `, ${profile.club_status}` : ""
						}`}
					</Text>
				</View>
			</View>

			{/* Social row */}
			<View className="w-full max-w-lg flex-row items-center justify-between px-4">
				<Pressable
					onPress={() => openUrl(instagramUrl)}
					disabled={!instagramUrl}
					hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
					style={{ padding: 8, borderRadius: 24 }}
					accessibilityRole="link"
				>
					<InstaIcon
						width={32}
						height={32}
						fill={instagramUrl ? colors.textAccent : "#d1d5db"}
					/>
				</Pressable>
				<Pressable
					onPress={() => openUrl(linkedinUrl)}
					disabled={!linkedinUrl}
					hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
					style={{ padding: 8, borderRadius: 24 }}
					accessibilityRole="link"
				>
					<LinkedInIcon
						width={32}
						height={32}
						fill={linkedinUrl ? colors.textAccent : "#d1d5db"}
					/>
				</Pressable>
				<Pressable
					onPress={() => openUrl(twitterUrl)}
					disabled={!twitterUrl}
					hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
					style={{ padding: 8, borderRadius: 24 }}
					accessibilityRole="link"
				>
					<TwitterIcon
						width={32}
						height={32}
						fill={twitterUrl ? colors.textAccent : "#d1d5db"}
					/>
				</Pressable>
				<Pressable
					onPress={() => openUrl(discordUrl)}
					disabled={!discordUrl}
					hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
					style={{ padding: 8, borderRadius: 24 }}
					accessibilityRole="link"
				>
					<DiscordIcon
						width={32}
						height={32}
						fill={discordUrl ? colors.textAccent : "#d1d5db"}
					/>
				</Pressable>
			</View>

			{/* Edit modal */}
			<Modal
				visible={editing}
				animationType="slide"
				onRequestClose={() => setEditing(false)}
			>
				<View
					style={{
						flex: 1,
						paddingTop: 20 + (insets.top || 0),
						paddingHorizontal: 16,
					}}
				>
					<ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
						<Text
							style={{
								fontFamily: "Inter",
								fontSize: 28,
								fontWeight: "700",
								marginBottom: 12,
							}}
						>
							Edit profile
						</Text>
						{/* Username + check */}
						<Text style={{ fontFamily: "Inter", marginBottom: 6 }}>
							Username
						</Text>
						<View
							style={{
								flexDirection: "row",
								alignItems: "center",
								marginBottom: 12,
							}}
						>
							<TextInput
								value={form.username}
								onChangeText={(t) =>
									setForm((p: any) => ({ ...p, username: t }))
								}
								placeholder="username"
								style={{
									flex: 1,
									borderWidth: 1,
									borderColor: "#e5e7eb",
									borderRadius: 8,
									padding: 8,
									marginRight: 8,
								}}
							/>
							<Pressable
								onPress={() => checkUsernameAvailability(form.username)}
								className="bg-blue-100 rounded px-3 py-2"
							>
								<Text style={{ fontFamily: "Inter" }} className="text-blue-600">
									Check
								</Text>
							</Pressable>
						</View>
						{usernameAvailable === true ? (
							<Text
								style={{
									fontFamily: "Inter",
									color: "#059669",
									marginBottom: 12,
								}}
							>
								Username available
							</Text>
						) : usernameAvailable === false ? (
							<Text
								style={{
									fontFamily: "Inter",
									color: "#ef4444",
									marginBottom: 12,
								}}
							>
								Username taken
							</Text>
						) : null}

						{/* First + Last name */}
						<View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
							<TextInput
								value={form.firstName}
								onChangeText={(t) =>
									setForm((p: any) => ({ ...p, firstName: t }))
								}
								placeholder="First name"
								style={{
									flex: 1,
									borderWidth: 1,
									borderColor: "#e5e7eb",
									borderRadius: 8,
									padding: 8,
								}}
							/>
							<TextInput
								value={form.lastName}
								onChangeText={(t) =>
									setForm((p: any) => ({ ...p, lastName: t }))
								}
								placeholder="Last name"
								style={{
									flex: 1,
									borderWidth: 1,
									borderColor: "#e5e7eb",
									borderRadius: 8,
									padding: 8,
								}}
							/>
						</View>

						{/* Bio */}
						<Text style={{ fontFamily: "Inter", marginBottom: 6 }}>Bio</Text>
						<TextInput
							value={form.bio}
							onChangeText={(t) => setForm((p: any) => ({ ...p, bio: t }))}
							placeholder="A short bio"
							multiline
							style={{
								borderWidth: 1,
								borderColor: "#e5e7eb",
								borderRadius: 8,
								padding: 8,
								minHeight: 80,
								textAlignVertical: "top",
								marginBottom: 12,
							}}
						/>

						{/* Avatar URL */}
						<Text style={{ fontFamily: "Inter", marginBottom: 6 }}>
							Avatar URL
						</Text>
						<TextInput
							value={form.avatarUrl}
							onChangeText={(t) =>
								setForm((p: any) => ({ ...p, avatarUrl: t }))
							}
							placeholder="https://..."
							style={{
								borderWidth: 1,
								borderColor: "#e5e7eb",
								borderRadius: 8,
								padding: 8,
								marginBottom: 12,
							}}
						/>

						{/* Socials */}
						<Text style={{ fontFamily: "Inter", marginBottom: 6 }}>
							Instagram
						</Text>
						<TextInput
							value={form.instagramUrl}
							onChangeText={(t) =>
								setForm((p: any) => ({ ...p, instagramUrl: t }))
							}
							placeholder="https://instagram.com/..."
							style={{
								borderWidth: 1,
								borderColor: "#e5e7eb",
								borderRadius: 8,
								padding: 8,
								marginBottom: 12,
							}}
						/>
						<Text style={{ fontFamily: "Inter", marginBottom: 6 }}>
							LinkedIn
						</Text>
						<TextInput
							value={form.linkedinUrl}
							onChangeText={(t) =>
								setForm((p: any) => ({ ...p, linkedinUrl: t }))
							}
							placeholder="https://linkedin.com/..."
							style={{
								borderWidth: 1,
								borderColor: "#e5e7eb",
								borderRadius: 8,
								padding: 8,
								marginBottom: 12,
							}}
						/>
						<Text style={{ fontFamily: "Inter", marginBottom: 6 }}>
							Twitter
						</Text>
						<TextInput
							value={form.twitterUrl}
							onChangeText={(t) =>
								setForm((p: any) => ({ ...p, twitterUrl: t }))
							}
							placeholder="https://twitter.com/..."
							style={{
								borderWidth: 1,
								borderColor: "#e5e7eb",
								borderRadius: 8,
								padding: 8,
								marginBottom: 12,
							}}
						/>
						<Text style={{ fontFamily: "Inter", marginBottom: 6 }}>
							Discord
						</Text>
						<TextInput
							value={form.discordUrl}
							onChangeText={(t) =>
								setForm((p: any) => ({ ...p, discordUrl: t }))
							}
							placeholder="https://discord.com/..."
							style={{
								borderWidth: 1,
								borderColor: "#e5e7eb",
								borderRadius: 8,
								padding: 8,
								marginBottom: 12,
							}}
						/>

						{/* Academics */}
						<Text style={{ fontFamily: "Inter", marginBottom: 6 }}>Major</Text>
						<Pressable
							onPress={() => setOpenDropdown("major")}
							style={{
								borderWidth: 1,
								borderColor: "#e5e7eb",
								borderRadius: 8,
								padding: 12,
								marginBottom: 12,
							}}
						>
							<Text style={{ fontFamily: "Inter" }}>
								{form.major || "select major"}
							</Text>
						</Pressable>
						<Text style={{ fontFamily: "Inter", marginBottom: 6 }}>
							Faculty
						</Text>
						<Pressable
							onPress={() => setOpenDropdown("faculty")}
							style={{
								borderWidth: 1,
								borderColor: "#e5e7eb",
								borderRadius: 8,
								padding: 12,
								marginBottom: 12,
							}}
						>
							<Text style={{ fontFamily: "Inter" }}>
								{form.faculty || "select faculty"}
							</Text>
						</Pressable>
						<Text style={{ fontFamily: "Inter", marginBottom: 6 }}>
							Study Year
						</Text>
						<View
							className="mb-3 rounded-3xl"
							style={{
								backgroundColor: "#fff",
								paddingVertical: 10,
								paddingHorizontal: 12,
								marginBottom: 12,
							}}
						>
							<View
								style={{
									flexDirection: "row",
									alignItems: "center",
									justifyContent: "space-between",
								}}
							>
								<View style={{ flex: 1 }}>
									<Text style={{ color: "#666", fontFamily: "Inter" }}>
										year of study
									</Text>
								</View>
								<View style={{ flexDirection: "row", alignItems: "center" }}>
									<Pressable
										onPress={() => {
											const cur =
												parseInt(String(form.studyYear || "0"), 10) || 0;
											const next = Math.max(1, cur - 1);
											setForm((p: any) => ({ ...p, studyYear: String(next) }));
										}}
										style={{
											backgroundColor: "#f3f4f6",
											paddingHorizontal: 12,
											paddingVertical: 8,
											borderRadius: 12,
											marginRight: 8,
										}}
									>
										<Text style={{ fontSize: 20 }}>−</Text>
									</Pressable>
									<View style={{ minWidth: 28, alignItems: "center" }}>
										<Text
											style={{
												fontSize: 16,
												color: "#111",
												fontFamily: "Inter",
											}}
										>
											{form.studyYear || "1"}
										</Text>
									</View>
									<Pressable
										onPress={() => {
											const cur =
												parseInt(String(form.studyYear || "0"), 10) || 0;
											const next = Math.min(10, cur + 1);
											setForm((p: any) => ({ ...p, studyYear: String(next) }));
										}}
										style={{
											backgroundColor: "#f3f4f6",
											paddingHorizontal: 12,
											paddingVertical: 8,
											borderRadius: 12,
											marginLeft: 8,
										}}
									>
										<Text style={{ fontSize: 20 }}>+</Text>
									</Pressable>
								</View>
							</View>
						</View>
						<Text style={{ fontFamily: "Inter", marginBottom: 6 }}>
							Study Status
						</Text>
						<Pressable
							onPress={() => setOpenDropdown("study")}
							style={{
								borderWidth: 1,
								borderColor: "#e5e7eb",
								borderRadius: 8,
								padding: 12,
								marginBottom: 12,
							}}
						>
							<Text style={{ fontFamily: "Inter" }}>
								{form.studyStatus || "select study status"}
							</Text>
						</Pressable>
						<Text style={{ fontFamily: "Inter", marginBottom: 6 }}>
							Club Status
						</Text>
						<Pressable
							onPress={() => setOpenDropdown("club")}
							style={{
								borderWidth: 1,
								borderColor: "#e5e7eb",
								borderRadius: 8,
								padding: 12,
								marginBottom: 12,
							}}
						>
							<Text style={{ fontFamily: "Inter" }}>
								{form.clubStatus || "select club status"}
							</Text>
						</Pressable>

						{/* Actions: full-width buttons */}
						<View style={{ marginTop: 12, width: "100%" }}>
							<Pressable
								onPress={() => setEditing(false)}
								style={{
									width: "100%",
									backgroundColor: "#f3f4f6",
									borderRadius: 12,
									paddingVertical: 14,
									alignItems: "center",
									marginBottom: 12,
								}}
							>
								<Text
									style={{
										fontFamily: "Inter",
										color: "#374151",
										fontSize: 16,
									}}
								>
									Cancel
								</Text>
							</Pressable>
							<Pressable
								onPress={handleSave}
								disabled={!formChanged || saving}
								style={{
									width: "100%",
									backgroundColor:
										!formChanged || saving ? "#9ca3af" : "#FFE374",
									borderRadius: 12,
									paddingVertical: 14,
									alignItems: "center",
								}}
							>
								{saving ? (
									<ActivityIndicator color="#fff" />
								) : (
									<Text
										style={{ fontFamily: "Inter", color: !formChanged || saving ? "#fff" : "#000000", fontSize: 16 }}
									>
										Save
									</Text>
								)}
							</Pressable>
						</View>

						{/* Secondary action: Log out inside edit page (separated from Cancel/Save to avoid accidents) */}
						<View style={{ marginTop: 16, width: "100%" }}>
							<Pressable
								onPress={() =>
									Alert.alert("Log out", "Are you sure you want to log out?", [
										{ text: "Cancel", style: "cancel" },
										{
											text: "Log out",
											style: "destructive",
											onPress: () => {
												setEditing(false);
												handleLogout();
											},
										},
									])
								}
								style={{
									width: "100%",
									backgroundColor: "#fff",
									borderWidth: 1,
									borderColor: "#fee2e2",
									borderRadius: 12,
									paddingVertical: 14,
									alignItems: "center",
								}}
							>
								<Text style={{ fontFamily: "Inter", color: "#b91c1c", fontSize: 16 }}>
									Log out
								</Text>
							</Pressable>
						</View>

						{/* Dropdown selector modal (reuses loaded arrays) */}
						<Modal
							visible={openDropdown != null}
							transparent
							animationType="fade"
							onRequestClose={() => setOpenDropdown(null)}
						>
							<TouchableOpacity
								style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)" }}
								activeOpacity={1}
								onPress={() => setOpenDropdown(null)}
							>
								<View style={{ justifyContent: "flex-end", flex: 1 }}>
									<View
										style={{
											backgroundColor: "#fff",
											paddingVertical: 8,
											paddingHorizontal: 10,
											borderTopLeftRadius: 16,
											borderTopRightRadius: 16,
											maxHeight: "60%",
										}}
									>
										<View style={{ alignItems: "center", paddingVertical: 6 }}>
											<View
												style={{
													width: 40,
													height: 4,
													backgroundColor: "#e5e7eb",
													borderRadius: 4,
												}}
											/>
										</View>
										<ScrollView>
											{(openDropdown === "major"
												? majors
												: openDropdown === "faculty"
												? faculties
												: openDropdown === "study"
												? studyEnum
												: clubEnum
											).map((opt: any) => {
												const key =
													opt.id ?? opt.enumlabel ?? JSON.stringify(opt);
												const label =
													opt.major_name ??
													opt.faculty_name ??
													opt.name ??
													opt.enumlabel ??
													String(opt);
												return (
													<Pressable
														key={key}
														onPress={() => {
															if (openDropdown === "major") {
																const majorLabel =
																	opt.major_name ?? opt.name ?? String(opt);
																// derive faculty label from major object if possible
																let facultyLabel =
																	opt.faculty_name ?? undefined;
																const fid =
																	opt.faculty_id ?? opt.facultyId ?? null;
																if (!facultyLabel && fid != null) {
																	const fobj = faculties.find(
																		(f: any) => f.id === fid
																	);
																	facultyLabel =
																		fobj?.faculty_name ?? fobj?.name;
																}
																setForm((p: any) => ({
																	...p,
																	major: majorLabel,
																	faculty: facultyLabel ?? p.faculty,
																}));
															} else if (openDropdown === "faculty") {
																setForm((p: any) => ({
																	...p,
																	faculty:
																		opt.faculty_name ?? opt.name ?? String(opt),
																}));
															} else if (openDropdown === "study") {
																setForm((p: any) => ({
																	...p,
																	studyStatus: opt.enumlabel,
																}));
															} else {
																setForm((p: any) => ({
																	...p,
																	clubStatus: opt.enumlabel,
																}));
															}
															setOpenDropdown(null);
														}}
														style={{
															paddingVertical: 14,
															paddingHorizontal: 8,
															borderBottomWidth: 1,
															borderBottomColor: "#f3f4f6",
														}}
													>
														<Text style={{ color: "#111" }}>{label}</Text>
													</Pressable>
												);
											})}
										</ScrollView>
										<Pressable
											onPress={() => setOpenDropdown(null)}
											style={{ padding: 12, alignItems: "center" }}
										>
											<Text style={{ color: "#6b7280" }}>Cancel</Text>
										</Pressable>
									</View>
								</View>
							</TouchableOpacity>
						</Modal>
					</ScrollView>
				</View>
			</Modal>

			{/* Mascot footer: centered lighter hero and caption */}
			<View
				className="w-full max-w-lg items-center mt-8"
				style={{ opacity: 0.6 }}
			>
				<Image
					source={MascotHero}
					style={{
						width: 180,
						height: 120,
						resizeMode: "contain",
						marginBottom: 8,
						opacity: 0.6,
					}}
				/>
				<Text
					style={{ fontFamily: "Inter", opacity: 0.6 }}
					className="text-sm text-textOnBgLight"
				>
					{"that\u2019s all!"}
				</Text>
			</View>
		</ScrollView>
	);
}
