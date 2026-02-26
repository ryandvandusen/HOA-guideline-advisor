import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

type UploadType = 'submissions' | 'reports';

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png':  'png',
  'image/gif':  'gif',
  'image/webp': 'webp',
};

/**
 * Saves an uploaded file to the local uploads directory.
 * @param validatedMime - The MIME type determined by magic byte validation (not client-supplied).
 */
export async function saveUploadedFile(
  file: File,
  type: UploadType,
  validatedMime: string
): Promise<{ filePath: string; publicPath: string }> {
  // Extension derived from server-validated MIME — never trust the client filename
  const ext = MIME_TO_EXT[validatedMime] ?? 'jpg';
  const filename = `${randomUUID()}.${ext}`;
  const dir = path.join(process.env.UPLOADS_PATH!, type);

  fs.mkdirSync(dir, { recursive: true });

  const fullPath = path.join(dir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(fullPath, buffer);

  return {
    filePath: fullPath,
    publicPath: `/api/uploads/${type}/${filename}`,
  };
}
