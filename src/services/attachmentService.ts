import { deleteObject, ref } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { uploadUserFile } from "@/lib/storage";

export async function uploadTransactionAttachment(params: {
  userId: string;
  file: File;
  transactionId?: string;
}) {
  const { userId, file, transactionId } = params;
  return uploadUserFile({
    userId,
    folder: "transactions/attachments",
    file,
    filePrefix: transactionId ?? "tx",
  });
}

export async function deleteAttachmentByPath(path: string | undefined) {
  if (!path) return;
  const attachmentRef = ref(storage, path);
  await deleteObject(attachmentRef);
}

export async function replaceTransactionAttachment(params: {
  userId: string;
  file: File;
  oldPath?: string;
  transactionId?: string;
}) {
  const uploaded = await uploadTransactionAttachment({
    userId: params.userId,
    file: params.file,
    transactionId: params.transactionId,
  });

  if (params.oldPath && params.oldPath !== uploaded.path) {
    await deleteAttachmentByPath(params.oldPath).catch(() => undefined);
  }

  return uploaded;
}
