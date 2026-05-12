// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useEffect, useRef, useState } from "react";
import { IconAlertTriangle, IconLock } from "@tabler/icons-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui-primitives/input-otp";
import { Button } from "@/components/ui-primitives/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui-primitives/popover";
import { AuthStatusScreen } from "@/components/page-shell/auth-status-screen";
import { usePinLockActions } from "@/stores/pin-lock-store";
import { useResetConnection } from "@/hooks/use-reset-connection";
import { cn } from "@/lib/utils";

const PIN_LENGTH = 4;

export function PinLockScreen() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const { verifyPin, unlockSession, removePin } = usePinLockActions();
  const resetConnection = useResetConnection();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);

    // Dispatch a synthetic click to open the virtual keyboard on mobile.
    // autoFocus alone sets DOM focus but mobile browsers require a user
    // gesture (or a trusted click) to show the keyboard.
    if (inputRef.current) {
      const event = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        view: window,
      });
      inputRef.current.dispatchEvent(event);
    }
  }, []);

  const handleComplete = useCallback(
    (value: string) => {
      const isValid = verifyPin(value);

      if (isValid) {
        unlockSession();
      } else {
        setError(true);
        setPin("");
        // Re-focus input after clearing
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    },
    [verifyPin],
  );

  const handleResetAccess = () => {
    resetConnection();
    removePin();
    window.location.reload();
  };

  return (
    <main className="bg-background fixed inset-0">
      <AuthStatusScreen
        icon={<IconLock className="text-muted-foreground size-8" />}
        variant="default"
        title="Enter your PIN"
        description="This app is locked. Enter your PIN to continue."
        actions={
          <Popover>
            <PopoverTrigger
              render={
                <Button variant="link" className="text-muted-foreground" />
              }
            >
              Forgot PIN?
            </PopoverTrigger>
            <PopoverContent>
              <PopoverHeader>
                <div className="flex justify-center">
                  <IconAlertTriangle className="text-destructive size-6" />
                </div>
                <PopoverTitle className="text-center">
                  Forgot your PIN?
                </PopoverTitle>
                <PopoverDescription className="text-center text-balance">
                  This will reset all Hydrus API related data, and remove the
                  PIN. Your other settings will be preserved.
                </PopoverDescription>
              </PopoverHeader>
              <Button variant="destructive" onClick={handleResetAccess}>
                Remove PIN & disconnect
              </Button>
            </PopoverContent>
          </Popover>
        }
      >
        <div className="flex flex-col items-center gap-3">
          <InputOTP
            ref={inputRef}
            maxLength={PIN_LENGTH}
            value={pin}
            onChange={(value) => {
              setPin(value);
              setError(false);
            }}
            onComplete={handleComplete}
            autoFocus
            inputMode="numeric"
            pattern="[0-9]*"
          >
            <InputOTPGroup>
              {Array.from({ length: PIN_LENGTH }, (_, i) => (
                <InputOTPSlot
                  key={i}
                  index={i}
                  className={cn(
                    "size-12 text-lg",
                    error && "border-destructive",
                  )}
                />
              ))}
            </InputOTPGroup>
          </InputOTP>

          {error && (
            <p className="text-destructive text-sm" role="alert">
              Incorrect PIN. Please try again.
            </p>
          )}
        </div>
      </AuthStatusScreen>
    </main>
  );
}
