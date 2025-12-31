import {
  FILE_VIEWER_SETTINGS_TITLE,
  FileViewerSettings,
} from "@/components/settings/file-viewer-settings";
import { SettingsPopover } from "@/components/settings/settings-popover";
import {
  SettingsHeader,
  SettingsTitle,
} from "@/components/settings/settings-ui";

export function FileViewerSettingsPopover({
  className,
}: {
  className?: string;
} = {}) {
  return (
    <SettingsPopover label="Settings" className={className}>
      <SettingsHeader>
        <SettingsTitle>{FILE_VIEWER_SETTINGS_TITLE}</SettingsTitle>
      </SettingsHeader>
      <FileViewerSettings idPrefix="popover-" />
    </SettingsPopover>
  );
}
