"use client";

import * as React from "react";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva } from "class-variance-authority";
import {
  IconLayoutSidebar,
  IconLayoutSidebarFilled,
  IconLayoutSidebarRight,
  IconLayoutSidebarRightFilled,
} from "@tabler/icons-react";
import { createLink } from "@tanstack/react-router";
import type { LinkComponent } from "@tanstack/react-router";
import type { VariantProps } from "class-variance-authority";
import type { SidebarSide } from "@/lib/sidebar-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui-primitives/button";
import { Input } from "@/components/ui-primitives/input";
import { Separator } from "@/components/ui-primitives/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui-primitives/sheet";
import { Skeleton } from "@/components/ui-primitives/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui-primitives/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSidebarSide, useSidebarStoreActions } from "@/lib/sidebar-store";

// ============================================================================
// Context
// ============================================================================

type SidebarContextProps = {
  side: SidebarSide;
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextProps | null>(null);

/**
 * Hook to access sidebar context. Must be used within a Sidebar component.
 * For components outside a Sidebar, use the `side` prop instead.
 */
function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a Sidebar component.");
  }
  return context;
}

/**
 * Hook that returns sidebar context if available, or null if outside a Sidebar.
 */
function useSidebarOptional() {
  return React.useContext(SidebarContext);
}

// ============================================================================
// Hooks for sidebar state
// ============================================================================

/**
 * Hook to get sidebar state from the store for a specific side.
 * Used internally by Sidebar and can be used by external triggers.
 */
function useSidebarState(side: SidebarSide) {
  const isMobile = useIsMobile();
  const {
    desktopOpen,
    mobileOpen,
    setDesktopOpen,
    setMobileOpen,
    toggleDesktop,
    toggleMobile,
  } = useSidebarSide(side);

  const state: "expanded" | "collapsed" = desktopOpen
    ? "expanded"
    : "collapsed";

  return {
    side,
    state,
    open: desktopOpen,
    setOpen: setDesktopOpen,
    openMobile: mobileOpen,
    setOpenMobile: setMobileOpen,
    isMobile,
    toggleSidebar: () => (isMobile ? toggleMobile() : toggleDesktop()),
  };
}

/**
 * Static context value for non-collapsible sidebars.
 * These sidebars are always expanded and don't need state management.
 */
function useStaticSidebarContext(side: SidebarSide): SidebarContextProps {
  const isMobile = useIsMobile();

  return React.useMemo<SidebarContextProps>(
    () => ({
      side,
      state: "expanded",
      open: true,
      setOpen: () => {},
      openMobile: false,
      setOpenMobile: () => {},
      isMobile,
      toggleSidebar: () => {},
    }),
    [side, isMobile],
  );
}

// ============================================================================
// SidebarLayout - Simple layout wrapper (replaces SidebarProvider)
// ============================================================================

/**
 * Layout wrapper for sidebar-based layouts.
 * This is a simple container with no state management.
 * Each Sidebar component manages its own state independently.
 */
