import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui-primitives/card";
import { Separator } from "../ui/separator";
import { AccessKeyField } from "./access-key-field";
import { RequestNewPermissionsField } from "./request-new-permissions-field";

export function AccessKeyCard() {
  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>2. Set access key</CardTitle>
        <CardDescription>
          Generate or enter an access key for your Hydrus client.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <RequestNewPermissionsField />
        <Separator />
        <AccessKeyField />
      </CardContent>
    </Card>
  );
}
