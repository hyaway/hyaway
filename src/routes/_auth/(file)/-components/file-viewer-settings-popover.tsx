import { FileViewerSettings } from "@/components/settings/file-viewer-settings";
import {
  SettingsHeader,
  SettingsTitle,
} from "@/components/settings/settings-ui";
import { SettingsPopover } from "@/components/settings/settings-popover";

export function FileViewerSettingsPopover({
  className,
}: {
  className?: string;
} = {}) {
  return (
    <SettingsPopover label="Settings" className={className}>
      <SettingsHeader>
        <SettingsTitle>Media viewer</SettingsTitle>
      </SettingsHeader>
      <FileViewerSettings idPrefix="popover-" />
    </SettingsPopover>
  );
}