function SidebarLayout({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-layout"
      className={cn(
        "has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full overflow-x-clip",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ============================================================================
// Sidebar Components
// ============================================================================

type SidebarProps = React.ComponentProps<"div"> & {
  side?: SidebarSide;
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
};

/**
 * Non-collapsible sidebar - always expanded, no state management needed.
 */
function SidebarStatic({
  side,
  className,
  children,
  ...props
}: Omit<SidebarProps, "side" | "variant" | "collapsible"> & {
  side: SidebarSide;
}) {
  const context = useStaticSidebarContext(side);

  return (
    <SidebarContext.Provider value={context}>
      <div
        data-slot="sidebar"
        data-side={side}
        className={cn(
          "bg-sidebar text-sidebar-foreground flex h-full w-(--sidebar-width) flex-col",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

/**
 * Mobile sidebar - renders as a Sheet overlay.
 */
function SidebarMobile({
  side,
  children,
  ...props
}: Omit<SidebarProps, "side" | "variant" | "collapsible" | "className"> & {
  side: SidebarSide;
}) {
  const context = useSidebarState(side);
  const { openMobile, setOpenMobile } = context;

  // Skip animation if mounted already open (e.g., switching from desktop to mobile)
  const mountedOpenRef = React.useRef(openMobile);
  const skipOpenAnimation = mountedOpenRef.current && openMobile;

  // Clear the flag after first render so subsequent opens animate normally
  React.useEffect(() => {
    mountedOpenRef.current = false;
  }, []);

  return (
    <SidebarContext.Provider value={context}>
      <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
        <SheetContent
          data-sidebar="sidebar"
          data-slot="sidebar"
          data-mobile="true"
          className="bg-sidebar text-sidebar-foreground max-w-(--sidebar-width-mobile)! p-0 [&>button]:hidden"
          side={side}
          skipOpenAnimation={skipOpenAnimation}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Sidebar</SheetTitle>
            <SheetDescription>Displays the mobile sidebar.</SheetDescription>
          </SheetHeader>
          <div className="flex h-full w-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    </SidebarContext.Provider>
  );
}

/**
 * Desktop sidebar - collapsible with gap animation.
 */
function SidebarDesktop({
  side,
  variant,
  collapsible,
  className,
  children,
  ...props
}: Omit<SidebarProps, "side" | "collapsible"> & {
  side: SidebarSide;
  collapsible: "offcanvas" | "icon";
}) {
  const context = useSidebarState(side);
  const { state } = context;

  return (
    <SidebarContext.Provider value={context}>
      <div
        className="group peer text-sidebar-foreground hidden md:block"
        data-state={state}
        data-collapsible={state === "collapsed" ? collapsible : ""}
        data-variant={variant}
        data-side={side}
        data-slot="sidebar"
      >
        {/* Gap element that animates width */}
        <div
          data-slot="sidebar-gap"
          className={cn(
            "relative w-(--sidebar-width) bg-transparent transition-[width] duration-(--sidebar-open-close-duration) ease-(--sidebar-open-close-easing)",
            "group-data-[collapsible=offcanvas]:w-0",
            "group-data-[side=right]:rotate-180",
            variant === "floating" || variant === "inset"
              ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]"
              : "group-data-[collapsible=icon]:w-(--sidebar-width-icon)",
          )}
        />
        <div
          data-slot="sidebar-container"
          // Prevent focus when collapsed offscreen
          inert={state === "collapsed" && collapsible === "offcanvas"}
          className={cn(
            "fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-(--sidebar-open-close-duration) ease-(--sidebar-open-close-easing) md:flex",
            side === "left"
              ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
              : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
            variant === "floating" || variant === "inset"
              ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]"
              : "group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l",
            className,
          )}
          {...props}
        >
          <div
            data-sidebar="sidebar"
            data-slot="sidebar-inner"
            className="bg-sidebar group-data-[variant=floating]:ring-sidebar-border flex size-full flex-col group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:shadow-sm group-data-[variant=floating]:ring-1"
          >
            {children}
          </div>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}

/**
 * Main Sidebar component - delegates to Static, Mobile, or Desktop variant.
 */
function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  ...props
}: SidebarProps) {
  const isMobile = useIsMobile();

  if (collapsible === "none") {
    return <SidebarStatic side={side} {...props} />;
  }

  if (isMobile) {
    return <SidebarMobile side={side} {...props} />;
  }

  return (
    <SidebarDesktop
      side={side}
      variant={variant}
      collapsible={collapsible}
      {...props}
    />
  );
}

// ============================================================================
// SidebarTrigger
// ============================================================================

function SidebarTrigger({
  side,
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button> & {
  /** Required when used outside a Sidebar component */
  side?: SidebarSide;
}) {
  const context = useSidebarOptional();
  const storeActions = useSidebarStoreActions();
  const isMobile = useIsMobile();
  const sidebarState = useSidebarSide(side ?? context?.side ?? "left");

  const toggleSidebar = React.useCallback(() => {
    if (context) {
      // Inside a sidebar - use its context (handles mobile/desktop)
      context.toggleSidebar();
    } else if (side) {
      // Outside - use store directly, check mobile state
      if (isMobile) {
        storeActions.toggleMobile(side);
      } else {
        storeActions.toggleDesktop(side);
      }
    } else {
      throw new Error(
        "SidebarTrigger requires a `side` prop when used outside a Sidebar component.",
      );
    }
  }, [context, side, storeActions, isMobile]);

  // Determine which side for aria-label
  const effectiveSide = context?.side ?? side ?? "left";
  const isExpanded = isMobile
    ? sidebarState.mobileOpen
    : sidebarState.desktopOpen;

  // Select icon based on side and expanded state
  // Filled when expanded, outline when collapsed
  const Icon =
    effectiveSide === "left"
      ? isExpanded
        ? IconLayoutSidebarFilled
        : IconLayoutSidebar
      : isExpanded
        ? IconLayoutSidebarRightFilled
        : IconLayoutSidebarRight;

  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      data-side={effectiveSide}
      variant="ghost"
      size="icon-sm"
      className={cn(className)}
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      aria-label={`Toggle ${effectiveSide} sidebar`}
      {...props}
    >
      <Icon />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
}

function SidebarRail({ className, ...props }: React.ComponentProps<"button">) {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      data-sidebar="rail"
      data-slot="sidebar-rail"
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle Sidebar"
      className={cn(
        "hover:after:bg-sidebar-border absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-(--sidebar-open-close-easing) group-data-[side=left]:-right-4 group-data-[side=right]:left-0 after:absolute after:inset-y-0 after:left-1/2 after:w-0.5 sm:flex",
        "in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize",
        "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
        "hover:group-data-[collapsible=offcanvas]:bg-sidebar group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full",
        "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
        "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
        className,
      )}
      {...props}
    />
  );
}

function SidebarInset({ className, ...props }: React.ComponentProps<"main">) {
  return (
    <main
      data-slot="sidebar-inset"
      className={cn(
        "bg-background relative flex w-full flex-1 flex-col md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2",
        className,
      )}
      {...props}
    />
  );
}

function SidebarInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <Input
      data-slot="sidebar-input"
      data-sidebar="input"
      className={cn("bg-background h-10 w-full shadow-none", className)}
      {...props}
    />
  );
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-header"
      data-sidebar="header"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  );
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-footer"
      data-sidebar="footer"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  );
}

function SidebarSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="sidebar-separator"
      data-sidebar="separator"
      className={cn("bg-sidebar-border mx-2 w-auto", className)}
      {...props}
    />
  );
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-content"
      data-sidebar="content"
      className={cn(
        "no-scrollbar flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden",
        className,
      )}
      {...props}
    />
  );
}

