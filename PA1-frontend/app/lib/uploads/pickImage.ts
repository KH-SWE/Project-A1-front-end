import * as ImagePicker from "expo-image-picker";
import { UploadFile } from "./uploadToS3";

type PickImageOptions = {
  aspect?: [number, number];
  quality?: number; // 0..1
  suggestedName?: string; // fallback filename
};

export async function pickImage(options: PickImageOptions = {}): Promise<UploadFile | null> {
  const { aspect, quality = 0.8, suggestedName = "image.jpg" } = options;

  const result = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: true,
    quality,
    ...(aspect ? { aspect } : {}),
  });

  if (result.canceled) return null;

  const asset = result.assets[0];
  const file: UploadFile = {
    uri: asset.uri,
    fileName: asset.fileName ?? suggestedName,
    type: asset.mimeType ?? "image/jpeg",
  };
  return file;
}
