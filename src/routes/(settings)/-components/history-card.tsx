import { IconTrashX } from "@tabler/icons-react";
import { SettingsGroup, SliderField, SwitchField } from "./setting-fields";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui-primitives/card";
import {
  MAX_HISTORY_LIMIT,
  useHistoryActions,
  useHistoryEnabled,
  useHistoryEntries,
  useHistoryLimit,
} from "@/lib/history-store";
import { Button } from "@/components/ui-primitives/button";

export function HistoryCard() {
  const enabled = useHistoryEnabled();
  const limit = useHistoryLimit();
  const entries = useHistoryEntries();
  const { setEnabled, setLimit, clearHistory } = useHistoryActions();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Watch history</CardTitle>
        <CardDescription>
          Configure how viewed files are tracked. Files you open are remembered
          for quick access later.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SettingsGroup>
          <SwitchField
            id="history-enabled-switch"
            label="Record new views"
            description="Existing history is kept when disabled"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
          <SliderField
            id="history-limit-slider"
            label="Maximum entries to keep"
            value={limit}
            min={10}
            max={MAX_HISTORY_LIMIT}
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
