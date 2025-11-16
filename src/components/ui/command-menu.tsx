"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import { createContext, use, useEffect } from "react";
import {
  Autocomplete,
  Button,
  Collection,
  CollectionRendererContext,
  DefaultCollectionRenderer,
  Dialog,
  Header,
  Input,
  Menu as MenuPrimitive,
  MenuSection,
  Modal,
  ModalContext,
  ModalOverlay,
  OverlayTriggerStateContext,
  SearchField,
  useFilter,
} from "react-aria-components";
import { twJoin, twMerge } from "tailwind-merge";
import { DropdownKeyboard } from "./dropdown";
import { Loader } from "./loader";
import { MenuDescription, MenuItem, MenuLabel, MenuSeparator } from "./menu";
import type { MenuSectionProps } from "./menu";
import type {
  AutocompleteProps,
  CollectionRenderer,
  MenuProps,
  MenuTriggerProps,
  SearchFieldProps,
} from "react-aria-components";
import { cx } from "@/lib/primitive";

interface CommandMenuProviderProps {
  isPending?: boolean;
  escapeButton?: boolean;
}

const CommandMenuContext = createContext<CommandMenuProviderProps | undefined>(
  undefined,
);

const useCommandMenu = () => {
  const context = use(CommandMenuContext);

  if (!context) {
    throw new Error(
      "useCommandMenu must be used within a <CommandMenuProvider />",
    );
  }

  return context;
};

const sizes = {
  xs: "sm:max-w-xs",
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
  "2xl": "sm:max-w-2xl",
  "3xl": "sm:max-w-3xl",
};

interface CommandMenuProps
  extends AutocompleteProps,
    MenuTriggerProps,
    CommandMenuProviderProps {
  isDismissable?: boolean;
  "aria-label"?: string;
  shortcut?: string;
  isBlurred?: boolean;
  className?: string;
  size?: keyof typeof sizes;
}

