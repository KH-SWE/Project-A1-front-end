import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { api } from "./lib/api";
import { pickImage } from "./lib/uploads/pickImage";
import { uploadToS3, UploadFile } from "./lib/uploads/uploadToS3";

export default function CreateClubScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [avatarFile, setAvatarFile] = useState<UploadFile | null>(null);
  const [bannerFile, setBannerFile] = useState<UploadFile | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [discordUrl, setDiscordUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  // Tags
  const [tags, setTags] = useState<{id:number; tag_category:string; tag_name:string}[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<Set<number>>(new Set());
  const [tagModalOpen, setTagModalOpen] = useState(false);

  const onCancel = () => {
    router.back();
  };

  const toggleTag = (id: number) => {
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get("/api/users/tags");
        if (!mounted) return;
        const list: any[] = Array.isArray(res?.data) ? res.data : [];
        setTags(list.map((t) => ({ id: t.id, tag_category: t.tag_category, tag_name: t.tag_name })));
      } catch (e) {
        console.warn("load tags failed", e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const tagsByCategory = useMemo(() => {
    const map = new Map<string, {id:number; tag_name:string}[]>();
    for (const t of tags) {
      const key = t.tag_category || "Other";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push({ id: t.id, tag_name: t.tag_name });
    }
    return map;
  }, [tags]);

  const onSave = async () => {
    if (!name.trim()) {
      Alert.alert("Create club", "Name is required.");
      return;
    }

    // Upload images first if provided
    let avatarUrl: string | undefined = undefined;
    let bannerUrl: string | undefined = undefined;
    try {
      if (avatarFile) {
        avatarUrl = await uploadToS3(avatarFile, "club-avatars");
      }
      if (bannerFile) {
        bannerUrl = await uploadToS3(bannerFile, "club-banners");
      }
    } catch (upErr) {
      console.warn("image upload failed", upErr);
      Alert.alert("Create club", "Failed to upload images. Please try again.");
      setSaving(false);
      return;
    }

    const body = {
      name: name.trim(),
      description: description.trim(),
      avatarUrl,
      bannerUrl,
      websiteUrl: websiteUrl.trim() || undefined,
      instagramUrl: instagramUrl.trim() || undefined,
      discordUrl: discordUrl.trim() || undefined,
      tiktokUrl: tiktokUrl.trim() || undefined,
      linkedinUrl: linkedinUrl.trim() || undefined,
      twitterUrl: twitterUrl.trim() || undefined,
      tagIds: Array.from(selectedTagIds),
    };

    setSaving(true);
    try {
      await api.post("/api/clubs/", body);
      Alert.alert("Create club", "Club created successfully.");
      // Go to Community tab; community screen fetches clubs on mount
      router.replace("/(tabs)/community" as any);
    } catch (e: any) {
      console.warn("create club failed", e?.response?.data || e?.message || e);
      const msg =
        e?.response?.data?.error || e?.response?.data?.message || "Failed to create club";
      Alert.alert("Create club", String(msg));
    } finally {
      setSaving(false);
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
      keyboardShouldPersistTaps="handled"
    >
      <Text className="text-4xl text-left font-inter-black mb-3">
        New Club
      </Text>

      {/* Basic fields */}
  <Text className="font-inter-regular mb-1.5 text-base text-textOnBgLight">Name *</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Club name"
        style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 8, marginBottom: 12 }}
      />

  <Text className="font-inter-regular mb-1.5 text-base text-textOnBgLight">Description</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="What is this club about?"
        multiline
        style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 8, marginBottom: 12, minHeight: 80, textAlignVertical: "top" }}
      />

      {/* Avatar and Banner pickers */}
  <Text className="font-inter-regular mb-1.5 text-base text-textOnBgLight">Avatar</Text>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
        {avatarFile ? (
          <Image source={{ uri: avatarFile.uri }} style={{ width: 64, height: 64, borderRadius: 12, marginRight: 12, backgroundColor: "#f3f4f6" }} />
        ) : (
          <View style={{ width: 64, height: 64, borderRadius: 12, marginRight: 12, backgroundColor: "#f3f4f6" }} />
        )}
        <Pressable
          onPress={async () => {
            const file = await pickImage({ aspect: [1,1], suggestedName: `club-avatar-${Date.now()}.jpg` });
            if (file) setAvatarFile(file);
          }}
          style={{ paddingVertical: 10, paddingHorizontal: 14, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, alignItems: "center" }}
        >
          <Text className="font-inter-regular text-textOnBgLight text-base">Pick avatar</Text>
        </Pressable>
      </View>

  <Text className="font-inter-regular mb-1.5 text-base text-textOnBgLight">Banner</Text>
      <View style={{ marginBottom: 12 }}>
        {bannerFile ? (
          <Image source={{ uri: bannerFile.uri }} style={{ width: "100%", height: 140, borderRadius: 12, backgroundColor: "#f3f4f6" }} />
        ) : (
          <View style={{ width: "100%", height: 140, borderRadius: 12, backgroundColor: "#f3f4f6" }} />
        )}
        <View style={{ marginTop: 8 }}>
          <Pressable
            onPress={async () => {
              const file = await pickImage({ aspect: [3,1], suggestedName: `club-banner-${Date.now()}.jpg` });
              if (file) setBannerFile(file);
            }}
            style={{ paddingVertical: 10, paddingHorizontal: 14, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, alignItems: "center" }}
          >
            <Text className="font-inter-regular text-textOnBgLight text-base">Pick banner</Text>
          </Pressable>
        </View>
      </View>

  <Text className="font-inter-regular mb-1.5 text-base text-textOnBgLight">Website</Text>
      <TextInput value={websiteUrl} onChangeText={setWebsiteUrl} placeholder="https://..." style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 8, marginBottom: 12 }} />

  <Text className="font-inter-regular mb-1.5 text-base text-textOnBgLight">Instagram</Text>
      <TextInput value={instagramUrl} onChangeText={setInstagramUrl} placeholder="https://instagram.com/..." style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 8, marginBottom: 12 }} />

  <Text className="font-inter-regular mb-1.5 text-base text-textOnBgLight">Discord</Text>
      <TextInput value={discordUrl} onChangeText={setDiscordUrl} placeholder="https://discord.gg/..." style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 8, marginBottom: 12 }} />

  <Text className="font-inter-regular mb-1.5 text-base text-textOnBgLight">TikTok</Text>
      <TextInput value={tiktokUrl} onChangeText={setTiktokUrl} placeholder="https://tiktok.com/@..." style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 8, marginBottom: 12 }} />

  <Text className="font-inter-regular mb-1.5 text-base text-textOnBgLight">LinkedIn</Text>
      <TextInput value={linkedinUrl} onChangeText={setLinkedinUrl} placeholder="https://linkedin.com/company/..." style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 8, marginBottom: 12 }} />

  <Text className="font-inter-regular mb-1.5 text-base text-textOnBgLight">Twitter/X</Text>
      <TextInput value={twitterUrl} onChangeText={setTwitterUrl} placeholder="https://twitter.com/..." style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 8, marginBottom: 12 }} />

      {/* Tags selector */}
  <Text className="font-inter-regular mb-1.5 text-base text-textOnBgLight">Tags</Text>
      <Pressable
        onPress={() => setTagModalOpen(true)}
        style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 12, marginBottom: 12 }}
      >
        <Text className="font-inter-regular text-base text-textOnBgLight">
          {selectedTagIds.size > 0 ? `${selectedTagIds.size} selected` : "Select tags"}
        </Text>
      </Pressable>

      <Modal visible={tagModalOpen} transparent animationType="fade" onRequestClose={() => setTagModalOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)" }} onPress={() => setTagModalOpen(false)}>
          <View style={{ justifyContent: "flex-end", flex: 1 }}>
            <View style={{ backgroundColor: "#fff", paddingVertical: 8, paddingHorizontal: 10, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: "70%" }}>
              <View style={{ alignItems: "center", paddingVertical: 6 }}>
                <View style={{ width: 40, height: 4, backgroundColor: "#e5e7eb", borderRadius: 4 }} />
              </View>
              <ScrollView>
                {Array.from(tagsByCategory.entries()).map(([cat, list]) => (
                  <View key={cat} style={{ marginBottom: 10 }}>
                    <Text className="font-inter-bold mb-1.5 text-base text-textOnBgLight">{cat}</Text>
                    {list.map((t) => {
                      const checked = selectedTagIds.has(t.id);
                      return (
                        <Pressable key={t.id} onPress={() => toggleTag(t.id)} style={{ paddingVertical: 10, flexDirection: "row", alignItems: "center" }}>
                          <View style={{ width: 20, height: 20, borderRadius: 4, marginRight: 10, borderWidth: 1, borderColor: checked ? "#111" : "#d1d5db", backgroundColor: checked ? "#111" : "#fff" }} />
                          <Text className="font-inter-regular text-base text-textOnBgLight">{t.tag_name}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ))}
              </ScrollView>
              <Pressable onPress={() => setTagModalOpen(false)} style={{ padding: 12, alignItems: "center" }}>
                <Text className="text-gray-500 font-inter-regular text-base">Done</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Actions */}
      <View style={{ width: "100%", marginTop: 4 }}>
        <Pressable
          onPress={onSave}
          disabled={saving}
          style={{ width: "100%", backgroundColor: saving ? "#9ca3af" : "#FFE374", borderRadius: 12, paddingVertical: 14, alignItems: "center", marginBottom: 12 }}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="font-inter-medium text-base text-black">Create</Text>
          )}
        </Pressable>
        <Pressable onPress={onCancel} style={{ width: "100%", backgroundColor: "#f3f4f6", borderRadius: 12, paddingVertical: 14, alignItems: "center" }}>
          <Text className="font-inter-regular text-base text-gray-700">Cancel</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
