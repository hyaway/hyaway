import { PagesSettings } from "@/components/settings/pages-settings";
import {
  SettingsHeader,
  SettingsTitle,
} from "@/components/settings/settings-ui";
import { SettingsPopover } from "@/components/settings/settings-popover";

export function PagesSettingsPopover() {
  return (
    <SettingsPopover label="Settings">
      <SettingsHeader>
        <SettingsTitle>Pages view</SettingsTitle>
      </SettingsHeader>
      <PagesSettings idPrefix="popover-" />
    </SettingsPopover>
  );
}
