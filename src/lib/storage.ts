import { getDownloadURL, listAll, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/lib/firebase";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function sanitizeFileName(fileName: string) {
  return fileName.toLowerCase().replace(/[^a-z0-9._-]/g, "_");
}

function ensureValidFile(file: File) {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Arquivo excede o limite de 10MB.");
  }
}

export function buildStoragePath(parts: string[]) {
  return parts.filter(Boolean).join("/");
}

export async function uploadUserFile(params: {
  userId: string;
  folder: string;
  file: File;
  filePrefix?: string;
}) {
  const { userId, folder, file, filePrefix } = params;
  ensureValidFile(file);

  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const timestamp = Date.now();
  const safeName = sanitizeFileName(file.name);
  const prefixedName = `${filePrefix ? `${filePrefix}_` : ""}${timestamp}_${safeName}`;

  const path = buildStoragePath(["users", userId, folder, year, month, prefixedName]);
  const storageRef = ref(storage, path);

  const snapshot = await uploadBytes(storageRef, file, {
    contentType: file.type || "application/octet-stream",
    cacheControl: "public,max-age=3600",
  });

  const url = await getDownloadURL(snapshot.ref);
  return { path, url, size: file.size, contentType: file.type || "application/octet-stream" };
}

export async function listUserFolderFiles(userId: string, folder: string) {
  const rootRef = ref(storage, buildStoragePath(["users", userId, folder]));
  const list = await listAll(rootRef);

  return Promise.all(
    list.items.map(async (item) => ({
      name: item.name,
      path: item.fullPath,
      url: await getDownloadURL(item),
    })),
  );
}
