import { View, Text, ScrollView } from "react-native";

import { colors } from "../constants/colors";

import GradCapIcon from "@/assets/profile/grad-cap.svg";
import SchoolIcon from "@/assets/profile/school.svg";
import HashtagIcon from "@/assets/profile/hashtag.svg";
import CircleIcon from "@/assets/profile/circle.svg";

import InstaIcon from "@/assets/social/instagram.svg";
import LinkedInIcon from "@/assets/social/linkedin.svg";
import TwitterIcon from "@/assets/social/twitter.svg";
import DiscordIcon from "@/assets/social/discord.svg";
import EndPageMascot from "./mascot/EndPageMascot";

export default function ProfileView() {
	return (
		<ScrollView
			className="flex flex-col bg-backgroundLight w-full h-full"
			contentContainerStyle={{
				flexGrow: 1,
				alignItems: "center",
				justifyContent: "center",
				gap: 10,
			}}
		>
            {/* Main container for profile info */}
			<View className="mx-4 my-14 absolute top-0">
				{/* Profile pic, name, and bio section */}
				<View className="">
					{/* Profile pic & name section */}
					<View className="flex flex-row items-center justify-start">
						{/* Profile pic */}
						<View className="m-4">
							{/* want to put profile pic here */}
							{/* Placeholder circle for profile pic */}
							<View className="w-28 h-28 bg-blue-500 rounded-full shadow-lg"></View>
						</View>
						{/* Name, username, and pronouns */}
						<View className="m-4 items-left">
							<Text className="text-heading">John Doe</Text>
							<Text className="text-button text-textAccent">@johndoe</Text>
							<Text className="text-caption text-textOnBgLight">He / Him</Text>
						</View>
					</View>
					{/* Bio section */}
					<View className="m-4">
						<Text className="text-caption text-textOnBgLight">
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
							eiusmod tempor incididunt ut labore et dolore magna aliqua.
						</Text>
					</View>
				</View>

                {/* Academic info and social links section */}
                <View className="flex flex-row items-center justify-between m-2">
                    {/* Card */}
                    <View className="flex flex-col items-start gap-3 p-5 shadow-lg bg-backgroundLight w-auto rounded-3xl">
                        {/* Major/Minor */}
                        <View className="flex-row items-center">
                            <View className="mr-4"><GradCapIcon width={24} height={24} fill={colors.accent}/></View>
                            <Text className="text-caption font-semibold">Mechanical Engineering</Text>
                        </View>
                        {/* Faculty */}
                        <View className="flex-row items-center">
                            <View className="mr-4"><SchoolIcon width={24} height={24} fill={colors.accent}/></View>
                            <Text className="text-caption font-semibold">Schulich School of Engineering</Text>
                        </View>
                        {/* Year of Study */}
                        <View className="flex-row items-center">
                            <View className="mr-4"><HashtagIcon width={24} height={24} fill={colors.accent}/></View>
                            <Text className="text-caption font-semibold">4th Year</Text>
                        </View>
                        {/* Status */}
                        <View className="flex-row items-center">
                            <View className="mr-4"><CircleIcon width={24} height={24} fill={colors.accent}/></View>
                            <Text className="text-caption font-semibold">Open to Study Groups, Clubs</Text>
                        </View>
                    </View>

                    {/* Social Links */}
                    <View className="flex-col items-center mx-2 justify-center gap-4">
                        <InstaIcon width={24} height={24} fill={colors.textAccent} className="shadow-lg"/>
                        <LinkedInIcon width={24} height={24} fill={colors.textAccent} className="shadow-lg"/>
                        <TwitterIcon width={24} height={24} fill={colors.textAccent} className="shadow-lg"/>
                        <DiscordIcon width={24} height={24} fill={colors.textAccent} className="shadow-lg"/>
                    </View>
                </View>
			</View>
            <EndPageMascot />
		</ScrollView>
	);
}
