import {
  PopoverHeader,
  PopoverTitle,
} from "@/components/ui-primitives/popover";
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
      <PopoverHeader>
        <PopoverTitle>Viewer settings</PopoverTitle>
      </PopoverHeader>
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
  size,
}: {
  className?: string;
  size?: "default" | "xl";
}) {
  return (
    <SettingsPopover label="Viewer settings" className={className} size={size}>
      <FileViewerSettingsContent />
    </SettingsPopover>
  );
}
