import { SETTINGS_ACTION, SETTINGS_RESET_CONFIG_ACTION } from "./constants";
import { Button } from "@/components/ui-primitives/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui-primitives/card";
import { useAuthActions } from "@/integrations/hydrus-api/hydrus-config-store";

export function ResetCard({ resetKey }: { resetKey: () => void }) {
  const { reset } = useAuthActions();

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>(Optional) Reset all Hydrus API settings</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Button
          type="button"
          name={SETTINGS_ACTION}
          value={SETTINGS_RESET_CONFIG_ACTION}
          onClick={() => {
            reset();
            resetKey();
          }}
        >
          Reset all Hydrus API settings
        </Button>
      </CardContent>
    </Card>
  );
}
