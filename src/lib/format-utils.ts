import slugify from "slug";

/** Length of truncated page_key suffix appended to slugs */
const PAGE_KEY_SUFFIX_LENGTH = 8;

/**
 * Normalizes punctuation to dashes before slugifying.
 * Converts common punctuation characters to dashes so they become
 * word separators instead of being stripped entirely.
 */
function normalizePunctuation(text: string): string {
  // Replace punctuation that should become word separators with dashes
  // This includes: . , ; : ! ? ' " ( ) [ ] { } / \ | @ # $ % ^ & * + = < > ~
  return text.replace(/[.,;:!?'"()[\]{}/\\|@#$%^&*+=<>~_]+/g, "-");
}

/**
 * Creates a URL-friendly slug from a page name with truncated page_key suffix.
 * The suffix ensures uniqueness when multiple pages have the same name.
 * @param name - The page name to slugify
 * @param pageKey - The page_key UUID to append as suffix
 * @returns URL-safe slug like "my-search-abc12345"
 */
export function createPageSlug(name: string, pageKey: string): string {
  const normalized = normalizePunctuation(name);
  const nameSlug = slugify(normalized, { lower: true });
  const keySuffix = pageKey.slice(0, PAGE_KEY_SUFFIX_LENGTH);
  return nameSlug ? `${nameSlug}-${keySuffix}` : keySuffix;
}

/**
 * Formats a byte count into a human-readable string with appropriate units.
 * @param bytes - The number of bytes to format
 * @returns Formatted string like "1.5 MB" or "0 Bytes"
 */
export function formatBytes(bytes: number | null | undefined): string | null {
  if (bytes === null || bytes === undefined) return null;
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Formats a duration in milliseconds into a human-readable string.
 * @param ms - Duration in milliseconds
 * @returns Formatted string like "2 hours 30 minutes" or null if input is null
 */
export function formatDuration(ms: number | null | undefined): string | null {
  if (ms === null || ms === undefined) return null;
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: Array<string> = [];
  if (hours > 0) {
    parts.push(
      new Intl.NumberFormat(undefined, {
        style: "unit",
        unit: "hour",
      }).format(hours),
    );
  }
  if (minutes > 0) {
    parts.push(
      new Intl.NumberFormat(undefined, {
        style: "unit",
        unit: "minute",
      }).format(minutes),
    );
  }
  if (seconds > 0 || parts.length === 0) {
    parts.push(
      new Intl.NumberFormat(undefined, {
        style: "unit",
        unit: "second",
      }).format(seconds),
    );
  }
  return parts.join(" ");
}

const hoursFormatter = new Intl.NumberFormat(undefined, {
  style: "unit",
  unit: "hour",
  unitDisplay: "narrow",
});

const daysFormatter = new Intl.NumberFormat(undefined, {
  style: "unit",
  unit: "day",
  unitDisplay: "narrow",
});

/**
 * Formats hours into a compact human-readable string.
 * Shows days + hours when >= 24 hours.
 * @param hours - Number of hours
 * @returns Formatted string like "12h" or "2d 12h"
 */
export function formatHoursCompact(hours: number): string {
  if (hours < 24) {
    return hoursFormatter.format(hours);
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  if (remainingHours === 0) {
    return daysFormatter.format(days);
  }
  return `${daysFormatter.format(days)} ${hoursFormatter.format(remainingHours)}`;
}

/**
 * Formats viewtime (in seconds) into a compact human-readable string.
 * @param seconds - Number of seconds
 * @returns Formatted string like "5m", "2h", "1d 12h"
 */
export function formatViewtimeCompact(seconds: number): string {
  if (seconds < 60) {
    return `${Math.floor(seconds)}s`;
  }
  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}m`;
  }
  const hours = Math.floor(seconds / 3600);
  return formatHoursCompact(hours);
}

const relativeTimeFormatter = new Intl.RelativeTimeFormat(undefined, {
  numeric: "auto",
  style: "narrow",
});

/**
 * Formats a timestamp into a compact relative time string.
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted string like "2h ago", "3d ago", "1mo ago"
 */
export function formatRelativeTimeCompact(timestamp: number): string {
  const now = Date.now();
  const diffMs = timestamp - now;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (Math.abs(diffMinutes) < 60) {
    return relativeTimeFormatter.format(diffMinutes, "minute");
  }
  if (Math.abs(diffHours) < 24) {
    return relativeTimeFormatter.format(diffHours, "hour");
  }
  if (Math.abs(diffDays) < 30) {
    return relativeTimeFormatter.format(diffDays, "day");
  }
  const diffMonths = Math.floor(diffDays / 30);
  return relativeTimeFormatter.format(diffMonths, "month");
}
