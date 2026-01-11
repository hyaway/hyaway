import { SettingsCardTitle } from "@/components/settings/settings-ui";
import { Button } from "@/components/ui-primitives/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui-primitives/card";
import { useAuthActions } from "@/integrations/hydrus-api/hydrus-config-store";

export function ResetCard({ resetKey }: { resetKey: () => void }) {
  const { reset } = useAuthActions();

  return (
    <Card>
      <CardHeader>
        <SettingsCardTitle>Reset all connection settings</SettingsCardTitle>
        <CardDescription>
          Clears your API endpoint and access key. You will need to reconfigure
          your connection to Hydrus.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Button
          variant="destructive"
          onClick={() => {
            reset();
            resetKey();
          }}
        >
          Reset API settings
        </Button>
      </CardContent>
    </Card>
  );
}
