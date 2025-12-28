import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

// Cloudflare R2 configuration
const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY || "",
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_KEY || "",
  },
});

const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || "ai-cover-generator";

export interface UploadResult {
  key: string;
  url: string;
  etag: string;
}

export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array | ReadableStream,
  contentType: string
): Promise<UploadResult> {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  const result = await r2Client.send(command);

  const publicUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${key}`;

  return {
    key,
    url: publicUrl,
    etag: result.ETag || "",
  };
}

export async function deleteFromR2(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  await r2Client.send(command);
}

export async function getFromR2(key: string): Promise<ReadableStream | null> {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  try {
    const result = await r2Client.send(command);
    return result.Body as ReadableStream;
  } catch (error) {
    console.error("Error fetching from R2:", error);
    return null;
  }
}