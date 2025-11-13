import { api } from "../api";

export type UploadFile = {
	uri: string;
	fileName: string;
	type: string; // MIME type, e.g., image/jpeg
};

export async function uploadToS3(
	file: UploadFile,
	folder: string = "uploads"
): Promise<string> {
	const { fileName, type: fileType } = file;

	// 1. Request signed URL
	const { data } = await api.post("/api/upload/signed-url", {
		fileName,
		fileType,
		folder,
	});

	// 2. Upload file to S3
	const response = await fetch(data.uploadUrl, {
		method: "PUT",
		headers: { "Content-Type": fileType },
		body: await fileToBlob(file.uri),
	});

	if (!response.ok) {
		throw new Error("Failed to upload to S3");
	}

	// 3. Return final public URL
	return data.fileUrl;
}

// Converts file URI → Blob for React Native
async function fileToBlob(uri: string): Promise<Blob> {
	const res = await fetch(uri);
	return res.blob();
}
