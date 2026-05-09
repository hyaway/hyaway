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

export function ResetCard({ resetKey }: { resetKey: () => void }) {
  const resetConnection = useResetConnection();

  return (
    <Card>
      <CardHeader>
        <SettingsCardTitle>Reset all connection settings</SettingsCardTitle>
        <CardDescription>
          Clears your API endpoint, access key, review queue, and watch history.
          You will need to reconfigure your connection to Hydrus.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Button
          variant="destructive"
          onClick={() => {
            resetConnection();
            resetKey();
          }}
        >
          Reset API settings
        </Button>
      </CardContent>
    </Card>
  );
}
