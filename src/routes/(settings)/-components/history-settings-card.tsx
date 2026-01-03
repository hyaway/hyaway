import { IconTrashX } from "@tabler/icons-react";
import {
  HistorySettings,
  WATCH_HISTORY_SETTINGS_TITLE,
} from "@/components/settings/history-settings";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui-primitives/card";
import {
  useWatchHistoryActions,
  useWatchHistoryEntries,
} from "@/lib/stores/watch-history-store";
import { Button } from "@/components/ui-primitives/button";

export function HistorySettingsCard() {
  const entries = useWatchHistoryEntries();
  const { clearHistory } = useWatchHistoryActions();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{WATCH_HISTORY_SETTINGS_TITLE}</CardTitle>
        <CardDescription>
          Configure how viewed files are tracked. Files you open are remembered
          for quick access later.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <HistorySettings />
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
      </CardContent>
    </Card>
  );
}
