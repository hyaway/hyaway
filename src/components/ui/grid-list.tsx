"use client";

import {
  Button,
  GridListHeader as GridListHeaderPrimitive,
  GridListItem as GridListItemPrimitive,
  GridList as GridListPrimitive,
  GridListSection as GridListSectionPrimitive,
  Text,
  composeRenderProps,
} from "react-aria-components";
import { twMerge } from "tailwind-merge";
import { Checkbox } from "./checkbox";
import type {
  GridListItemProps,
  GridListProps,
  TextProps,
} from "react-aria-components";
import { cx } from "@/lib/primitive";

const GridList = <T extends object>({
  className,
  ...props
}: GridListProps<T>) => (
  <GridListPrimitive
    data-slot="grid-list"
    className={cx(
      "*:data-drop-target:border-accent relative flex flex-col gap-y-1 has-data-[slot=grid-list-section]:gap-y-6 *:data-drop-target:border sm:text-sm/6",
      className,
    )}
    {...props}
  />
);

const GridListSection = <T extends object>({
  className,
  ...props
}: React.ComponentProps<typeof GridListSectionPrimitive<T>>) => {
  return (
    <GridListSectionPrimitive
      data-slot="grid-list-section"
      className={twMerge("space-y-1", className)}
      {...props}
    />
  );
};

const GridListHeader = ({
  className,
  ...props
}: React.ComponentProps<typeof GridListHeaderPrimitive>) => {
  return (
    <GridListHeaderPrimitive
      data-slot="grid-list-header"
      className={twMerge("mb-2 text-sm/6 font-semibold", className)}
      {...props}
    />
  );
};

const GridListItem = ({ className, children, ...props }: GridListItemProps) => {
  const textValue = typeof children === "string" ? children : undefined;
  return (
    <GridListItemPrimitive
      textValue={textValue}
      {...props}
      className={composeRenderProps(
        className,
        (className, { isHovered, isFocusVisible, isSelected }) =>
          twMerge(
            "[--grid-list-item-bg-active:var(--color-primary-subtle)] [--grid-list-item-text-active:var(--color-primary-subtle-fg)]",
            "group inset-ring-border rounded-lg px-3 py-2.5 inset-ring",
            "relative min-w-0 outline-hidden [--mr-icon:--spacing(2)]",
            "flex min-w-0 cursor-default items-center gap-2 sm:gap-2.5",
            "dragging:cursor-grab dragging:opacity-70 dragging:**:[[slot=drag]]:text-(--grid-list-item-text-active)",
            "**:data-[slot=icon]:text-muted-fg **:data-[slot=icon]:size-5 **:data-[slot=icon]:shrink-0 sm:**:data-[slot=icon]:size-4",
            (isSelected || isHovered || isFocusVisible) &&
              "inset-ring-ring/70 bg-(--grid-list-item-bg-active) text-(--grid-list-item-text-active) **:[.text-muted-fg]:text-(--grid-list-item-text-active)/60",
            "href" in props && "cursor-pointer",
            className,
          ),
      )}
    >
      {(values) => (
        <>
          {values.allowsDragging && (
            <Button slot="drag">
              <svg
                data-slot="drag-icon"
                className="text-muted-fg size-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M11 5.5C11 6.32843 10.3284 7 9.5 7C8.67157 7 8 6.32843 8 5.5C8 4.67157 8.67157 4 9.5 4C10.3284 4 11 4.67157 11 5.5Z"
                  fill="currentColor"
                />
                <path
                  d="M16 5.5C16 6.32843 15.3284 7 14.5 7C13.6716 7 13 6.32843 13 5.5C13 4.67157 13.6716 4 14.5 4C15.3284 4 16 4.67157 16 5.5Z"
                  fill="currentColor"
                />
                <path
                  d="M11 18.5C11 19.3284 10.3284 20 9.5 20C8.67157 20 8 19.3284 8 18.5C8 17.6716 8.67157 17 9.5 17C10.3284 17 11 17.6716 11 18.5Z"
                  fill="currentColor"
                />
                <path
                  d="M16 18.5C16 19.3284 15.3284 20 14.5 20C13.6716 20 13 19.3284 13 18.5C13 17.6716 13.6716 17 14.5 17C15.3284 17 16 17.6716 16 18.5Z"
                  fill="currentColor"
                />
                <path
                  d="M11 12C11 12.8284 10.3284 13.5 9.5 13.5C8.67157 13.5 8 12.8284 8 12C8 11.1716 8.67157 10.5 9.5 10.5C10.3284 10.5 11 11.1716 11 12Z"
                  fill="currentColor"
                />
                <path
                  d="M16 12C16 12.8284 15.3284 13.5 14.5 13.5C13.6716 13.5 13 12.8284 13 12C13 11.1716 13.6716 10.5 14.5 10.5C15.3284 10.5 16 11.1716 16 12Z"
                  fill="currentColor"
                />
              </svg>
            </Button>
          )}

          {values.selectionMode === "multiple" &&
            values.selectionBehavior === "toggle" && (
              <Checkbox
                className="[--indicator-mt:0] *:gap-x-0 sm:[--indicator-mt:0]"
                slot="selection"
              />
            )}
          {typeof children === "function" ? children(values) : children}
        </>
      )}
    </GridListItemPrimitive>
  );
};

const GridListEmptyState = ({
  ref,
  className,
  ...props
}: React.ComponentProps<"div">) => (
  <div ref={ref} className={twMerge("p-6", className)} {...props} />
);

const GridListSpacer = ({
  className,
  ref,
  ...props
}: React.ComponentProps<"div">) => {
  return (
    <div
      ref={ref}
      aria-hidden
      className={twMerge("-ml-4 flex-1", className)}
      {...props}
    />
  );
};

const GridListStart = ({
  className,
  ref,
  ...props
}: React.ComponentProps<"div">) => {
  return (
    <div
      ref={ref}
      className={twMerge(
        "relative flex items-center gap-x-2.5 sm:gap-x-3",
        className,
      )}
      {...props}
    />
  );
};

interface GridListTextProps extends TextProps {
  ref?: React.Ref<HTMLDivElement>;
}

const GridListLabel = ({ className, ref, ...props }: GridListTextProps) => (
  <Text ref={ref} className={twMerge("font-medium", className)} {...props} />
);

const GridListDescription = ({
  className,
  ref,
  ...props
}: GridListTextProps) => (
  <Text
    slot="description"
    ref={ref}
    className={twMerge("text-muted-fg text-sm font-normal", className)}
    {...props}
  />
);

export type { GridListProps, GridListItemProps };
export {
  GridList,
  GridListSection,
  GridListHeader,
  GridListStart,
  GridListSpacer,
  GridListItem,
  GridListEmptyState,
  GridListLabel,
  GridListDescription,
};
