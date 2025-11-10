import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { SETTINGS_ACTION, SETTINGS_RESET_CONFIG_ACTION } from "./constants";
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
          onPress={() => {
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
