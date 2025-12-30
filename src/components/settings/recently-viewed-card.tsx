import { IconTrashX } from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui-primitives/card";
import {
  SettingsGroup,
  SliderField,
  SwitchField,
} from "@/components/settings/setting-fields";
import {
  MAX_RECENTLY_VIEWED_LIMIT,
  useRecentlyViewedActions,
  useRecentlyViewedEnabled,
  useRecentlyViewedEntries,
  useRecentlyViewedLimit,
} from "@/lib/recently-viewed-store";
import { Button } from "@/components/ui-primitives/button";

export function RecentlyViewedCard() {
  const enabled = useRecentlyViewedEnabled();
  const limit = useRecentlyViewedLimit();
  const entries = useRecentlyViewedEntries();
  const { setEnabled, setLimit, clearHistory } = useRecentlyViewedActions();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recently viewed</CardTitle>
        <CardDescription>
          Configure how recently viewed files are tracked. Files you open are
          remembered for quick access later.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SettingsGroup>
          <SwitchField
            id="recently-viewed-enabled-switch"
            label="Keep track of recently viewed files"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
          <SliderField
            id="recently-viewed-limit-slider"
            label="Maximum entries to keep"
            value={limit}
            min={10}
            max={MAX_RECENTLY_VIEWED_LIMIT}
            step={10}
            onValueChange={setLimit}
            commitOnRelease
          />
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">Clear history</span>
              <span className="text-muted-foreground text-xs">
                {entries.length} {entries.length === 1 ? "entry" : "entries"}{" "}
                saved
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={clearHistory}
              disabled={entries.length === 0}
            >
              <IconTrashX data-icon="inline-start" />
              Clear
            </Button>
          </div>
        </SettingsGroup>
      </CardContent>
    </Card>
  );
}
