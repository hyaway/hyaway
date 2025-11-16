import { ColorArea as ColorAreaPrimitive } from "react-aria-components";
import { ColorThumb } from "./color-thumb";
import type { ColorAreaProps } from "react-aria-components";
import { cx } from "@/lib/primitive";

export function ColorArea({ className, ...props }: ColorAreaProps) {
  return (
    <ColorAreaPrimitive
      {...props}
      data-slot="color-area"
      className={cx(
        "bg-muted disabled:bg-muted-fg size-56 shrink-0 rounded-md forced-colors:bg-[GrayText]",
        className,
      )}
      style={({ defaultStyle, isDisabled }) => ({
        ...defaultStyle,
        background: isDisabled ? undefined : defaultStyle.background,
      })}
    >
      <ColorThumb />
    </ColorAreaPrimitive>
  );
}
