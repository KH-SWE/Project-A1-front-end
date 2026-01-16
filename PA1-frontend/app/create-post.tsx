import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { api } from "./lib/api";
import { colors } from "@/constants/colors";

export default function CreatePost() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSubmitPost = async () => {
    if (!content.trim()) {
      Alert.alert("Error", "Post content cannot be empty");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        title: title || "Untitled",
        content,
        postType: "Discussion",
        clubId: null,
        isFromClub: false,
      };

      console.log("📤 Sending post payload:", JSON.stringify(payload, null, 2));

      const response = await api.post("/api/posts", payload);

      console.log("✅ Post response:", response.status, response.data);

      if (response.status === 201) {
        Alert.alert("Success", "Post created successfully!");
        router.back();
      }
    } catch (error: any) {
      console.error("❌ Failed to create post:");
      console.error("Error message:", error.message);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      console.error("Full error:", error);
      
      Alert.alert("Error", error.response?.data?.error || error.message || "Failed to create post");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.backgroundLight,
        padding: 20,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <Text className="font-inter-bold text-2xl text-textOnBgLight">
          New Discussion
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="font-inter-semibold text-lg text-accent">
            ✕
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View style={{ marginBottom: 20 }}>
          <Text className="font-inter-semibold text-textOnBgLight mb-2">
            Title (Optional)
          </Text>
          <TextInput
            placeholder="Give your discussion a title..."
            value={title}
            onChangeText={setTitle}
            placeholderTextColor={colors.accent}
            style={{
              borderWidth: 1,
              borderColor: colors.accent,
              borderRadius: 8,
              padding: 12,
              color: colors.textOnBgLight,
              fontFamily: "Inter_400Regular",
            }}
          />
        </View>

        <View style={{ marginBottom: 20, flex: 1 }}>
          <Text className="font-inter-semibold text-textOnBgLight mb-2">
            What's on your mind?
          </Text>
          <TextInput
            placeholder="Share your thoughts..."
            value={content}
            onChangeText={setContent}
            placeholderTextColor={colors.accent}
            multiline
            numberOfLines={8}
            style={{
              borderWidth: 1,
              borderColor: colors.accent,
              borderRadius: 8,
              padding: 12,
              color: colors.textOnBgLight,
              fontFamily: "Inter_400Regular",
              textAlignVertical: "top",
            }}
          />
        </View>

        <View
          style={{
            flexDirection: "row",
            gap: 12,
            justifyContent: "flex-end",
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: colors.accent,
            }}
          >
            <Text className="font-inter-semibold text-accent">Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSubmitPost}
            disabled={submitting || !content.trim()}
            style={{
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: 8,
              backgroundColor: colors.primary,
              opacity: submitting || !content.trim() ? 0.6 : 1,
            }}
          >
            <Text className="font-inter-semibold text-backgroundLight">
              {submitting ? "Posting..." : "Post"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
