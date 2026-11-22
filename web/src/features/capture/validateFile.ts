export interface ValidationResult {
  valid: boolean
  error?: string
}

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
])

const ALLOWED_EXTENSIONS = /\.(jpe?g|png|webp)$/i

export function validateFile(file: File): ValidationResult {
  const mime = file.type.trim().toLowerCase()
  let isAllowed = false

  if (mime !== '') {
    // If file.type is not empty: allow only image/jpeg, image/png, image/webp (by MIME). Ignore the extension.
    isAllowed = ALLOWED_MIME_TYPES.has(mime)
  } else {
    // If file.type is empty: fall back to the extension check (.jpg/.jpeg/.png/.webp).
    isAllowed = ALLOWED_EXTENSIONS.test(file.name)
  }

  if (!isAllowed) {
    return {
      valid: false,
      error: 'শুধুমাত্র JPG, PNG বা WebP ফরম্যাটের ছবি আপলোড করুন।',
    }
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: 'ছবির আকার ১০ মেগাবাইট (10 MB)-এর চেয়ে বেশি হতে পারবে না।',
    }
  }

  return { valid: true }
}
