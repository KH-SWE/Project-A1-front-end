import React from "react";
import { View, Text } from "react-native";
import GradCapIcon from "@/assets/profile/grad-cap.svg";
import SchoolIcon from "@/assets/profile/school.svg";
import HashtagIcon from "@/assets/profile/hashtag.svg";
import CircleIcon from "@/assets/profile/circle.svg";
import { colors } from "../constants/colors";

type Props = {
  profile: any;
};

export default function AcademicsCard({ profile }: Props) {
  return (
    <View className="w-full max-w-lg bg-white rounded-3xl shadow-lg p-4 my-2">
      <View className="flex-row items-center mb-3">
        <GradCapIcon width={20} height={20} fill={colors.accent} />
        <Text style={{ fontFamily: "Inter" }} className="ml-3 text-sm font-semibold">
          {profile?.major ?? "—"}
        </Text>
      </View>
      <View className="flex-row items-center mb-3">
        <SchoolIcon width={20} height={20} fill={colors.accent} />
        <Text style={{ fontFamily: "Inter" }} className="ml-3 text-sm font-semibold">
          {profile?.faculty ?? "—"}
        </Text>
      </View>
      <View className="flex-row items-center mb-3">
        <HashtagIcon width={20} height={20} fill={colors.accent} />
        <Text style={{ fontFamily: "Inter" }} className="ml-3 text-sm font-semibold">
          {profile?.study_year ? `${profile.study_year}th Year` : "—"}
        </Text>
      </View>
      <View className="flex-row items-center">
        <CircleIcon width={20} height={20} fill={colors.accent} />
        <Text style={{ fontFamily: "Inter" }} className="ml-3 text-sm font-semibold">
          {`${profile?.study_status ?? "—"}${profile?.club_status ? `, ${profile.club_status}` : ""}`}
        </Text>
      </View>
    </View>
  );
}
