import { ColorField as ColorFieldPrimitive } from "react-aria-components";
import { fieldStyles } from "./field";
import type { ColorFieldProps } from "react-aria-components";
import { cx } from "@/lib/primitive";

export function ColorField({ className, ...props }: ColorFieldProps) {
  return (
    <ColorFieldPrimitive
      {...props}
      aria-label={props["aria-label"] ?? "Color field"}
      data-slot="control"
      className={cx(fieldStyles(), className)}
    />
  );
}
