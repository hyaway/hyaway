import { SettingsGroup, SliderField } from "./setting-fields";
import {
  MAX_RECENT_FILES_DAYS,
  MAX_SEARCH_LIMIT,
  useLongestViewedLimit,
  useMostViewedLimit,
  useRandomInboxLimit,
  useRecentFilesDays,
  useRecentFilesLimit,
  useRemoteHistoryLimit,
  useSearchLimitsActions,
} from "@/stores/search-limits-store";

export const SEARCH_LIMITS_SETTINGS_TITLE = "Search limits";

export interface SearchLimitsSettingsProps {
  idPrefix?: string;
}

export function SearchLimitsSettings({
  idPrefix = "",
}: SearchLimitsSettingsProps) {
  const recentFilesLimit = useRecentFilesLimit();
  const recentFilesDays = useRecentFilesDays();
  const randomInboxLimit = useRandomInboxLimit();
  const remoteHistoryLimit = useRemoteHistoryLimit();
  const mostViewedLimit = useMostViewedLimit();
  const longestViewedLimit = useLongestViewedLimit();

  const {
    setAllLimits,
    setRecentFilesLimit,
    setRecentFilesDays,
    setRandomInboxLimit,
    setRemoteHistoryLimit,
    setMostViewedLimit,
    setLongestViewedLimit,
  } = useSearchLimitsActions();

  // Calculate a representative "all" value (use max of all limits)
  const allLimitsValue = Math.max(
    recentFilesLimit,
    randomInboxLimit,
    remoteHistoryLimit,
    mostViewedLimit,
    longestViewedLimit,
  );

  return (
    <SettingsGroup>
      <SliderField
        id={`${idPrefix}all-limits-slider`}
        label="Set all limits"
        value={allLimitsValue}
        min={100}
        max={MAX_SEARCH_LIMIT}
        step={100}
        onValueChange={setAllLimits}
        commitOnRelease
      />

      <div className="border-border mt-2 border-t pt-4">
        <SliderField
          id={`${idPrefix}recent-files-limit-slider`}
          label="Recent files"
          value={recentFilesLimit}
          min={100}
          max={MAX_SEARCH_LIMIT}
          step={100}
          onValueChange={setRecentFilesLimit}
          commitOnRelease
        />
      </div>

      <SliderField
        id={`${idPrefix}recent-files-days-slider`}
        label="Recent files timeframe"
        value={recentFilesDays}
        min={1}
        max={MAX_RECENT_FILES_DAYS}
        step={1}
        onValueChange={setRecentFilesDays}
        formatValue={(v) => (v === 1 ? "Last 24 hours" : `Last ${v} days`)}
        commitOnRelease
      />

      <SliderField
        id={`${idPrefix}random-inbox-limit-slider`}
        label="Random inbox"
        value={randomInboxLimit}
        min={100}
        max={MAX_SEARCH_LIMIT}
        step={100}
        onValueChange={setRandomInboxLimit}
        commitOnRelease
      />

      <SliderField
        id={`${idPrefix}remote-history-limit-slider`}
        label="Remote history"
        value={remoteHistoryLimit}
        min={100}
        max={MAX_SEARCH_LIMIT}
        step={100}
        onValueChange={setRemoteHistoryLimit}
        commitOnRelease
      />

      <SliderField
        id={`${idPrefix}most-viewed-limit-slider`}
        label="Most viewed"
        value={mostViewedLimit}
        min={100}
        max={MAX_SEARCH_LIMIT}
        step={100}
        onValueChange={setMostViewedLimit}
        commitOnRelease
      />

      <SliderField
        id={`${idPrefix}longest-viewed-limit-slider`}
        label="Longest viewed"
        value={longestViewedLimit}
        min={100}
        max={MAX_SEARCH_LIMIT}
        step={100}
        onValueChange={setLongestViewedLimit}
        commitOnRelease
      />
    </SettingsGroup>
  );
}
