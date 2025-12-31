import { PagesDisplaySettings } from "@/components/settings/pages-display-settings";
import {
  SettingsHeader,
  SettingsTitle,
} from "@/components/settings/settings-ui";
import { SettingsPopover } from "@/components/settings/settings-popover";

export function PagesDisplaySettingsPopover() {
  return (
    <SettingsPopover label="Settings">
      <SettingsHeader>
        <SettingsTitle>Pages display</SettingsTitle>
      </SettingsHeader>
      <PagesDisplaySettings idPrefix="popover-" />
    </SettingsPopover>
  );
}
