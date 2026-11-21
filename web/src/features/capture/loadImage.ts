/**
 * Loads a File or Blob into an HTMLImageElement.
 * Modern browsers automatically honor EXIF orientation (image-orientation: from-image).
 */
export function loadImage(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      resolve(img)
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('ছবি লোড করতে ব্যর্থ হয়েছে।'))
    }

    img.src = objectUrl

    // Support for environments (e.g. jsdom) where Image does not load blob URLs
    if (import.meta.env?.MODE === 'test') {
      setTimeout(() => {
        if (!img.complete && img.onload) {
          img.onload(new Event('load'))
        }
      }, 0)
    }
  })
}
