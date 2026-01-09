import { SettingsGroup, SwitchField } from "./setting-fields";
import {
  usePagesSettingsActions,
  usePagesUseFriendlyUrls,
} from "@/stores/pages-settings-store";

export const PAGES_URLS_SETTINGS_TITLE = "Pages URLs";

export interface PagesUrlsSettingsProps {
  idPrefix?: string;
}

export function PagesUrlsSettings({ idPrefix = "" }: PagesUrlsSettingsProps) {
  const useFriendlyUrls = usePagesUseFriendlyUrls();
  const { setUseFriendlyUrls } = usePagesSettingsActions();

  return (
    <SettingsGroup>
      <SwitchField
        id={`${idPrefix}friendly-urls-switch`}
        label="Friendly URLs"
        description="Use readable page slugs instead of full page keys"
        checked={useFriendlyUrls}
        onCheckedChange={setUseFriendlyUrls}
      />
    </SettingsGroup>
  );
}
