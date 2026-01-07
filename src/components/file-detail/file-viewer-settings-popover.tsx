import {
  FILE_VIEWER_SETTINGS_TITLE,
  FileViewerSettings,
} from "@/components/settings/file-viewer-settings";
import { SettingsPopover } from "@/components/settings/settings-popover";
import {
  SettingsHeader,
  SettingsTitle,
} from "@/components/settings/settings-ui";

export interface FileViewerSettingsPopoverProps {
  className?: string;
  /** Mime type of the current file - determines which section opens by default */
  mimeType?: string;
}

export function FileViewerSettingsPopover({
  className,
  mimeType,
}: FileViewerSettingsPopoverProps = {}) {
  return (
    <SettingsPopover label="Settings" className={className}>
      <SettingsHeader>
        <SettingsTitle>{FILE_VIEWER_SETTINGS_TITLE}</SettingsTitle>
      </SettingsHeader>
      <FileViewerSettings idPrefix="popover-" defaultOpen mimeType={mimeType} />
    </SettingsPopover>
  );
}
