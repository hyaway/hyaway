import { SettingsGroup, SliderField } from "./setting-fields";
import {
  MAX_SEARCH_LIMIT,
  useLongestViewedLimit,
  useMostViewedLimit,
  useRemoteHistoryLimit,
  useSearchLimitsActions,
} from "@/stores/search-limits-store";

export const VIEW_STATISTICS_LIMIT_SETTINGS_TITLE = "View statistics";

export interface ViewStatisticsLimitSettingsProps {
  idPrefix?: string;
  /** Which limit to show: 'remoteHistory', 'mostViewed', or 'longestViewed' */
  variant?: "remoteHistory" | "mostViewed" | "longestViewed";
}

export function ViewStatisticsLimitSettings({
  idPrefix = "",
  variant = "remoteHistory",
}: ViewStatisticsLimitSettingsProps) {
  const remoteHistoryLimit = useRemoteHistoryLimit();
  const mostViewedLimit = useMostViewedLimit();
  const longestViewedLimit = useLongestViewedLimit();
  const { setRemoteHistoryLimit, setMostViewedLimit, setLongestViewedLimit } =
    useSearchLimitsActions();

  const config = {
    remoteHistory: {
      value: remoteHistoryLimit,
      onChange: setRemoteHistoryLimit,
      id: "remote-history-limit-slider",
    },
    mostViewed: {
      value: mostViewedLimit,
      onChange: setMostViewedLimit,
      id: "most-viewed-limit-slider",
    },
    longestViewed: {
      value: longestViewedLimit,
      onChange: setLongestViewedLimit,
      id: "longest-viewed-limit-slider",
    },
  }[variant];

  return (
    <SettingsGroup>
      <SliderField
        id={`${idPrefix}${config.id}`}
        label="Max files"
        value={config.value}
        min={100}
        max={MAX_SEARCH_LIMIT}
        step={100}
        onValueChange={config.onChange}
        commitOnRelease
      />
    </SettingsGroup>
  );
}
