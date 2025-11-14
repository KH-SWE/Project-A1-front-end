import * as ImagePicker from "expo-image-picker";
import { UploadFile } from "./uploadToS3";

// Picks an image from the library and returns a file descriptor suitable for upload.
// NOTE: this does NOT upload to S3. Upload should occur on Save to avoid orphaned files.
export async function pickAvatar(userId: number): Promise<UploadFile | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
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

  return file;
}