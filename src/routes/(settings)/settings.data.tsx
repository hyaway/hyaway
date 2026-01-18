// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { createFileRoute } from "@tanstack/react-router";
import { SearchLimitsSettingsCard } from "./-components/search-limits-settings-card";
import { HistorySettingsCard } from "./-components/history-settings-card";
import { ReviewQueueSettingsCard } from "./-components/review-queue-settings-card";
import { ResetAllDataSettingsCard } from "./-components/reset-all-data-settings-card";
import { Heading } from "@/components/ui-primitives/heading";

export const Route = createFileRoute("/(settings)/settings/data")({
  component: SettingsDataComponent,
  beforeLoad: () => ({
    getTitle: () => "Data settings",
    useHistoryBack: true,
  }),
});

function SettingsDataComponent() {
  return (
    <div className="flex max-w-xl flex-col gap-4">
      <Heading level={2} className="sr-only">
        Data Settings
      </Heading>
      <ReviewQueueSettingsCard />
      <SearchLimitsSettingsCard />
      <HistorySettingsCard />
      <ResetAllDataSettingsCard />
    </div>
  );
}
