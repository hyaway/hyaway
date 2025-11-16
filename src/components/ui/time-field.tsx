import { TimeField as TimeFieldPrimitive } from "react-aria-components";
import { fieldStyles } from "./field";
import type { TimeFieldProps, TimeValue } from "react-aria-components";
import { cx } from "@/lib/primitive";

export function TimeField<T extends TimeValue>({
  className,
  ...props
}: TimeFieldProps<T>) {
  return (
    <TimeFieldPrimitive
      {...props}
      data-slot="control"
      className={cx(fieldStyles({ className: "w-fit" }), className)}
    />
  );
}
