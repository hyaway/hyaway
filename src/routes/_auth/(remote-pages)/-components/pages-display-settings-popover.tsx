import {
  PAGES_DISPLAY_SETTINGS_TITLE,
  PagesDisplaySettings,
} from "@/components/settings/pages-display-settings";
import {
  SettingsHeader,
  SettingsTitle,
} from "@/components/settings/settings-ui";
import { SettingsPopover } from "@/components/settings/settings-popover";

export function PagesDisplaySettingsPopover() {
  return (
    <SettingsPopover label="Settings">
      <SettingsHeader>
        <SettingsTitle>{PAGES_DISPLAY_SETTINGS_TITLE}</SettingsTitle>
      </SettingsHeader>
      <PagesDisplaySettings idPrefix="popover-" />
    </SettingsPopover>
  );
}
