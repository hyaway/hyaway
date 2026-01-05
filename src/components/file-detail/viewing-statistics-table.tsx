import type { FileViewingStatistics } from "@/integrations/hydrus-api/models";

/**
 * Formats viewtime (in seconds) into a human-readable string.
 */
function formatViewtime(seconds: number): string {
  if (seconds === 0) return "0s";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: Array<string> = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(" ");
}

/**
 * Formats a Unix timestamp into a localized date/time string.
 */
function formatTimestamp(timestamp: number | null): string | null {
  if (timestamp === null) return null;
  return new Date(timestamp * 1000).toLocaleString();
}

interface ViewingStatisticsTableProps {
  statistics: Array<FileViewingStatistics> | undefined;
}

export function ViewingStatisticsTable({
  statistics,
}: ViewingStatisticsTableProps) {
  if (!statistics || statistics.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No viewing statistics available.
      </p>
    );
  }

  // Calculate totals
  const totalViews = statistics.reduce((sum, stat) => sum + stat.views, 0);
  const totalViewtime = statistics.reduce(
    (sum, stat) => sum + stat.viewtime,
    0,
  );

  // Find the most recent view across all canvas types
  const lastViewed = statistics.reduce<number | null>((latest, stat) => {
    if (stat.last_viewed_timestamp === null) return latest;
    if (latest === null) return stat.last_viewed_timestamp;
    return Math.max(latest, stat.last_viewed_timestamp);
  }, null);

  // Filter to only show canvas types with views
  const statsWithViews = statistics.filter((stat) => stat.views > 0);

  return (
    <div className="space-y-3">
      {/* Summary row */}
      <div className="bg-muted/50 rounded-sm p-3">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm @sm:grid-cols-3">
          <div>
            <dt className="text-muted-foreground font-medium">Total Views</dt>
            <dd className="text-lg font-semibold tabular-nums">{totalViews}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground font-medium">Total Time</dt>
            <dd className="text-lg font-semibold tabular-nums">
              {formatViewtime(totalViewtime)}
            </dd>
          </div>
          {lastViewed && (
            <div className="col-span-2 @sm:col-span-1">
              <dt className="text-muted-foreground font-medium">Last Viewed</dt>
              <dd className="tabular-nums">{formatTimestamp(lastViewed)}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Detailed breakdown table */}
      {statsWithViews.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="text-muted-foreground pr-4 pb-2 font-medium">
                  Viewer
                </th>
                <th className="text-muted-foreground pr-4 pb-2 text-right font-medium">
                  Views
                </th>
                <th className="text-muted-foreground pr-4 pb-2 text-right font-medium">
                  Time
                </th>
                <th className="text-muted-foreground pb-2 text-right font-medium">
                  Last Viewed
                </th>
              </tr>
            </thead>
            <tbody>
              {statsWithViews.map((stat) => (
                <tr key={stat.canvas_type} className="border-b last:border-0">
                  <td className="py-2 pr-4 capitalize">
                    {stat.canvas_type_pretty}
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums">
                    {stat.views}
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums">
                    {formatViewtime(stat.viewtime)}
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {formatTimestamp(stat.last_viewed_timestamp) ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
