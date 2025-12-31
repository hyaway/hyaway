import { SettingsHeader, SettingsTitle } from "./settings-ui";
import { SettingsGroup, SliderField } from "./setting-fields";
import { ImageGallerySettingsContent } from "./image-gallery-settings-popover";
import { SettingsPopover } from "./settings-popover";
import { Separator } from "@/components/ui-primitives/separator";
import {
  MAX_RECENT_FILES_DAYS,
  MAX_RECENT_FILES_LIMIT,
  useRecentFilesDays,
  useRecentFilesLimit,
  useUxSettingsActions,
} from "@/lib/ux-settings-store";

export function RecentFilesSettingsPopover() {
  const recentFilesLimit = useRecentFilesLimit();
  const recentFilesDays = useRecentFilesDays();
  const { setRecentFilesLimit, setRecentFilesDays } = useUxSettingsActions();

  return (
    <SettingsPopover label="Settings">
      <ImageGallerySettingsContent />

      <Separator className="my-4" />

      <SettingsHeader>
        <SettingsTitle>Recency</SettingsTitle>
      </SettingsHeader>
      <SettingsGroup>
        <SliderField
          id="recent-files-limit-popover-slider"
          label="Limit returned files to"
          value={recentFilesLimit}
          min={100}
          max={MAX_RECENT_FILES_LIMIT}
          step={100}
          onValueChange={setRecentFilesLimit}
          commitOnRelease
        />
        <SliderField
          id="recent-files-days-popover-slider"
          label="Days to consider recent"
          value={recentFilesDays}
          min={1}
          max={MAX_RECENT_FILES_DAYS}
          step={1}
          onValueChange={setRecentFilesDays}
          commitOnRelease
        />
      </SettingsGroup>
    </SettingsPopover>
  );
}
