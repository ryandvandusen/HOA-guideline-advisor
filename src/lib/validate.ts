// Server-side validation utilities

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB

// Allowed MIME types and their magic byte signatures
const IMAGE_SIGNATURES: { mime: string; bytes: number[]; offset?: number }[] = [
  { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/png',  bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mime: 'image/gif',  bytes: [0x47, 0x49, 0x46, 0x38] }, // GIF87a or GIF89a
  { mime: 'image/webp', bytes: [0x57, 0x45, 0x42, 0x50], offset: 8 }, // "WEBP" at offset 8 of RIFF
];

export type ImageValidationResult =
  | { ok: true; mime: string }
  | { ok: false; error: string };

/**
 * Validates an uploaded File is a real image by checking:
 * 1. File size is within limit
 * 2. Magic bytes match a known image format (not just extension/Content-Type)
 */
export async function validateImage(file: File): Promise<ImageValidationResult> {
  if (file.size === 0) {
    return { ok: false, error: 'File is empty.' };
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: 'Image must be under 10 MB.' };
  }

  // Read enough bytes to check all signatures (first 12 bytes covers all cases)
  const headerBytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());

  for (const sig of IMAGE_SIGNATURES) {
    const offset = sig.offset ?? 0;
    const match = sig.bytes.every((b, i) => headerBytes[offset + i] === b);
    if (match) {
      return { ok: true, mime: sig.mime };
    }
  }

  return { ok: false, error: 'File does not appear to be a valid image (JPEG, PNG, GIF, or WebP).' };
}

// Input length limits
export const LIMITS = {
  message: 2000,       // compliance chat message
  address: 500,        // violation report address
  description: 5000,   // violation report description
  notes: 2000,         // violation report notes
};

export function truncate(value: string, max: number): string {
  return value.slice(0, max);
}