const CommandMenu = ({
  onOpenChange,
  className,
  isDismissable = true,
  escapeButton = true,
  isPending,
  size = "lg",
  isBlurred,
  shortcut,
  ...props
}: CommandMenuProps) => {
  const { contains } = useFilter({ sensitivity: "base" });
  const filter = (textValue: string, inputValue: string) =>
    contains(textValue, inputValue);
  useEffect(() => {
    if (!shortcut) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === shortcut && (e.metaKey || e.ctrlKey)) {
        onOpenChange?.(true);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [shortcut, onOpenChange]);
  return (
    <CommandMenuContext
      value={{ isPending: isPending, escapeButton: escapeButton }}
    >
      <ModalContext
        value={{ isOpen: props.isOpen, onOpenChange: onOpenChange }}
      >
        <ModalOverlay
          isDismissable={isDismissable}
          className={twJoin(
            "fixed inset-0 z-50 h-(--visual-viewport-height,100vh) w-screen overflow-hidden bg-black/15",
            "grid grid-rows-[1fr_auto] justify-items-center text-center sm:grid-rows-[1fr_auto_3fr]",
            "entering:fade-in entering:animate-in entering:duration-300 entering:ease-out",
            "exiting:fade-out exiting:animate-out exiting:ease-in",
            isBlurred && "backdrop-blur-[1px] backdrop-filter",
          )}
          {...props}
        >
          <Modal
            className={cx(
              "bg-overlay text-overlay-fg ring-muted-fg/15 dark:ring-border row-start-2 text-left shadow-lg ring outline-none md:row-start-1",
              "max-h-[calc(var(--visual-viewport-height)*0.8)] w-full sm:fixed sm:top-[10%] sm:left-1/2 sm:-translate-x-1/2",
              "rounded-t-2xl md:rounded-xl",
              sizes[size],
              "entering:slide-in-from-bottom sm:entering:zoom-in-95 sm:entering:slide-in-from-bottom-0 entering:animate-in entering:duration-300 entering:ease-out",
              "exiting:slide-out-to-bottom sm:exiting:zoom-out-95 sm:exiting:slide-out-to-bottom-0 exiting:animate-out exiting:ease-in",
              className,
            )}
          >
            <Dialog
              aria-label={props["aria-label"] ?? "Command Menu"}
              className="flex max-h-[inherit] flex-col overflow-hidden outline-hidden"
            >
              <Autocomplete filter={filter} {...props} />
            </Dialog>
          </Modal>
        </ModalOverlay>
      </ModalContext>
    </CommandMenuContext>
  );
};

interface CommandMenuSearchProps extends SearchFieldProps {
  placeholder?: string;
  className?: string;
}

const CommandMenuSearch = ({
  className,
  placeholder,
  ...props
}: CommandMenuSearchProps) => {
  const state = use(OverlayTriggerStateContext)!;
  const { isPending, escapeButton } = useCommandMenu();
  return (
    <SearchField
      aria-label="Quick search"
      autoFocus
      className={cx("flex w-full items-center px-2.5 py-1", className)}
      {...props}
    >
      {isPending ? (
        <Loader className="size-4.5" variant="spin" />
      ) : (
        <MagnifyingGlassIcon
          data-slot="command-menu-search-icon"
          className="text-muted-fg size-5 shrink-0"
        />
      )}
      <Input
        placeholder={placeholder ?? "Search..."}
        className="text-fg placeholder-muted-fg w-full min-w-0 bg-transparent px-2.5 py-2 text-base outline-hidden focus:outline-hidden sm:px-2 sm:py-1.5 sm:text-sm [&::-ms-reveal]:hidden [&::-webkit-search-cancel-button]:hidden"
      />
      {escapeButton && (
        <Button
          onPress={() => state?.close()}
          className="hover:bg-muted hidden cursor-default rounded border text-current/90 lg:inline lg:px-1.5 lg:py-0.5 lg:text-xs"
        >
          Esc
        </Button>
      )}
    </SearchField>
  );
};

const CommandMenuList = <T extends object>({
  className,
  ...props
}: MenuProps<T>) => {
  return (
    <CollectionRendererContext.Provider value={renderer}>
      <MenuPrimitive
        className={cx(
          "grid max-h-full flex-1 grid-cols-[auto_1fr] content-start overflow-y-auto border-t p-2 sm:max-h-110 *:[[role=group]]:mb-6 *:[[role=group]]:last:mb-0",
          className,
        )}
        {...props}
      />
    </CollectionRendererContext.Provider>
  );
};

const CommandMenuSection = <T extends object>({
  className,
  ref,
  ...props
}: MenuSectionProps<T>) => {
  return (
    <MenuSection
      ref={ref}
      className={twMerge(
        "col-span-full grid grid-cols-[auto_1fr] content-start gap-y-[calc(var(--spacing)*0.25)]",
        className,
      )}
      {...props}
    >
      {"label" in props && (
        <Header className="text-muted-fg col-span-full mb-1 block min-w-(--trigger-width) truncate px-2.5 text-xs">
          {props.label}
        </Header>
      )}
      <Collection items={props.items}>{props.children}</Collection>
    </MenuSection>
  );
};

const CommandMenuItem = ({
  className,
  ...props
}: React.ComponentProps<typeof MenuItem>) => {
  const textValue =
    props.textValue ||
    (typeof props.children === "string" ? props.children : undefined);
  return (
    <MenuItem
      {...props}
      textValue={textValue}
      className={cx("items-center gap-y-0.5", className)}
    />
  );
};

interface CommandMenuDescriptionProps
  extends React.ComponentProps<typeof MenuDescription> {}

const CommandMenuDescription = ({
  className,
  ...props
}: CommandMenuDescriptionProps) => {
  return (
    <MenuDescription
      className={twMerge("col-start-3 row-start-1 ml-auto", className)}
      {...props}
    />
  );
};

const renderer: CollectionRenderer = {
  CollectionRoot(props) {
    if (props.collection.size === 0) {
      return (
        <div className="text-muted-fg col-span-full p-4 text-center text-sm">
          No results found.
        </div>
      );
    }
    return <DefaultCollectionRenderer.CollectionRoot {...props} />;
  },
  CollectionBranch: DefaultCollectionRenderer.CollectionBranch,
};

const CommandMenuSeparator = ({
  className,
  ...props
}: React.ComponentProps<typeof MenuSeparator>) => (
  <MenuSeparator className={twMerge("-mx-2", className)} {...props} />
);

const CommandMenuFooter = ({
  className,
  ...props
}: React.ComponentProps<"div">) => {
  return (
    <div
      className={twMerge(
        "text-muted-fg col-span-full flex-none border-t px-2 py-1.5 text-sm",
        "*:[kbd]:inset-ring-fg/10 *:[kbd]:bg-secondary *:[kbd]:mx-1 *:[kbd]:inline-grid *:[kbd]:h-4 *:[kbd]:min-w-4 *:[kbd]:place-content-center *:[kbd]:rounded-xs *:[kbd]:inset-ring",
        className,
      )}
      {...props}
    />
  );
};

const CommandMenuLabel = MenuLabel;
const CommandMenuShortcut = ({
  className,
  ...props
}: React.ComponentProps<typeof DropdownKeyboard>) => (
  <DropdownKeyboard
    className={twMerge(
      "*:inset-ring-muted-fg/20 *:bg-bg gap-0.5 font-sans text-[10.5px] uppercase *:grid *:size-5.5 *:place-content-center *:rounded-xs *:inset-ring",
      className,
    )}
    {...props}
  />
);

export type {
  CommandMenuProps,
  CommandMenuSearchProps,
  CommandMenuDescriptionProps,
};
export {
  CommandMenu,
  CommandMenuSearch,
  CommandMenuList,
  CommandMenuItem,
  CommandMenuLabel,
  CommandMenuSection,
  CommandMenuDescription,
  CommandMenuShortcut,
  CommandMenuSeparator,
  CommandMenuFooter,
};
