import * as ImagePicker from "expo-image-picker";
import { uploadToS3, UploadFile } from "./uploadToS3";

export async function pickAndUploadAvatar(userId: number): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    // mediaTypes option (MediaTypeOptions) is deprecated in newer expo-image-picker versions.
    // Omitting it defaults to images on most platforms; keep other options explicit.
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled) return null;

  const asset = result.assets[0];

  const file: UploadFile = {
    uri: asset.uri,
    fileName: asset.fileName ?? `avatar-${userId}.jpg`,
    type: asset.mimeType ?? "image/jpeg",
  };

  try {
    // Upload to S3 and return the public URL.
    const url = await uploadToS3(file, "avatars");
    return url;
  } catch (err) {
    console.warn("pickAndUploadAvatar: upload failed", err);
    throw err;
  }
}