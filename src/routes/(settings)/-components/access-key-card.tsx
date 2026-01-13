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
          Request a new key from Hydrus, or paste an existing 64-character
          access key.
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
