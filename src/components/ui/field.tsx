"use client";

import {
  FieldError as FieldErrorPrimitive,
  Label as LabelPrimitive,
  Text,
} from "react-aria-components";
import { twMerge } from "tailwind-merge";
import { tv } from "tailwind-variants";
import type {
  FieldErrorProps,
  LabelProps,
  TextProps,
} from "react-aria-components";
import { cx } from "@/lib/primitive";

export const labelStyles = tv({
  base: "text-fg text-base/6 select-none group-disabled:opacity-50 in-disabled:opacity-50 sm:text-sm/6",
});

export const descriptionStyles = tv({
  base: "text-muted-fg block text-sm/6 group-disabled:opacity-50 in-disabled:opacity-50",
});

export const fieldErrorStyles = tv({
  base: "text-danger-subtle-fg block text-sm/6 group-disabled:opacity-50 in-disabled:opacity-50 forced-colors:text-[Mark]",
});

export const fieldStyles = tv({
  base: [
    "w-full",
    "[&>[data-slot=label]+[data-slot=control]]:mt-2",
    "[&>[data-slot=label]+[data-slot=control]]:mt-2",
    "[&>[data-slot=label]+[slot='description']]:mt-1",
    "[&>[slot='description']+[data-slot=control]]:mt-2",
    "[&>[data-slot=control]+[slot=description]]:mt-2",
    "[&>[data-slot=control]+[slot=errorMessage]]:mt-2",
    "*:data-[slot=label]:font-medium",
  ],
});

const Label = ({ className, ...props }: LabelProps) => {
  return (
    <LabelPrimitive
      data-slot="label"
      {...props}
      className={labelStyles({ className })}
    />
  );
};

const Description = ({ className, ...props }: TextProps) => {
  return (
    <Text
      {...props}
      slot="description"
      className={descriptionStyles({ className })}
    />
  );
};

const FieldError = ({ className, ...props }: FieldErrorProps) => {
  return (
    <FieldErrorPrimitive
      {...props}
      className={cx(fieldErrorStyles(), className)}
    />
  );
};

const Fieldset = ({
  className,
  ...props
}: React.ComponentProps<"fieldset">) => {
  return (
    <fieldset
      className={twMerge(
        "*:data-[slot=text]:mt-1 [&>*+[data-slot=control]]:mt-6",
        className,
      )}
      {...props}
    />
  );
};

const Legend = ({ className, ...props }: React.ComponentProps<"legend">) => {
  return (
    <legend
      data-slot="legend"
      {...props}
      className={twMerge(
        "text-base/6 font-semibold data-disabled:opacity-50",
        className,
      )}
    />
  );
};

export { Description, FieldError, Fieldset, Legend, Label };
