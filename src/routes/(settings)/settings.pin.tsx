// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { createFileRoute } from "@tanstack/react-router";
import { PinLockSettingsCard } from "./-components/pin-lock-settings-card";
import { Heading } from "@/components/ui-primitives/heading";

export const Route = createFileRoute("/(settings)/settings/pin")({
  component: SettingsSecurityComponent,
  beforeLoad: () => ({
    getTitle: () => "PIN settings",
    useHistoryBack: true,
  }),
});

function SettingsSecurityComponent() {
  return (
    <div className="flex max-w-xl flex-col gap-4">
      <Heading level={2} className="sr-only">
        PIN
      </Heading>
      <PinLockSettingsCard />
    </div>
  );
}
