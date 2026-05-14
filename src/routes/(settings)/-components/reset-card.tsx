// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { SettingsCardTitle } from "@/components/settings/settings-ui";
import { Button } from "@/components/ui-primitives/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui-primitives/card";
import { useResetConnection } from "@/hooks/use-reset-connection";
import { useAuthActions } from "@/integrations/hydrus-api/hydrus-config-store";

export function ResetCard({ resetKey }: { resetKey: () => void }) {
  const resetConnection = useResetConnection();
  const { reset: resetAuth } = useAuthActions();

  return (
    <Card>
      <CardHeader>
        <SettingsCardTitle>Reset connection settings</SettingsCardTitle>
        <CardDescription>
          Clear your Hydrus API values, or disconnect and remove locally saved
          connection data.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">Reset API values</span>
            <span className="text-muted-foreground text-xs">
              Clears your API endpoint, access key, and session key only.
            </span>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              resetAuth();
              resetKey();
            }}
          >
            Reset API values
          </Button>
        </div>
        <div className="border-border flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">
              Reset API values and clear saved data
            </span>
            <span className="text-muted-foreground text-xs">
              Also clears your review queue, watch history, and saved searches.
            </span>
          </div>
          <Button
            variant="destructive"
            onClick={() => {
              resetConnection();
              resetKey();
            }}
          >
            Reset and clear data
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
