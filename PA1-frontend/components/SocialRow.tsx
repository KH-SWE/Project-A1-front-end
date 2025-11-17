import React, { useMemo } from "react";
import { View, Pressable } from "react-native";
import InstaIcon from "@/assets/social/instagram.svg";
import LinkedInIcon from "@/assets/social/linkedin.svg";
import TwitterIcon from "@/assets/social/twitter.svg";
import DiscordIcon from "@/assets/social/discord.svg";
import TiktokIcon from "@/assets/social/tiktok.svg";
import WebIcon from "@/assets/social/web.svg";
import { colors } from "../constants/colors";
import { shadows } from "../constants/shadows";

type Props = {
  websiteUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  discordUrl?: string;
  tiktokUrl?: string;
  onOpenUrl?: (url?: string) => void;
};

export default function SocialRow({ websiteUrl, instagramUrl, linkedinUrl, twitterUrl, discordUrl, tiktokUrl, onOpenUrl }: Props) {
  const open = (url?: string) => {
    if (!url) return;
    onOpenUrl?.(url);
  }

  const items = useMemo(() => {
    const list: { key: string; url?: string; render: () => React.ReactNode }[] = [];
    if (websiteUrl) list.push({ key: "web", url: websiteUrl, render: () => <WebIcon width={32} height={32} fill={colors.textAccent} /> });
    if (instagramUrl) list.push({ key: "ig", url: instagramUrl, render: () => <InstaIcon width={32} height={32} fill={colors.textAccent} /> });
    if (linkedinUrl) list.push({ key: "li", url: linkedinUrl, render: () => <LinkedInIcon width={32} height={32} fill={colors.textAccent} /> });
    if (twitterUrl) list.push({ key: "tw", url: twitterUrl, render: () => <TwitterIcon width={32} height={32} fill={colors.textAccent} /> });
    if (discordUrl) list.push({ key: "dc", url: discordUrl, render: () => <DiscordIcon width={32} height={32} fill={colors.textAccent} /> });
    if (tiktokUrl) list.push({ key: "tt", url: tiktokUrl, render: () => <TiktokIcon width={32} height={32} fill={colors.textAccent} /> });
    return list;
  }, [websiteUrl, instagramUrl, linkedinUrl, twitterUrl, discordUrl, tiktokUrl]);

  if (items.length === 0) return null;

  return (
    <View className="w-full max-w-lg flex-row items-center px-4 my-2" style={{ flexWrap: "wrap" }}>
      {items.map((it, idx) => (
        <Pressable
          key={it.key}
          onPress={() => open(it.url)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{ padding: 8, borderRadius: 24, marginRight: 8, marginBottom: 4, ...shadows.soft }}
          accessibilityRole="link"
        >
          {it.render()}
        </Pressable>
      ))}
    </View>
  );
}
