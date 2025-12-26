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
import {
  SettingsGroup,
  SwitchField,
} from "@/components/settings/setting-fields";
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
}: {
  className?: string;
}) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="icon" className={className}>
            <HugeiconsIcon icon={Settings01Icon} />
            <span className="sr-only">Viewer settings</span>
          </Button>
        }
      />
      <PopoverContent align="end" className="w-80">
        <FileViewerSettingsContent />
      </PopoverContent>
    </Popover>
  );
}
