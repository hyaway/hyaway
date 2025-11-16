import {
  DropZone as DropPrimitiveZone,
  composeRenderProps,
} from "react-aria-components";
import { twMerge } from "tailwind-merge";
import type { DropZoneProps } from "react-aria-components";

const DropZone = ({ className, style, ...props }: DropZoneProps) => (
  <DropPrimitiveZone
    className={composeRenderProps(className, (className, { isDropTarget }) =>
      twMerge(
        "group/drop-zone relative z-10 flex max-h-56 items-center justify-center overflow-hidden rounded-lg border border-dashed p-6",
        isDropTarget &&
          "border-primary bg-primary/10 ring-ring/20 border-solid ring-3",
        className,
      ),
    )}
    {...props}
  />
);

export { DropZone };
