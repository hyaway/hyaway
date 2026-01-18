// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { IconTrashX } from "@tabler/icons-react";
import {
  HistorySettings,
  WATCH_HISTORY_SETTINGS_TITLE,
} from "@/components/settings/history-settings";
import {
  SettingsCardTitle,
  SettingsResetButton,
} from "@/components/settings/settings-ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui-primitives/card";
import {
  useWatchHistoryActions,
  useWatchHistoryEntries,
} from "@/stores/watch-history-store";
import { Button } from "@/components/ui-primitives/button";

export function HistorySettingsCard() {
  const entries = useWatchHistoryEntries();
  const { clearHistory, reset } = useWatchHistoryActions();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <SettingsCardTitle>{WATCH_HISTORY_SETTINGS_TITLE}</SettingsCardTitle>
          <SettingsResetButton onReset={reset} />
        </div>
        <CardDescription>
          Configure how viewed files are tracked. Files you open are remembered
          for quick access later.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <HistorySettings />
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">
              Clear local watch history
            </span>
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
