import { AccessKeyField } from "./access-key-field";
import { RequestNewPermissionsField } from "./request-new-permissions-field";
import { SettingsCardTitle } from "@/components/settings/settings-ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui-primitives/card";
import { Separator } from "@/components/ui-primitives/separator";

export function AccessKeyCard() {
  return (
    <Card>
      <CardHeader>
        <SettingsCardTitle>2. Set access key</SettingsCardTitle>
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
