import { AxiosError } from "axios";
import { ExclamationCircleIcon } from "@heroicons/react/16/solid";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui-primitives/alert";

interface PageErrorProps {
  error: unknown;
  fallbackMessage?: string;
}

export function PageError({
  error,
  fallbackMessage = "An unknown error occurred.",
}: PageErrorProps) {
  return (
    <Alert variant="destructive">
      <ExclamationCircleIcon />
      <AlertTitle>
        {error instanceof Error ? error.message : fallbackMessage}
      </AlertTitle>
      <AlertDescription>
        {error instanceof AxiosError && error.response?.data?.error ? (
          <span>{error.response.data.error}</span>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}
