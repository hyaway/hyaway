import {
  SettingsHeader,
  SettingsTitle,
} from "@/components/settings/settings-ui";
import {
  SettingsGroup,
  SwitchField,
} from "@/components/settings/setting-fields";
import { SettingsPopover } from "@/components/settings/settings-popover";
import {
  useFileViewerStartExpanded,
  useUxSettingsActions,
} from "@/lib/ux-settings-store";

export function FileViewerSettingsContent() {
  const fileViewerStartExpanded = useFileViewerStartExpanded();
  const { setFileViewerStartExpanded } = useUxSettingsActions();

  return (
    <>
      <SettingsHeader>
        <SettingsTitle>Viewer</SettingsTitle>
      </SettingsHeader>
      <SettingsGroup>
        <SwitchField
          id="file-viewer-start-expanded-popover-switch"
          label="Start images expanded"
          checked={fileViewerStartExpanded}
          onCheckedChange={setFileViewerStartExpanded}
        />
      </SettingsGroup>
    </>
  );
}

export function FileViewerSettingsPopover({
  className,
}: {
  className?: string;
} = {}) {
  return (
    <SettingsPopover label="Settings" className={className}>
      <FileViewerSettingsContent />
    </SettingsPopover>
  );
}
