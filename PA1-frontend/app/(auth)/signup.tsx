import React, { useState, useEffect, useRef } from "react";
import {
	View,
	Text,
	TextInput,
	Pressable,
	StyleSheet,
	Alert,
	ScrollView,
	Keyboard,
	TouchableWithoutFeedback,
	KeyboardAvoidingView,
	Platform,
	Modal,
	UIManager,
	findNodeHandle,
} from "react-native";
import LottieView from "lottie-react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/components/AuthProvider";
import { api } from "../lib/api";
import { saveTokens } from "../lib/token";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Shared input component moved to module scope to avoid remounting on every render
const COMMON_INPUT_CLASS = 'bg-white px-6 py-5 rounded-3xl font-inter-regular mb-3 w-11/12';

const styles = StyleSheet.create({
	inputShadow: {
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.25,
		shadowRadius: 6,
		elevation: 6,
	},
});

const InputField: React.FC<any> = ({ className, style, ...props }) => {
	const mergedClass = className ? `${COMMON_INPUT_CLASS} ${className}` : COMMON_INPUT_CLASS;
	const extraProps = { blurOnSubmit: props.blurOnSubmit ?? false };
	return <TextInput {...props} {...extraProps} className={mergedClass} style={[styles.inputShadow, style]} />;
};

