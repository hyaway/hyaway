import { Settings01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui-primitives/button";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui-primitives/popover";
import { Separator } from "@/components/ui-primitives/separator";
import {
  SettingsGroup,
  SliderField,
} from "@/components/settings/setting-fields";
import { ImageGallerySettingsContent } from "@/components/settings/image-gallery-settings-popover";
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
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="icon">
            <HugeiconsIcon icon={Settings01Icon} />
            <span className="sr-only">Settings</span>
          </Button>
        }
      />
      <PopoverContent align="end" className="w-80">
        <ImageGallerySettingsContent />

        <Separator className="my-4" />

        <PopoverHeader>
          <PopoverTitle>Recency settings</PopoverTitle>
        </PopoverHeader>
        <SettingsGroup>
          <SliderField
            id="recent-files-limit-popover-slider"
            label="Maximum files"
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
      </PopoverContent>
    </Popover>
  );
}
