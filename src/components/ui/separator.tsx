import {
  Separator as Divider
  
} from "react-aria-components";
import { twMerge } from "tailwind-merge";
import type {SeparatorProps} from "react-aria-components";

const Separator = ({
  orientation = "horizontal",
  className,
  ...props
}: SeparatorProps) => {
  return (
    <Divider
      className={twMerge(
        "bg-border shrink-0",
        "forced-colors:bg-[ButtonBorder]",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className,
      )}
      {...props}
    />
  );
};

export type { SeparatorProps };
export { Separator };
