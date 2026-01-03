import { Button } from "@/components/ui-primitives/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui-primitives/card";
import { useAuthActions } from "@/integrations/hydrus-api/hydrus-config-store";

export function ResetCard({ resetKey }: { resetKey: () => void }) {
  const { reset } = useAuthActions();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset all API settings</CardTitle>
        <CardDescription>
          Clear your API endpoint and access key configuration. You will need to
          reconfigure your connection to Hydrus.
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
