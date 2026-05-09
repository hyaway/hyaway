// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useState } from "react";
import { IconInfoCircle, IconLock } from "@tabler/icons-react";
import {
  SettingsCardTitle,
  SettingsSubheading,
} from "@/components/settings/settings-ui";
import { Separator } from "@/components/ui-primitives/separator";
import { Alert, AlertDescription } from "@/components/ui-primitives/alert";
import { Button } from "@/components/ui-primitives/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui-primitives/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui-primitives/input-otp";
import { Label } from "@/components/ui-primitives/label";
import { SliderField } from "@/components/settings/setting-fields";
import {
  AUTO_LOCK_OFF,
  useIsPinEnabled,
  useLockAfterMinutes,
  usePinLockActions,
} from "@/stores/pin-lock-store";

const PIN_LENGTH = 4;

export function PinLockSettingsCard() {
  const isPinEnabled = useIsPinEnabled();
  const lockAfterMinutes = useLockAfterMinutes();
  const { setPin, removePin, lockSession, setLockAfterMinutes } =
    usePinLockActions();

  const [newPin, setNewPin] = useState("");
  const [step, setStep] = useState<"idle" | "new">("idle");

  const resetForm = () => {
    setNewPin("");
    setStep("idle");
  };

  const handleSavePin = () => {
    if (newPin.length < PIN_LENGTH) return;
    setPin(newPin);
    // Lock session to show the lock screen immediately
    lockSession();
  };

  return (
    <Card>
      <CardHeader>
        <SettingsCardTitle>PIN lock</SettingsCardTitle>
        <CardDescription>
          {isPinEnabled
            ? "A PIN is set and will be required each time you open a new session."
            : "Set a PIN to lock the app. You'll need to enter it each time you open a new session."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {step === "idle" && (
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => setStep("new")}>
              {isPinEnabled ? "Change PIN" : "Set PIN"}
            </Button>
            {isPinEnabled && (
              <Button variant="outline" onClick={removePin}>
                Remove PIN
              </Button>
            )}
          </div>
        )}

        {step === "new" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSavePin();
            }}
            className="flex flex-col items-center gap-3 sm:items-start"
          >
            <Label>{isPinEnabled ? "Enter new PIN" : "Enter PIN"}</Label>
            <InputOTP
              maxLength={PIN_LENGTH}
              value={newPin}
              onChange={setNewPin}
              autoFocus
              inputMode="numeric"
              pattern="[0-9]*"
            >
              <InputOTPGroup>
                {Array.from({ length: PIN_LENGTH }, (_, i) => (
                  <InputOTPSlot key={i} index={i} className="size-12 text-lg" />
                ))}
              </InputOTPGroup>
            </InputOTP>
            <div className="flex gap-2">
              <Button type="submit" disabled={newPin.length < PIN_LENGTH}>
                <IconLock data-icon="inline-start" />
                Save & lock
              </Button>
              <Button type="button" variant="ghost" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        <Alert>
          <IconInfoCircle />
          <AlertDescription>
            This is intended to prevent accidental access to hyAway when someone
            is using your device. It can be bypassed easily with some browser
            knowledge.
          </AlertDescription>
        </Alert>

        {step === "idle" && isPinEnabled && (
          <>
            <Separator />
            <SettingsSubheading>Auto-lock</SettingsSubheading>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <SliderField
                  id="lock-after-slider"
                  label="Lock when in background after"
                  value={lockAfterMinutes}
                  min={AUTO_LOCK_OFF}
                  max={30}
                  step={1}
                  onValueChange={setLockAfterMinutes}
                  formatValue={(v) =>
                    v === AUTO_LOCK_OFF ? "Off" : `${v} min`
                  }
                />
                <p className="text-muted-foreground text-sm">
                  Lock the app after being in the background (e.g. switching
                  tabs or minimizing), unless your browser ends the session
                  earlier.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={lockSession}
                className="self-start"
              >
                <IconLock data-icon="inline-start" />
                Lock now
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