const Dropdown: React.FC<{
	options: any[];
	selected?: any;
	placeholder?: string;
	onSelect: (item: any) => void;
	getLabel?: (item: any) => string;
}> = ({ options, selected, placeholder, onSelect, getLabel }) => {
	const [open, setOpen] = React.useState(false);
	const label = selected ? (getLabel ? getLabel(selected) : (selected.major_name ?? selected.name ?? selected.enumlabel ?? String(selected))) : (placeholder ?? 'Select...');

	return (
		<>
			<Pressable onPress={() => setOpen(true)} className={COMMON_INPUT_CLASS} style={styles.inputShadow}>
				<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
					<Text style={{ color: selected ? '#111' : '#666' }}>{label}</Text>
					<Text style={{ color: '#999' }}>▾</Text>
				</View>
			</Pressable>

			<Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
				<TouchableWithoutFeedback onPress={() => setOpen(false)}>
					<View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' }}>
						<View style={{ backgroundColor: '#fff', paddingVertical: 8, paddingHorizontal: 10, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '60%' }}>
							{/* header */}
							<View style={{ alignItems: 'center', paddingVertical: 6 }}>
								<View style={{ width: 40, height: 4, backgroundColor: '#e5e7eb', borderRadius: 4 }} />
							</View>
							<ScrollView>
								{options.map((opt: any) => {
									const key = opt.id ?? opt.enumlabel ?? JSON.stringify(opt);
									const text = getLabel ? getLabel(opt) : (opt.major_name ?? opt.faculty_name ?? opt.name ?? opt.enumlabel ?? String(opt));
									// robust equality: prefer id (numeric/object), then enumlabel (enum items), then strict equality for primitives
									let isSelected = false;
									if (selected != null) {
										// both objects with id
										if (typeof selected === 'object' && typeof opt === 'object') {
											if (selected.id != null && opt.id != null) {
												isSelected = selected.id === opt.id;
											} else if (selected.enumlabel != null && opt.enumlabel != null) {
												isSelected = selected.enumlabel === opt.enumlabel;
											} else {
												// fallback: compare a few likely name fields
												const selName = selected.major_name ?? selected.faculty_name ?? selected.name;
												const optName = opt.major_name ?? opt.faculty_name ?? opt.name;
												if (selName != null && optName != null) {
													isSelected = String(selName) === String(optName);
												}
											}
										} else {
											// primitives (string/number) compare directly or against opt's enumlabel/name
											if (selected === opt) isSelected = true;
											else if (typeof opt === 'object') {
												isSelected = selected === opt.enumlabel || selected === opt.major_name || selected === opt.faculty_name || selected === opt.name;
											}
										}
									}

									return (
										<Pressable key={key} onPress={() => { onSelect(opt); setOpen(false); }} style={{ paddingVertical: 14, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', backgroundColor: '#fff' }}>
											<Text style={{ color: '#111', fontWeight: isSelected ? '700' as any : '400' as any }}>{text}</Text>
										</Pressable>
									);
								})}
							</ScrollView>
							<Pressable onPress={() => setOpen(false)} style={{ padding: 12, alignItems: 'center' }}>
								<Text style={{ color: '#6b7280' }}>Cancel</Text>
							</Pressable>
						</View>
					</View>
				</TouchableWithoutFeedback>
			</Modal>
		</>
	);
};

export default function SignupScreen() {
	const insets = useSafeAreaInsets();
	// keyboard offset for KeyboardAvoidingView (bigger on iOS)
	const keyboardVerticalOffset = insets.top + 80;
	// fixed buttons bottom spacing from screen edge (no longer needed since buttons scroll)

	const { login } = useAuth();
	const router = useRouter();

	// step: 0 = register, 1 = academics
	const [step, setStep] = useState<number>(0);

	// registration fields
	const [username, setUsername] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");

	// saved after register (do NOT call AuthProvider.login yet)
	// (no server-side user created until final submit)

	// we removed the socials step; socials/bio will be empty strings by default

	// academics
	const [majors, setMajors] = useState<any[]>([]);
	const [faculties, setFaculties] = useState<any[]>([]);
	const [studyEnum, setStudyEnum] = useState<any[]>([]);
	const [clubEnum, setClubEnum] = useState<any[]>([]);

	const [majorId, setMajorId] = useState<number | null>(null);
	const [facultyId, setFacultyId] = useState<number | null>(null);
	const [studyYear, setStudyYear] = useState("1");
	const [studyStatus, setStudyStatus] = useState<string | null>(null);
	const [clubStatus, setClubStatus] = useState<string | null>(null);

	const [loading, setLoading] = useState(false);

	// ref to the ScrollView so we can programmatically scroll inputs into view
	const scrollRef = useRef<ScrollView | null>(null);

	// when an input is focused, measure its position relative to the ScrollView and scroll it into view
	const handleFocus = (e: any) => {
		try {
			const node = e?.nativeEvent?.target;
			const scrollNode = findNodeHandle(scrollRef.current as any);
			if (!node || !scrollNode) return;
			// measureLayout gives coordinates relative to the scroll container (left, top, width, height)
			UIManager.measureLayout(
				node,
				scrollNode,
				() => {
					/* failure - ignore */
				},
				(_left: number, top: number, _width: number, _height: number) => {
					// `top` is the Y position inside the ScrollView content. Scroll so the field sits a bit below the top
					const desired = Math.max(0, top - 16);
					setTimeout(() => scrollRef.current?.scrollTo({ y: desired, animated: true }), 50);
				}
			);
		} catch (err) {
			console.warn('focus scroll failed', err);
		}
	};

		// (InputField moved to module scope to avoid remounting on each render)

		const handleRegister = async () => {
			// client-side checks
			if (!username.trim()) return Alert.alert("Please enter a username");
			if (!email.trim()) return Alert.alert("Please enter an email");
			if (!password) return Alert.alert("Please enter a password");
			if (password !== confirm) return Alert.alert("Passwords don't match");

			setLoading(true);
			try {
				// check availability on the backend
				const res = await api.post("/api/auth/check", {
					username: username.trim(),
					email: email.trim(),
				});
				const data = res.data || {};
				if (data.available !== true) {
					const field = data.field || 'username/email';
					Alert.alert('Validation failed', `${String(field)} is already in use`);
					return;
				}
				// validation passed -> advance to socials step
				setStep(1);
			} catch (err: any) {
				const message =
					err?.response?.data?.error ||
					err?.response?.data?.message ||
					err.message ||
					"Validation failed";
				Alert.alert("Validation error", message);
			} finally {
				setLoading(false);
			}
		};

		const submitProfile = async () => {
			// final registration: send all user info in one request
			setLoading(true);
			try {
				const selectedMajor = majors.find((m: any) => m.id === majorId);
				const selectedFaculty = faculties.find((f: any) => f.id === facultyId);

				const registerPayload = {
					username: username.trim(),
					email: email.trim(),
					password,
					bio: "",
					avatarUrl: "",
					twitterUrl: "",
					instagramUrl: "",
					discordUrl: "",
					linkedinUrl: "",
					// send names instead of numeric ids per API requirement
					major: selectedMajor?.major_name ?? selectedMajor?.name ?? null,
					faculty: selectedFaculty?.faculty_name ?? selectedFaculty?.name ?? null,
					studyYear,
					studyStatus,
					clubStatus,
				};

				const res = await api.post('/api/auth/register', registerPayload);
				const data = res.data || {};
				const newUserId = data?.user?.id ?? data?.id ?? null;
				if (!newUserId || !Number.isFinite(Number(newUserId))) {
					throw new Error('Server did not return a valid user id');
				}

				const tokens = { accessToken: data.accessToken, refreshToken: data.refreshToken };
				// persist tokens
				if (tokens.accessToken || tokens.refreshToken) {
					await saveTokens(tokens.accessToken ?? '', tokens.refreshToken ?? '');
				}

				// finish signup: login and enter app
				await login(Number(newUserId), tokens);
				router.replace('/(tabs)/home' as any);
			} catch (err: any) {
				console.warn('final registration failed', err);
				const message =
					err?.response?.data?.error ||
					err?.response?.data?.message ||
					err.message ||
					'Registration failed';
				Alert.alert('Registration error', message);
			} finally {
				setLoading(false);
			}
		};

	// helper navigation / skips
	const handleSkipAcademics = async () => {
		await submitProfile();
	};

	const goBack = () => {
		if (step === 0) return router.back();
		setStep((s) => s - 1);
	};

	useEffect(() => {
		// load academics dropdowns when we reach the academics step
		if (step !== 1) return;
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
				console.warn("failed to load dropdowns", e);
			}
		})();
	}, [step]);

	return (
		<View style={StyleSheet.absoluteFill} className="bg-backgroundLight">
			<LottieView
				source={require("@/assets/animations/gradient-bg.json")}
				autoPlay
				loop
				style={{ width: "100%", height: "100%" }}
				resizeMode="cover"
			/>

			<View
				style={{
					...StyleSheet.absoluteFillObject,
					width: "100%",
					flexDirection: "column",
					paddingHorizontal: 36,
					justifyContent: "flex-start",
				}}
			>
				<View
					style={{
						flex: 0.25,
						justifyContent: "center",
						alignItems: "center",
						paddingTop: insets.top + 12,
					}}
				>
					<Text className="text-5xl font-inter-light">sign up</Text>
				</View>

				<View style={{ flex: 1 }}>
					<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={keyboardVerticalOffset} style={{ flex: 1 }}>
						<TouchableWithoutFeedback onPress={() => Keyboard.dismiss()} accessible={false}>
							<ScrollView
								contentContainerStyle={{
									width: "100%",
									alignItems: "center",
									paddingTop: 8,
									// leave extra bottom padding so inputs and long option lists can scroll above buttons
									paddingBottom: insets.bottom + 260,
									flexGrow: 1,
								}}
								keyboardShouldPersistTaps="handled"
								ref={(r) => { scrollRef.current = r; }}
							>
						{step === 0 && (
							<>
								<InputField
									value={username}
									onChangeText={setUsername}
									placeholder="username"
									className="mt-4"
									style={{ opacity: loading ? 0.6 : 1 }}
									onFocus={handleFocus}
								/>
								<InputField
									value={email}
									onChangeText={setEmail}
									placeholder="email"
									keyboardType="email-address"
									autoCapitalize="none"
									style={{ opacity: loading ? 0.6 : 1 }}
									onFocus={handleFocus}
								/>
								<InputField
									value={password}
									onChangeText={setPassword}
									placeholder="password"
									secureTextEntry
									style={{ opacity: loading ? 0.6 : 1 }}
									onFocus={handleFocus}
								/>
								<InputField
									value={confirm}
									onChangeText={setConfirm}
									placeholder="confirm password"
									secureTextEntry
									style={{ opacity: loading ? 0.6 : 1 }}
									onFocus={handleFocus}
								/>
							</>
						)}

						{/* socials step removed - we go straight from credentials to academics */}

						{step === 1 && (
							<>
								{/* simple list selection */}
								{majors.length === 0 ? (
									<Text className="text-caption">Loading majors...</Text>
								) : (
									<Dropdown
										options={majors}
										selected={majors.find((mm: any) => mm.id === majorId)}
										onSelect={(item: any) => { setMajorId(item.id); setFacultyId(item.faculty_id ?? item.facultyId ?? null); }}
										getLabel={(it: any) => it.major_name ?? it.name}
										placeholder="select major"
									/>
								)}

								{faculties.length === 0 ? (
									<Text className="text-caption">loading faculties...</Text>
								) : (
									<Dropdown
										options={faculties}
										selected={faculties.find((ff: any) => ff.id === facultyId)}
										onSelect={(item: any) => setFacultyId(item.id)}
										getLabel={(it: any) => it.faculty_name ?? it.name}
										placeholder="select faculty"
									/>
								)}

								{/* study year stepper (label integrated into control for a cleaner layout) */}
								<View className="w-11/12 mb-3 rounded-3xl" style={[styles.inputShadow, { backgroundColor: '#fff', paddingVertical: 10, paddingHorizontal: 12 }]}> 
									<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
										{/* label on the left to avoid feeling squeezed */}
										<View style={{ flex: 1 }}>
											<Text className="mx-2" style={{ color: '#666'}}>year of study</Text>
										</View>
										{/* controls on the right */}
										<View style={{ flexDirection: 'row', alignItems: 'center' }}>
											<Pressable
												onPress={() => {
												const cur = parseInt(studyYear || '0', 10) || 0;
												const next = Math.max(1, cur - 1);
												setStudyYear(String(next));
											}}
											className="px-4 py-2 rounded-2xl"
											style={{ backgroundColor: '#f3f4f6', marginRight: 8 }}
										>
											<Text style={{ fontSize: 20 }}>−</Text>
										</Pressable>
											<View style={{ minWidth: 28, alignItems: 'center' }}>
												<Text style={{ fontSize: 16, color: '#111' }}>{studyYear || '1'}</Text>
											</View>
											<Pressable
												onPress={() => {
												const cur = parseInt(studyYear || '0', 10) || 0;
												const next = Math.min(10, cur + 1);
												setStudyYear(String(next));
											}}
											className="px-4 py-2 rounded-2xl"
											style={{ backgroundColor: '#f3f4f6', marginLeft: 8 }}
										>
											<Text style={{ fontSize: 20 }}>+</Text>
										</Pressable>
										</View>
									</View>
								</View>

								{studyEnum.length === 0 ? (
									<Text className="text-caption">loading...</Text>
								) : (
									<Dropdown
										options={studyEnum}
										selected={studyEnum.find((x: any) => x.enumlabel === studyStatus)}
										onSelect={(item: any) => setStudyStatus(item.enumlabel)}
										getLabel={(it: any) => it.enumlabel}
										placeholder="select study status"
									/>
								)}

								{clubEnum.length === 0 ? (
									<Text className="text-caption">loading...</Text>
								) : (
									<Dropdown
										options={clubEnum}
										selected={clubEnum.find((x: any) => x.enumlabel === clubStatus)}
										onSelect={(item: any) => setClubStatus(item.enumlabel)}
										getLabel={(it: any) => it.enumlabel}
										placeholder="select club status"
									/>
								)}
							</>
						)}
							
						{/* Buttons: move into ScrollView so fields + buttons scroll together (title remains fixed) */}
						<View style={{ width: '100%', alignItems: 'center', marginTop: 12 }}>
							{step === 0 && (
								<Pressable
									onPress={handleRegister}
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
									<Text className="text-black font-inter-bold">
										{loading ? "registering..." : "continue"}
									</Text>
								</Pressable>
							)}

                            

							{step === 1 && (
								<>
									<Pressable
										onPress={submitProfile}
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
										<Text className="text-black font-inter-bold">
											{loading ? "saving..." : "finish"}
										</Text>
									</Pressable>
									<Pressable
										onPress={handleSkipAcademics}
										className="bg-white px-6 py-5 rounded-3xl mb-3 w-11/12 items-center"
										style={{
											shadowColor: "#000",
											shadowOffset: { width: 0, height: 4 },
											shadowOpacity: 0.25,
											shadowRadius: 6,
											elevation: 6,
											opacity: loading ? 0.6 : 1,
										}}
									>
										<Text className="text-black font-inter-bold">skip</Text>
									</Pressable>
								</>
							)}

							{/* back button placed last */}
							<Pressable
								onPress={goBack}
								className="px-6 py-4 rounded-3xl w-11/12 items-center"
							>
								<Text className="text-black font-inter-regular underline">back</Text>
							</Pressable>
						</View>

						</ScrollView>
					</TouchableWithoutFeedback>
				</KeyboardAvoidingView>
			</View>
			</View>
		</View>
	);
}
