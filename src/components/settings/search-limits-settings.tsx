import { SettingsGroup, SliderField } from "./setting-fields";
import {
  MAX_RECENT_FILES_DAYS,
  MAX_SEARCH_LIMIT,
  MIN_SEARCH_LIMIT,
  useAllLimits,
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
  const allLimits = useAllLimits();
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

  // Check if all limits match the "all" value
  const allMatch =
    recentFilesLimit === allLimits &&
    randomInboxLimit === allLimits &&
    remoteHistoryLimit === allLimits &&
    mostViewedLimit === allLimits &&
    longestViewedLimit === allLimits;

  // "all" slider is muted when any individual differs, individuals are muted when they all match
  const allVariant = allMatch ? "default" : "muted";
  const individualVariant = allMatch ? "muted" : "default";

  return (
    <SettingsGroup>
      <SliderField
        id={`${idPrefix}all-limits-slider`}
        label="Set all limits"
        value={allLimits}
        min={MIN_SEARCH_LIMIT}
        max={MAX_SEARCH_LIMIT}
        step={100}
        onValueChange={setAllLimits}
        variant={allVariant}
        commitOnRelease
      />

      {/* Recent files group */}
      <div className="border-border mt-2 flex flex-col gap-6 border-t pt-4">
        <p className="text-muted-foreground text-sm">Recent files</p>
        <SliderField
          id={`${idPrefix}recent-files-limit-slider`}
          label="Max files"
          value={recentFilesLimit}
          min={MIN_SEARCH_LIMIT}
          max={MAX_SEARCH_LIMIT}
          step={100}
          onValueChange={setRecentFilesLimit}
          variant={individualVariant}
          commitOnRelease
        />
        <SliderField
          id={`${idPrefix}recent-files-days-slider`}
          label="Timeframe"
          value={recentFilesDays}
          min={1}
          max={MAX_RECENT_FILES_DAYS}
          step={1}
          onValueChange={setRecentFilesDays}
          formatValue={(v) => (v === 1 ? "Last 24 hours" : `Last ${v} days`)}
          commitOnRelease
        />
      </div>

      {/* Other group */}
      <div className="border-border mt-2 flex flex-col gap-6 border-t pt-4">
        <p className="text-muted-foreground text-sm">Other</p>
        <SliderField
          id={`${idPrefix}random-inbox-limit-slider`}
          label="Random inbox"
          value={randomInboxLimit}
          min={MIN_SEARCH_LIMIT}
          max={MAX_SEARCH_LIMIT}
          step={100}
          onValueChange={setRandomInboxLimit}
          variant={individualVariant}
          commitOnRelease
        />
      </div>

      {/* View statistics group */}
      <div className="border-border mt-2 flex flex-col gap-6 border-t pt-4">
        <p className="text-muted-foreground text-sm">View statistics</p>
        <SliderField
          id={`${idPrefix}remote-history-limit-slider`}
          label="Remote history"
          value={remoteHistoryLimit}
          min={MIN_SEARCH_LIMIT}
          max={MAX_SEARCH_LIMIT}
          step={100}
          onValueChange={setRemoteHistoryLimit}
          variant={individualVariant}
          commitOnRelease
        />
        <SliderField
          id={`${idPrefix}most-viewed-limit-slider`}
          label="Most viewed"
          value={mostViewedLimit}
          min={MIN_SEARCH_LIMIT}
          max={MAX_SEARCH_LIMIT}
          step={100}
          onValueChange={setMostViewedLimit}
          variant={individualVariant}
          commitOnRelease
        />
        <SliderField
          id={`${idPrefix}longest-viewed-limit-slider`}
          label="Longest viewed"
          value={longestViewedLimit}
          min={MIN_SEARCH_LIMIT}
          max={MAX_SEARCH_LIMIT}
          step={100}
          onValueChange={setLongestViewedLimit}
          variant={individualVariant}
          commitOnRelease
        />
      </div>
    </SettingsGroup>
  );
}
