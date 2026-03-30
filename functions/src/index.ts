import { initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { logger } from "firebase-functions";
import { onObjectFinalized } from "firebase-functions/v2/storage";

initializeApp();

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];
const ALLOWED_CONTENT_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024;

function hasAllowedExtension(fileName: string) {
  const lower = fileName.toLowerCase();
  return ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function hasAllowedContentType(contentType: string) {
  if (contentType.startsWith("image/")) {
    return ["image/jpeg", "image/png", "image/webp"].includes(contentType);
  }
  return ALLOWED_CONTENT_TYPES.includes(contentType);
}

export const validateStorageUpload = onObjectFinalized(async (event) => {
  const object = event.data;
  const fileName = object.name;
  const bucketName = object.bucket;

  if (!fileName || !bucketName) return;
  if (!fileName.startsWith("users/")) return;

  const contentType = object.contentType || "";
  const size = Number(object.size || 0);

  const invalid = size > MAX_BYTES || !hasAllowedExtension(fileName) || !hasAllowedContentType(contentType);
  if (!invalid) return;

  logger.warn("Arquivo inválido detectado, removendo do bucket", {
    fileName,
    contentType,
    size,
  });

  await getStorage().bucket(bucketName).file(fileName).delete({ ignoreNotFound: true });
});
