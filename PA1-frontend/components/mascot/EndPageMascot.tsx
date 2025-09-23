import { View, Text, Image } from "react-native";
import DinoMascot from "../../assets/mascot/dino-mascot-1.png";

export default function EndPageMascot() {
    return (
        <View className="absolute bottom-40 items-center opacity-40">
            <Image source={DinoMascot} className="w-36 h-36" />
            <Text>that&apos;s all!</Text>
        </View>
    );
}