function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group"
      data-sidebar="group"
      className={cn("relative flex w-full min-w-0 flex-col p-2", className)}
      {...props}
    />
  );
}

function SidebarGroupLabel({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div"> & React.ComponentProps<"div">) {
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(
      {
        className: cn(
          "text-sidebar-foreground/70 ring-sidebar-ring flex h-9 shrink-0 items-center rounded-md px-2 text-xs font-medium outline-hidden transition-[margin,opacity] duration-200 ease-linear group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0 focus-visible:ring-2 [&>svg]:size-6 [&>svg]:shrink-0",
          className,
        ),
      },
      props,
    ),
    render,
    state: {
      slot: "sidebar-group-label",
      sidebar: "group-label",
    },
  });
}

function SidebarGroupAction({
  className,
  render,
  ...props
}: useRender.ComponentProps<"button"> & React.ComponentProps<"button">) {
  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(
      {
        className: cn(
          "text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground absolute top-3.5 right-3 flex aspect-square w-6 items-center justify-center rounded-md p-0 outline-hidden transition-transform group-data-[collapsible=icon]:hidden after:absolute after:-inset-2 focus-visible:ring-2 md:after:hidden [&>svg]:size-6 [&>svg]:shrink-0",
          className,
        ),
      },
      props,
    ),
    render,
    state: {
      slot: "sidebar-group-action",
      sidebar: "group-action",
    },
  });
}

function SidebarGroupContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group-content"
      data-sidebar="group-content"
      className={cn("w-full text-sm", className)}
      {...props}
    />
  );
}

function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu"
      data-sidebar="menu"
      className={cn("flex w-full min-w-0 flex-col gap-1", className)}
      {...props}
    />
  );
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-item"
      data-sidebar="menu-item"
      className={cn("group/menu-item relative", className)}
      {...props}
    />
  );
}

const sidebarMenuButtonVariants = cva(
  "relative ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground data-open:hover:bg-sidebar-accent data-open:hover:text-sidebar-accent-foreground gap-2.5 rounded-lg p-2.5 text-left text-sm transition-[width,height,padding] group-has-data-[sidebar=menu-action]/menu-item:pr-10 group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:p-2! focus-visible:ring-2 data-active:font-medium peer/menu-button flex w-full items-center overflow-hidden outline-hidden group/menu-button disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&_svg]:size-6 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        outline:
          "bg-background hover:bg-sidebar-accent hover:text-sidebar-accent-foreground shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]",
      },
      size: {
        default: "h-11 text-sm",
        sm: "h-9 text-xs [&_svg]:size-5",
        lg: "h-14 text-sm group-data-[collapsible=icon]:p-0.5!",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function SidebarMenuButton({
  render,
  isActive = false,
  variant = "default",
  size = "default",
  tooltip,
  className,
  ...props
}: useRender.ComponentProps<"button"> &
  React.ComponentProps<"button"> & {
    isActive?: boolean;
    tooltip?: string | React.ComponentProps<typeof TooltipContent>;
  } & VariantProps<typeof sidebarMenuButtonVariants>) {
  const { isMobile, state } = useSidebar();
  const comp = useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(
      {
        className: cn(sidebarMenuButtonVariants({ variant, size }), className),
      },
      props,
    ),
    render: !tooltip ? render : TooltipTrigger,
    state: {
      slot: "sidebar-menu-button",
      sidebar: "menu-button",
      size,
      active: isActive,
    },
  });

  if (!tooltip) {
    return comp;
  }

  if (typeof tooltip === "string") {
    tooltip = {
      children: tooltip,
    };
  }

  return (
    <Tooltip>
      {comp}
      <TooltipContent
        side="right"
        align="center"
        hidden={state !== "collapsed" || isMobile}
        {...tooltip}
      />
    </Tooltip>
  );
}

const CreatedSidebarMenuLinkButton = createLink(SidebarMenuButton);

const SidebarMenuLinkButton: LinkComponent<typeof SidebarMenuButton> = (
  props,
) => {
  return (
    <CreatedSidebarMenuLinkButton
      activeProps={{
        isActive: true,
        "data-active": true,
      }}
      {...props}
    />
  );
};

function SidebarMenuAction({
  className,
  render,
  showOnHover = false,
  ...props
}: useRender.ComponentProps<"button"> &
  React.ComponentProps<"button"> & {
    showOnHover?: boolean;
  }) {
  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(
      {
        className: cn(
          "text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground peer-hover/menu-button:text-sidebar-accent-foreground absolute top-2 right-1.5 flex aspect-square w-6 items-center justify-center rounded-md p-0 outline-hidden transition-transform group-data-[collapsible=icon]:hidden peer-data-[size=default]/menu-button:top-2.5 peer-data-[size=lg]/menu-button:top-3.5 peer-data-[size=sm]/menu-button:top-1.5 after:absolute after:-inset-2 focus-visible:ring-2 md:after:hidden [&>svg]:size-6 [&>svg]:shrink-0",
          showOnHover &&
            "peer-data-active/menu-button:text-sidebar-accent-foreground group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-open:opacity-100 md:opacity-0",
          className,
        ),
      },
      props,
    ),
    render,
    state: {
      slot: "sidebar-menu-action",
      sidebar: "menu-action",
    },
  });
}

