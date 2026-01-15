/**
 * MIME type utilities for file type detection
 * Based on Hydrus's HydrusConstants.py
 */

/**
 * Static image types supported by Hydrus's render endpoint.
 * Based on Hydrus's HC.IMAGES list (excludes animations like APNG, animated WEBP/GIF).
 * Note: Static GIF is in IMAGES - browsers display it fine but render endpoint also supports it.
 */
export function isStaticImage(mime: string): boolean {
  return (
    mime === "image/jpeg" ||
    mime === "image/png" ||
    mime === "image/gif" || // Static GIF
    mime === "image/webp" || // Static WEBP
    mime === "image/jxl" || // JPEG XL
    mime === "image/avif" ||
    mime === "image/bmp" ||
    mime === "image/heic" ||
    mime === "image/heif" ||
    mime === "image/x-icon" ||
    mime === "image/qoi" ||
    mime === "image/tiff"
  );
}

/**
 * Image project files that browsers can't display natively.
 * These must always use the render endpoint to be viewable.
 * Based on Hydrus's VIEWABLE_IMAGE_PROJECT_FILES (PSD and Krita only).
 */
export function isImageProjectFile(mime: string): boolean {
  return (
    mime === "image/vnd.adobe.photoshop" ||
    mime === "application/x-photoshop" ||
    mime === "application/x-krita"
  );
}

/**
 * Check if a MIME type can be rendered by Hydrus's render endpoint.
 * This includes both static images and viewable image project files.
 */
export function isRenderableImage(mime: string): boolean {
  return isStaticImage(mime) || isImageProjectFile(mime);
}
