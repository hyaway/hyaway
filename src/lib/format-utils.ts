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
