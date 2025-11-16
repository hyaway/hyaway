"use client";

import { Link as LinkPrimitive } from "react-aria-components";
import type { LinkProps as LinkPrimitiveProps } from "react-aria-components";
import { cx } from "@/lib/primitive";

interface LinkProps extends LinkPrimitiveProps {
  ref?: React.RefObject<HTMLAnchorElement>;
}

const Link = ({ className, ref, ...props }: LinkProps) => {
  return (
    <LinkPrimitive
      ref={ref}
      className={cx(
        [
          "font-medium text-(--text)",
          "focus-visible:outline-ring outline-0 outline-offset-2 focus-visible:outline-2 forced-colors:outline-[Highlight]",
          "disabled:text-muted-fg disabled:cursor-default forced-colors:disabled:text-[GrayText]",
          "href" in props && "cursor-pointer",
        ],
        className,
      )}
      {...props}
    />
  );
};

export type { LinkProps };
export { Link };
