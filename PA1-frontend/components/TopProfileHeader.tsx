import React from "react";
import { View, Text, Image, Pressable } from "react-native";
import { colors } from "../constants/colors";
import SettingsIcon from "@/assets/icons/settings-gear.svg";

type Props = {
  avatarUrl?: string | undefined;
  displayName: string;
  handle?: string;
  userId?: string | number | null;
  onEdit?: () => void;
};

export default function TopProfileHeader({
  avatarUrl,
  displayName,
  handle,
  userId,
  onEdit,
}: Props) {
  return (
    <View className="w-full max-w-lg bg-backgroundLight" style={{ position: "relative" }}>
      <View className="flex-row items-center">
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
              elevation: 6,
            }}
          >
            <Image
              source={{ uri: avatarUrl }}
              style={{ width: 96, height: 96, borderRadius: 48 }}
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
              elevation: 6,
            }}
          >
            <View style={{ width: 96, height: 96, borderRadius: 48 }} className="bg-blue-500" />
          </View>
        )}
        <View style={{ marginLeft: 16, flex: 1 }}>
          <Text className="text-2xl font-inter-extrabold">{displayName}</Text>
          {handle ? (
            <Text className="text-sm font-inter text-textAccent mt-1">
              {handle}
            </Text>
          ) : null}
          <Text className="text-xs font-inter text-textOnBgLight mt-2">
            id: {userId ?? "(none)"}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={onEdit}
        style={{ position: "absolute", right: 12, top: 12, padding: 8 }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityLabel="Edit profile"
      >
        <SettingsIcon width={25} height={25} fill={colors.textAccent} />
      </Pressable>

    </View>
  );
}
