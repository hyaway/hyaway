import { useCallback, useEffect, useRef } from "react";
import axios from "axios";
import { incrementFileViewtime } from "@/integrations/hydrus-api/api-client";
import { CanvasType, Permission } from "@/integrations/hydrus-api/models";
import { useHasPermission } from "@/integrations/hydrus-api/queries/access";
import { useFileViewingStatisticsOptions } from "@/integrations/hydrus-api/queries/options";
import { useWatchHistorySyncToHydrus } from "@/stores/watch-history-store";

/** Multiplier for increasing interval between sends */
const BACKOFF_MULTIPLIER = 1.5;

/**
 * Hook that tracks file view time and sends it to Hydrus API.
 *
 * Behavior:
 * - Starts tracking when the component mounts (if enabled)
 * - Sends first view after minTimeMs has passed
 * - Continues sending updates with increasing intervals until maxTimeMs is reached
 * - Stops sending on 403 (permission denied)
 * - Sends final view time when component unmounts (if > 0)
 *
 * Requirements:
 * - User must enable "sync to hydrus" in watch history settings
 * - Hydrus must have file_viewing_statistics_active enabled
 */
export function useRemoteFileViewTimeTracker(fileId: number) {
  const syncToHydrus = useWatchHistorySyncToHydrus();
  const hasEditTimesPermission = useHasPermission(Permission.EDIT_FILE_TIMES);
  const { isActive, minTimeMs, maxTimeMs, isFetched } =
    useFileViewingStatisticsOptions();

  // Track state in refs to avoid re-renders
  const startTimeRef = useRef<number | null>(null);
  const lastSentTimeRef = useRef<number>(0);
  const totalSentViewtimeRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentIntervalMs = useRef<number>(0);
  const isForbiddenRef = useRef<boolean>(false);

  // Send viewtime to Hydrus, returns true if successful or non-403 error
  const sendViewtime = useCallback(
    async (viewtimeMs: number, isIncrement: boolean): Promise<boolean> => {
      if (viewtimeMs <= 0) return true;

      const viewtimeSeconds = viewtimeMs / 1000;

      try {
        await incrementFileViewtime({
          file_id: fileId,
          canvas_type: CanvasType.CLIENT_API,
          timestamp: startTimeRef.current
            ? startTimeRef.current / 1000
            : undefined,
          views: isIncrement ? 1 : 0,
          viewtime: viewtimeSeconds,
        });
        return true;
      } catch (error) {
        // Stop on 403 Forbidden
        if (axios.isAxiosError(error) && error.response?.status === 403) {
          return false;
        }
        // Ignore other errors
        return true;
      }
    },
    [fileId],
  );

  // Check if tracking should be active
  const shouldTrack =
    syncToHydrus && hasEditTimesPermission && isActive && isFetched;

  useEffect(() => {
    if (!shouldTrack) {
      // Clean up if tracking is disabled
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
        intervalRef.current = null;
      }
      startTimeRef.current = null;
      lastSentTimeRef.current = 0;
      totalSentViewtimeRef.current = 0;
      currentIntervalMs.current = 0;
      isForbiddenRef.current = false;
      return;
    }

    // Start tracking
    const now = Date.now();
    startTimeRef.current = now;
    lastSentTimeRef.current = 0;
    totalSentViewtimeRef.current = 0;
    currentIntervalMs.current = minTimeMs;
    isForbiddenRef.current = false;

    // Schedule sends with increasing intervals
    const scheduleSend = () => {
      if (isForbiddenRef.current) return;

      intervalRef.current = setTimeout(async () => {
        if (!startTimeRef.current || isForbiddenRef.current) return;

        const elapsed = Date.now() - startTimeRef.current;
        const timeSinceLastSent = elapsed - lastSentTimeRef.current;

        // Check if we've exceeded max time
        if (totalSentViewtimeRef.current >= maxTimeMs) {
          return;
        }

        const isFirstSend = lastSentTimeRef.current === 0;
        const success = await sendViewtime(timeSinceLastSent, isFirstSend);

        if (!success) {
          // 403 - stop sending
          isForbiddenRef.current = true;
          return;
        }

        lastSentTimeRef.current = elapsed;
        totalSentViewtimeRef.current += timeSinceLastSent;

        // Increase interval for next send
        currentIntervalMs.current = Math.min(
          currentIntervalMs.current * BACKOFF_MULTIPLIER,
          maxTimeMs - totalSentViewtimeRef.current,
        );

        // Schedule next send if we haven't hit max
        if (totalSentViewtimeRef.current < maxTimeMs) {
          scheduleSend();
        }
      }, currentIntervalMs.current);
    };

    scheduleSend();

    // Cleanup on unmount or when tracking becomes disabled
    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
        intervalRef.current = null;
      }

      // Send any remaining viewtime on unmount (fire-and-forget for cleanup)
      if (startTimeRef.current && !isForbiddenRef.current) {
        const elapsed = Date.now() - startTimeRef.current;
        const remainingTime = elapsed - lastSentTimeRef.current;

        // Only send if we've viewed for at least minTimeMs total and have meaningful remaining time
        // This prevents spurious sends from React strict mode double-mounting
        if (
          elapsed >= minTimeMs &&
          remainingTime > 0 &&
          totalSentViewtimeRef.current < maxTimeMs
        ) {
          const isFirstSend = lastSentTimeRef.current === 0;
          sendViewtime(remainingTime, isFirstSend);
        }
      }

      startTimeRef.current = null;
      lastSentTimeRef.current = 0;
      totalSentViewtimeRef.current = 0;
    };
  }, [shouldTrack, minTimeMs, maxTimeMs, sendViewtime, fileId]);
}
