import React from "react";
import { View, Pressable } from "react-native";
import InstaIcon from "@/assets/social/instagram.svg";
import LinkedInIcon from "@/assets/social/linkedin.svg";
import TwitterIcon from "@/assets/social/twitter.svg";
import DiscordIcon from "@/assets/social/discord.svg";
import { colors } from "../constants/colors";

type Props = {
  instagramUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  discordUrl?: string;
  onOpenUrl?: (url?: string) => void;
};

export default function SocialRow({ instagramUrl, linkedinUrl, twitterUrl, discordUrl, onOpenUrl }: Props) {
  const open = (url?: string) => {
    if (!url) return;
    onOpenUrl?.(url);
  }

  return (
    <View className="w-full max-w-lg flex-row items-center justify-between px-4 my-2">
      <Pressable onPress={() => open(instagramUrl)} disabled={!instagramUrl} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={{ padding: 8, borderRadius: 24 }} accessibilityRole="link">
        <InstaIcon width={32} height={32} fill={instagramUrl ? colors.textAccent : "#d1d5db"} />
      </Pressable>
      <Pressable onPress={() => open(linkedinUrl)} disabled={!linkedinUrl} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={{ padding: 8, borderRadius: 24 }} accessibilityRole="link">
        <LinkedInIcon width={32} height={32} fill={linkedinUrl ? colors.textAccent : "#d1d5db"} />
      </Pressable>
      <Pressable onPress={() => open(twitterUrl)} disabled={!twitterUrl} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={{ padding: 8, borderRadius: 24 }} accessibilityRole="link">
        <TwitterIcon width={32} height={32} fill={twitterUrl ? colors.textAccent : "#d1d5db"} />
      </Pressable>
      <Pressable onPress={() => open(discordUrl)} disabled={!discordUrl} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={{ padding: 8, borderRadius: 24 }} accessibilityRole="link">
        <DiscordIcon width={32} height={32} fill={discordUrl ? colors.textAccent : "#d1d5db"} />
      </Pressable>
    </View>
  );
}