function SidebarMenuBadge({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-menu-badge"
      data-sidebar="menu-badge"
      className={cn(
        "text-sidebar-foreground peer-hover/menu-button:text-sidebar-accent-foreground peer-data-active/menu-button:text-sidebar-accent-foreground pointer-events-none absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums select-none group-data-[collapsible=icon]:hidden peer-data-[size=default]/menu-button:top-1.5 peer-data-[size=lg]/menu-button:top-2.5 peer-data-[size=sm]/menu-button:top-1",
        className,
      )}
      {...props}
    />
  );
}

function SidebarMenuSkeleton({
  className,
  showIcon = false,
  ...props
}: React.ComponentProps<"div"> & {
  showIcon?: boolean;
}) {
  // Random width between 50 to 90%.
  const [width] = React.useState(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`;
  });

  return (
    <div
      data-slot="sidebar-menu-skeleton"
      data-sidebar="menu-skeleton"
      className={cn(
        "flex h-10 items-center gap-2.5 rounded-md px-2.5",
        className,
      )}
      {...props}
    >
      {showIcon && (
        <Skeleton
          className="size-6 rounded-md"
          data-sidebar="menu-skeleton-icon"
        />
      )}
      <Skeleton
        className="h-5 max-w-(--skeleton-width) flex-1"
        data-sidebar="menu-skeleton-text"
        style={
          {
            "--skeleton-width": width,
          } as React.CSSProperties
        }
      />
    </div>
  );
}

function SidebarMenuSub({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu-sub"
      data-sidebar="menu-sub"
      className={cn(
        "border-sidebar-border mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l px-2.5 py-0.5 group-data-[collapsible=icon]:hidden",
        className,
      )}
      {...props}
    />
  );
}

function SidebarMenuSubItem({
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-sub-item"
      data-sidebar="menu-sub-item"
      className={cn("group/menu-sub-item relative", className)}
      {...props}
    />
  );
}

function SidebarMenuSubButton({
  render,
  size = "md",
  isActive = false,
  className,
  ...props
}: useRender.ComponentProps<"a"> &
  React.ComponentProps<"a"> & {
    size?: "sm" | "md";
    isActive?: boolean;
  }) {
  return useRender({
    defaultTagName: "a",
    props: mergeProps<"a">(
      {
        className: cn(
          "text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground [&>svg]:text-sidebar-accent-foreground data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground flex h-9 min-w-0 -translate-x-px items-center gap-2.5 overflow-hidden rounded-md px-2.5 outline-hidden group-data-[collapsible=icon]:hidden focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[size=md]:text-sm data-[size=sm]:text-xs [&>span:last-child]:truncate [&>svg]:size-6 [&>svg]:shrink-0",
          className,
        ),
      },
      props,
    ),
    render,
    state: {
      slot: "sidebar-menu-sub-button",
      sidebar: "menu-sub-button",
      size,
      active: isActive,
    },
  });
}

const CreatedSidebarMenuSubLinkButton = createLink(SidebarMenuSubButton);

const SidebarMenuSubLinkButton: LinkComponent<typeof SidebarMenuSubButton> = (
  props,
) => {
  return (
    <CreatedSidebarMenuSubLinkButton
      activeProps={{
        isActive: true,
        "data-active": true,
      }}
      {...props}
    />
  );
};

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarLayout,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuLinkButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubLinkButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
  useSidebarOptional,
};
