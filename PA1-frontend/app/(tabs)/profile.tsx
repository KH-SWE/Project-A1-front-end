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
	RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import MascotHero from "@/assets/mascot/mascot-hero.png";
import DefaultAvatar from "@/assets/profile/default-avatar.png";

import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "expo-router";
import { api } from "../lib/api";
import { getRefreshToken } from "../lib/token";

import TopProfileHeader from "@/components/TopProfileHeader";
import AcademicsCard from "@/components/AcademicsCard";
import SocialRow from "@/components/SocialRow";
import { pickAvatar } from "../lib/uploads/pickAndUploadAvatar";
import { uploadToS3, UploadFile } from "../lib/uploads/uploadToS3";

// Try to extract S3 object key from a public S3/CloudFront URL.
// Returns a key string suitable for DeleteObjectCommand (e.g. 'avatars/user-1.jpg') or null when unknown.
function extractS3KeyFromUrl(rawUrl?: string | null): string | null {
	if (!rawUrl) return null;
	try {
		const u = new URL(String(rawUrl));
		let key = (u.pathname || "").replace(/^\//, "");

		const host = u.hostname || "";
		// virtual-hosted style: {bucket}.s3.amazonaws.com or {bucket}.s3.<region>.amazonaws.com
		if (host.includes(".s3.")) {
			return key || null;
		}

		// path-style: s3.amazonaws.com/{bucket}/{key}
		if (
			host === "pa1-media.s3.ca-central-1.amazonaws.com" ||
			host.endsWith(".pa1-media.s3.ca-central-1.amazonaws.com")
		) {
			const parts = key.split("/");
			if (parts.length >= 2) return parts.slice(1).join("/");
			return key || null;
		}

		// amazonaws with region style e.g., s3.<region>.amazonaws.com
		if (host.startsWith("s3.")) {
			const parts = key.split("/");
			if (parts.length >= 2) return parts.slice(1).join("/");
			return key || null;
		}

		// If URL looks like a CloudFront or custom domain, best effort: return pathname (without leading slash)
		return key || null;
	} catch {
		return null;
	}
}

export default function ProfileScreen() {
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
	const [uploadingAvatar, setUploadingAvatar] = useState(false);
	const [pendingAvatarUpload, setPendingAvatarUpload] = useState(false);
	const [avatarPreviewVisible, setAvatarPreviewVisible] = useState(false);
	const [editOriginalAvatar, setEditOriginalAvatar] = useState<string | null>(
		null
	);
	const [lastUploadedAvatarUrl, setLastUploadedAvatarUrl] = useState<
		string | null
	>(null);

	const [pendingAvatarFile, setPendingAvatarFile] = useState<UploadFile | null>(
		null
	);

	const handleAvatarChange = async () => {
		if (!userId) return Alert.alert("Upload avatar", "No user id available");
		try {
			const file = await pickAvatar(Number(userId));
			if (file) {
				// preview locally (using file.uri) and mark that we have a pending file to upload on Save
				setForm((f: any) => ({ ...f, avatarUrl: file.uri }));
				setPendingAvatarFile(file);
				setPendingAvatarUpload(true);
			}
		} catch (e) {
			console.warn("avatar pick failed", e);
			Alert.alert("Upload avatar", "Failed to pick avatar");
		}
	};

	const handleRemoveAvatar = () => {
		Alert.alert(
			"Remove avatar",
			"Are you sure you want to remove your profile picture?",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Remove",
					style: "destructive",
					onPress: () => {
						// clear avatar in form; mark pending so Save enables
						// Do NOT modify `profile` here — wait for Save to persist/remove the avatar.
						setForm((f: any) => ({ ...f, avatarUrl: "" }));
						setPendingAvatarUpload(true);
						// mark lastUploadedAvatarUrl as null because this is a removal, not an upload
						setLastUploadedAvatarUrl(null);
					},
				},
			]
		);
	};

	// When logged in and the database is refreshed, the app only kicks the user out to the sign-in screen
	// when they click on the 'profile' tab. So we need to handle that case here by detecting auth errors
	// the moment they load / open the application.
	useEffect(() => {
		if (!userId) return;

		let mounted = true;

		const fetchProfile = async () => {
			setLoading(true);
			try {
				const res = await api.get(`/api/users/id/${userId}`);
				if (!mounted) return;
				setProfile(res.data || null);
			} catch (e: any) {
				console.warn("failed to load profile", e);

				// If the profile fetch failed because the user record was deleted or
				// the token is invalid/expired, clear local auth state and send the
				// client back to the welcome/login screen so the user can re-auth.
				const status = e?.response?.status;
				const data = e?.response?.data;

				const looksLikeUserMissing =
					status === 404 ||
					(data &&
						typeof data === "object" &&
						/not found/i.test(JSON.stringify(data)));

				const looksLikeAuthProblem =
					status === 401 ||
					status === 403 ||
					(data &&
						typeof data === "object" &&
						(data.error === "token_expired" || data.error === "invalid_token"));

				if (looksLikeUserMissing || looksLikeAuthProblem) {
					try {
						await logout();
					} catch (logoutErr) {
						console.warn(
							"logout failed during profile load error handling",
							logoutErr
						);
					}
					// Replace navigation so user cannot go back into the app shell.
					router.replace("/welcome" as any);
					return;
				}

				Alert.alert("Profile", "Failed to load profile");
			} finally {
				setLoading(false);
			}
		};

		fetchProfile();

		return () => {
			mounted = false;
		};
	}, [userId, logout, router]);

	const [refreshing, setRefreshing] = useState(false);

	const onRefresh = async () => {
		setRefreshing(true);
		try {
			// re-run profile fetch
			await api
				.get(`/api/users/id/${userId}`)
				.then((res) => setProfile(res.data || null));
		} catch (e) {
			console.warn("refresh profile failed", e);
		}
		setRefreshing(false);
	};

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
		setPendingAvatarUpload(false);
		setEditOriginalAvatar(profile?.avatar_url ?? "");
		setLastUploadedAvatarUrl(null);

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
		if (!formChanged && !pendingAvatarUpload) {
			Alert.alert("No changes", "You haven't made any changes to save.");
			return;
		}
		if (form.username && form.username !== profile?.username) {
			const ok = await checkUsernameAvailability(form.username);
			if (!ok) return;
		}
		// capture original avatar so we can delete the old object from S3 if save succeeds
		const originalAvatar = profile?.avatar_url ?? "";

		setSaving(true);
		try {
			let uploadedUrl: string | null = null;
			// If there's a pending file (picked but not uploaded), upload it now so we can include its URL in the payload
			if (pendingAvatarFile) {
				setUploadingAvatar(true);
				try {
					uploadedUrl = await uploadToS3(pendingAvatarFile, "avatars");
					// set the payload avatar to the uploaded public URL
					setForm((f: any) => ({ ...f, avatarUrl: uploadedUrl }));
				} catch (uploadErr) {
					console.warn("uploadToS3 failed during save", uploadErr);
					Alert.alert(
						"Upload avatar",
						"Failed to upload avatar. Save aborted."
					);
					return;
				} finally {
					setUploadingAvatar(false);
				}
			}

			const payload = {
				username: form.username,
				firstName: form.firstName,
				lastName: form.lastName,
				bio: form.bio,
				// prefer uploadedUrl (if present), otherwise the form value
				avatarUrl: uploadedUrl ?? form.avatarUrl,
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

			const res = await api.patch(`/api/users/update/${userId}`, payload);
			setProfile(res?.data || { ...profile, ...payload });
			setEditing(false);
			setPendingAvatarUpload(false);
			setPendingAvatarFile(null);
			setLastUploadedAvatarUrl(null);
			Alert.alert("Profile", "Profile updated");
			// If the avatar changed (replaced or removed), attempt to delete the previous file from S3
			try {
				const prev = String(originalAvatar || "").trim();
				const next = String(payload.avatarUrl || "").trim();
				if (prev && prev !== next) {
					const fileKey = extractS3KeyFromUrl(prev);
					if (fileKey) {
						// backend expects DELETE with body { fileKey }
						await api.delete(
							`/api/upload/delete-file?fileKey=${encodeURIComponent(fileKey)}`
						);
					} else {
						console.warn(
							"could not determine S3 file key from url, skipping delete",
							prev
						);
					}
				}
			} catch (err) {
				console.warn("failed to delete previous avatar from bucket", err);
			}
		} catch (e) {
			console.warn("profile update failed", e);
			Alert.alert("Profile", "Failed to update profile");
		} finally {
			setSaving(false);
		}
	};

	const canSave = formChanged || pendingAvatarUpload;

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
				paddingTop: 8 + (insets.top || 0),
				paddingBottom: 32,
				paddingHorizontal: 20,
				alignItems: "center",
				gap: 8,
			}}
			refreshControl={
				<RefreshControl
					refreshing={refreshing}
					onRefresh={onRefresh}
					progressViewOffset={8 + (insets.top || 0)}
				/>
			}
		>
			{/* Avatar preview modal (activated when tapping header avatar) */}
			<Modal
				visible={avatarPreviewVisible}
				transparent
				animationType="fade"
				onRequestClose={() => setAvatarPreviewVisible(false)}
			>
				<Pressable
					style={{
						flex: 1,
						backgroundColor: "rgba(0,0,0,0.7)",
						justifyContent: "center",
						alignItems: "center",
					}}
					onPress={() => setAvatarPreviewVisible(false)}
				>
					<View style={{ padding: 12 }}>
						{avatarUrl ? (
							<Image
								source={{ uri: avatarUrl }}
								style={{ width: 320, height: 320, borderRadius: 12 }}
							/>
						) : (
							<Image
								source={DefaultAvatar}
								style={{ width: 320, height: 320, borderRadius: 12 }}
							/>
						)}
					</View>
				</Pressable>
			</Modal>
			<TopProfileHeader
				avatarUrl={avatarUrl}
				displayName={displayName}
				handle={handle}
				userId={userId}
				onEdit={openEdit}
				onAvatarPress={() => setAvatarPreviewVisible(true)}
				uploading={uploadingAvatar}
			/>

			<View
				style={{ paddingHorizontal: 12, paddingBottom: 8 }}
				className="w-full max-w-lg"
			>
				<Text className="text-sm font-inter text-textOnBgLight">{bioText}</Text>
			</View>

			<AcademicsCard profile={profile} />

			<SocialRow
				instagramUrl={instagramUrl}
				linkedinUrl={linkedinUrl}
				twitterUrl={twitterUrl}
				discordUrl={discordUrl}
				onOpenUrl={openUrl}
			/>

			{/* Edit modal (kept inline) */}
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
						<Text className="font-inter-bold text-3xl mb-3 text-textOnBgLight">
							Edit profile
						</Text>

						{/* Username + check */}
						<Text className="font-inter-regular mb-1.5 text-base text-textOnBgLight">Username</Text>
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
								<Text className="text-blue-600 font-inter-regular text-base">Check</Text>
							</Pressable>
						</View>
						{usernameAvailable === true ? (
							<Text className="text-green-600 font-inter-regular mb-3 text-base">Username available</Text>
						) : usernameAvailable === false ? (
							<Text className="text-red-500 font-inter-regular mb-3 text-base">Username taken</Text>
						) : null}

						{/* First + Last name */}
						<Text className="font-inter-regular mb-1.5 text-base text-textOnBgLight">Name</Text>
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

						{/* Avatar (picker only) */}
						{/* Avatar preview + change button */}
						<View
							style={{
								flexDirection: "row",
								alignItems: "center",
								marginBottom: 12,
							}}
						>
							<Image
								source={
									// If the form explicitly contains an empty string, the user has chosen
									// to remove their avatar in the editor — show the default avatar.
									form.avatarUrl === ""
										? DefaultAvatar
										: form.avatarUrl
										? { uri: String(form.avatarUrl) }
										: avatarUrl
										? { uri: String(avatarUrl) }
										: DefaultAvatar
								}
								style={{
									width: 64,
									height: 64,
									borderRadius: 12,
									marginRight: 12,
									backgroundColor: "#f3f4f6",
								}}
							/>
							<View style={{ flex: 1 }}>
								<Pressable
									onPress={handleAvatarChange}
									style={{
										paddingVertical: 10,
										paddingHorizontal: 14,
										backgroundColor: "#fff",
										borderWidth: 1,
										borderColor: "#e5e7eb",
										borderRadius: 10,
										alignItems: "center",
									}}
								>
									{uploadingAvatar ? (
										<ActivityIndicator />
									) : (
										<Text className="font-inter-regular text-textOnBgLight text-base">Change avatar</Text>
									)}
								</Pressable>
								<Text className="font-inter-regular text-gray-500 text-xs mt-2">Tap Change avatar to pick a photo.</Text>
								<Pressable
									onPress={handleRemoveAvatar}
									style={{
										marginTop: 8,
										paddingVertical: 8,
										paddingHorizontal: 12,
										borderRadius: 8,
										backgroundColor: "#fff",
										borderWidth: 1,
										borderColor: "#fee2e2",
										alignItems: "center",
									}}
								>
									<Text className="font-inter-regular text-red-700 text-base">Remove avatar</Text>
								</Pressable>
							</View>
						</View>

						{/* Bio */}
						<Text className="font-inter-regular mb-1.5 text-base text-textOnBgLight">Bio</Text>
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

						{/* Socials */}
						<Text className="font-inter-regular mb-1.5 text-base text-textOnBgLight">Instagram</Text>
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
						<Text className="font-inter-regular mb-1.5 text-base text-textOnBgLight">LinkedIn</Text>
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
						<Text className="font-inter-regular mb-1.5 text-base text-textOnBgLight">Twitter</Text>
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
						<Text className="font-inter-regular mb-1.5 text-base text-textOnBgLight">Discord</Text>
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

						{/* Academics (simple selectors kept) */}
						<Text className="font-inter-regular mb-1.5 text-base text-textOnBgLight">Major</Text>
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
							<Text className="font-inter-regular text-base text-textOnBgLight">{form.major || "select major"}</Text>
						</Pressable>
						<Text className="font-inter-regular mb-1.5 text-base text-textOnBgLight">Faculty</Text>
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
							<Text className="font-inter-regular text-base text-textOnBgLight">{form.faculty || "select faculty"}</Text>
						</Pressable>

						<Text className="font-inter-regular mb-1.5 text-base text-textOnBgLight">Study Year</Text>
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
									<Text className="text-gray-500 font-inter-regular text-base">year of study</Text>
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
										<Text className="text-xl font-inter-regular">−</Text>
									</Pressable>
									<View style={{ minWidth: 28, alignItems: "center" }}>
										<Text className="text-base text-textOnBgLight font-inter-regular">{form.studyYear || "1"}</Text>
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
										<Text className="text-xl font-inter-regular">+</Text>
									</Pressable>
								</View>
							</View>
						</View>

						<Text className="font-inter-regular mb-1.5 text-base text-textOnBgLight">Study Status</Text>
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
							<Text className="font-inter-regular text-base text-textOnBgLight">{form.studyStatus || "select study status"}</Text>
						</Pressable>
						<Text className="font-inter-regular mb-1.5 text-base text-textOnBgLight">Club Status</Text>
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
							<Text className="font-inter-regular text-base text-textOnBgLight">{form.clubStatus || "select club status"}</Text>
						</Pressable>

						{/* Actions */}
						<View style={{ marginTop: 12, width: "100%" }}>
							<Pressable
								onPress={async () => {
									// If user uploaded a new avatar (pending) and then cancelled, attempt to delete the uploaded file
									try {
										// Only attempt to delete a temporary uploaded avatar on cancel when we have
										// an actual uploaded S3 URL recorded in `lastUploadedAvatarUrl`.
										// This avoids trying to parse local file URIs or empty values.
										if (pendingAvatarUpload && lastUploadedAvatarUrl) {
											const current = String(
												lastUploadedAvatarUrl || ""
											).trim();
											const original = String(editOriginalAvatar || "").trim();
											if (current && current !== original) {
												const fileKey = extractS3KeyFromUrl(current);
												if (fileKey) {
													try {
														await api.delete("/api/upload/delete-file", {
															data: { fileKey },
														});
													} catch (delErr: any) {
														console.warn(
															"delete-file (DELETE) failed on cancel, attempting fallback POST",
															delErr?.response?.status,
															delErr?.response?.data || delErr.message || delErr
														);
														try {
															await api.post("/api/upload/delete-file", {
																fileKey,
															});
															console.warn(
																"delete-file (POST) fallback succeeded on cancel"
															);
														} catch (postErr: any) {
															console.warn(
																"delete-file (POST) fallback failed on cancel",
																postErr?.response?.status,
																postErr?.response?.data ||
																	postErr.message ||
																	postErr
															);
														}
													}
												} else {
													console.warn(
														"could not determine S3 key for uploaded temp avatar on cancel",
														current
													);
												}
											}
										}
									} catch (e) {
										console.warn(
											"error while cleaning up uploaded avatar on cancel",
											e
										);
									} finally {
										// revert any local changes and close editor
										setForm({
											username: profile?.username ?? "",
											firstName:
												profile?.firstName ?? profile?.first_name ?? "",
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
										});
										// ensure profile remains unchanged
										setPendingAvatarUpload(false);
										setLastUploadedAvatarUrl(null);
										setEditing(false);
									}
								}}
								style={{
									width: "100%",
									backgroundColor: "#f3f4f6",
									borderRadius: 12,
									paddingVertical: 14,
									alignItems: "center",
									marginBottom: 12,
								}}
							>
								<Text className="font-inter-regular text-base text-gray-700">Cancel</Text>
							</Pressable>
							<Pressable
								onPress={handleSave}
								disabled={!canSave || saving || uploadingAvatar}
								style={{
									width: "100%",
									backgroundColor:
										!canSave || saving || uploadingAvatar
											? "#9ca3af"
											: "#FFE374",
									borderRadius: 12,
									paddingVertical: 14,
									alignItems: "center",
								}}
							>
								{saving || uploadingAvatar ? (
									<ActivityIndicator color="#fff" />
								) : (
									<Text className={`font-inter-medium text-base ${!canSave || saving || uploadingAvatar ? "text-white" : "text-black"}`}>Save</Text>
								)}
							</Pressable>
						</View>

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
								<Text className="font-inter-regular text-base text-red-700">Log out</Text>
							</Pressable>
						</View>

						{/* Dropdown modal */}
						<Modal
							visible={openDropdown != null}
							transparent
							animationType="fade"
							onRequestClose={() => setOpenDropdown(null)}
						>
							<Pressable
								style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)" }}
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
														<Text className="text-textOnBgLight font-inter-regular text-base">{label}</Text>
													</Pressable>
												);
											})}
										</ScrollView>
										<Pressable
											onPress={() => setOpenDropdown(null)}
											style={{ padding: 12, alignItems: "center" }}
										>
											<Text className="text-gray-500 font-inter-regular text-base">Cancel</Text>
										</Pressable>
									</View>
								</View>
							</Pressable>
						</Modal>
					</ScrollView>
				</View>
			</Modal>

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
				<Text className="text-sm text-textOnBgLight font-inter-regular">
					{"that\u2019s all!"}
				</Text>
			</View>
		</ScrollView>
	);
}

// Avatar preview modal (outside main return so hooks/flow are clear)
