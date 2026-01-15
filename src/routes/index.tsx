import { Link, createFileRoute } from "@tanstack/react-router";
import {
  IconAlbum,
  IconArchive,
  IconArrowsShuffle,
  IconBrandGithub,
  IconBrandX,
  IconCalendarStats,
  IconCards,
  IconChartArea,
  IconClock,
  IconDatabase,
  IconDevices,
  IconExternalLink,
  IconEye,
  IconHandFinger,
  IconHandMove,
  IconLayoutDashboard,
  IconLayoutGrid,
  IconLock,
  IconMail,
  IconPalette,
  IconSwipe,
  IconTrash,
} from "@tabler/icons-react";
import { Heading, Subheading } from "@/components/ui-primitives/heading";
import { Button, LinkButton } from "@/components/ui-primitives/button";
import { Separator } from "@/components/ui-primitives/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui-primitives/tooltip";
import { useIsApiConfigured } from "@/integrations/hydrus-api/hydrus-config-store";
import { usePermissions } from "@/integrations/hydrus-api/queries/permissions";
import { Permission } from "@/integrations/hydrus-api/models";
import { PERMISSION_LABELS } from "@/integrations/hydrus-api/permissions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

// Feature item for marketing section
interface FeatureItem {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const FEATURES: Array<FeatureItem> = [
  {
    title: "Review faster",
    description:
      "Manage your inbox with swipe gestures or keyboard shortcuts. See your progress in the recently archived and trashed galleries.",
    icon: IconHandMove,
  },
  {
    title: "Browse anywhere",
    description:
      "Access your hydrus client's open pages even when you're away. Browse the same searches you have running at home.",
    icon: IconDevices,
  },
  {
    title: "Preset galleries",
    description:
      "Random inbox, recently inboxed, most viewed, longest viewed — jump straight into browsing without setting up searches.",
    icon: IconAlbum,
  },
  {
    title: "Make it yours",
    description:
      "Adjust layouts, thumbnail sizes, animations, and theme. Install as a PWA for quick access.",
    icon: IconPalette,
  },
];

// Navigation item definition
interface NavItem {
  title: string;
  description: string;
  to:
    | "/"
    | "/pages"
    | "/random-inbox"
    | "/review"
    | "/recently-inboxed"
    | "/recently-archived"
    | "/recently-trashed"
    | "/history"
    | "/remote-history"
    | "/most-viewed"
    | "/longest-viewed"
    | "/settings"
    | "/settings/connection"
    | "/settings/appearance"
    | "/settings/data";
  icon: React.ComponentType<{ className?: string }>;
  requiredPermissions?: Array<Permission>;
}

interface NavGroup {
  title: string;
  items: Array<NavItem>;
}

const NAV_GROUPS: Array<NavGroup> = [
  {
    title: "Browse",
    items: [
      {
        title: "Pages",
        description:
          "Browse your Hydrus client's active page tabs and their contents",
        to: "/pages",
        icon: IconLayoutGrid,
        requiredPermissions: [
          Permission.SEARCH_FOR_AND_FETCH_FILES,
          Permission.MANAGE_PAGES,
        ],
      },
      {
        title: "Random inbox",
        description:
          "Shuffle through random files from your inbox for discovery",
        to: "/random-inbox",
        icon: IconArrowsShuffle,
        requiredPermissions: [Permission.SEARCH_FOR_AND_FETCH_FILES],
      },
      {
        title: "Review queue",
        description:
          "Archive or trash files with swipe gestures or keyboard shortcuts",
        to: "/review",
        icon: IconCards,
        requiredPermissions: [
          Permission.SEARCH_FOR_AND_FETCH_FILES,
          Permission.IMPORT_AND_DELETE_FILES,
        ],
      },
    ],
  },
  {
    title: "Recent Activity",
    items: [
      {
        title: "Recently inboxed",
        description: "View files recently added to your inbox",
        to: "/recently-inboxed",
        icon: IconMail,
        requiredPermissions: [Permission.SEARCH_FOR_AND_FETCH_FILES],
      },
      {
        title: "Recently archived",
        description: "View files you've recently archived",
        to: "/recently-archived",
        icon: IconArchive,
        requiredPermissions: [Permission.SEARCH_FOR_AND_FETCH_FILES],
      },
      {
        title: "Recently trashed",
        description: "View files you've recently sent to trash",
        to: "/recently-trashed",
        icon: IconTrash,
        requiredPermissions: [Permission.SEARCH_FOR_AND_FETCH_FILES],
      },
    ],
  },
  {
    title: "Statistics",
    items: [
      {
        title: "Watch history",
        description: "Files you viewed in this browser, stored locally",
        to: "/history",
        icon: IconEye,
        requiredPermissions: [Permission.SEARCH_FOR_AND_FETCH_FILES],
      },
      {
        title: "Remote history",
        description: "Files you viewed from Hydrus client",
        to: "/remote-history",
        icon: IconCalendarStats,
        requiredPermissions: [Permission.SEARCH_FOR_AND_FETCH_FILES],
      },
      {
        title: "Most viewed",
        description: "Files ranked by total view count",
        to: "/most-viewed",
        icon: IconChartArea,
        requiredPermissions: [Permission.SEARCH_FOR_AND_FETCH_FILES],
      },
      {
        title: "Longest viewed",
        description: "Files ranked by total watch time",
        to: "/longest-viewed",
        icon: IconClock,
        requiredPermissions: [Permission.SEARCH_FOR_AND_FETCH_FILES],
      },
    ],
  },
  {
    title: "Settings",
    items: [
      {
        title: "Connection",
        description: "Configure your Hydrus API connection and access keys",
        to: "/settings/connection",
        icon: IconLock,
      },
      {
        title: "Appearance",
        description: "Customize theme, gallery layout, and display preferences",
        to: "/settings/appearance",
        icon: IconLayoutDashboard,
      },
      {
        title: "Data",
        description: "Manage local storage, cache, and watch history",
        to: "/settings/data",
        icon: IconDatabase,
      },
    ],
  },
];

function LandingPage() {
  const isConfigured = useIsApiConfigured();

  return (
    <div className="flex flex-col gap-12 pb-8">
      {isConfigured ? <WelcomeHeader /> : <MarketingHeader />}
      <ShortcutsGrid />
      <AboutSection />
    </div>
  );
}

function WelcomeHeader() {
  return (
    <header className="flex flex-col gap-2">
      <Heading level={1} className="text-3xl font-bold">
        Welcome back
      </Heading>
      <p className="text-muted-foreground text-lg">
        What would you like to do?
      </p>
    </header>
  );
}

function MarketingHeader() {
  return (
    <section className="flex flex-col gap-8">
      <header className="relative flex flex-col gap-6 rounded-xl border p-6 sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-xl"
        >
          <div className="from-primary/15 via-primary/5 absolute inset-0 bg-linear-to-br to-transparent" />
        </div>
        <div className="flex flex-col gap-3">
          <Heading level={1} className="text-3xl font-bold sm:text-4xl">
            hyAway
          </Heading>
          <Subheading
            level={2}
            className="text-muted-foreground text-lg sm:text-xl"
          >
            Browse and review your{" "}
            <a
              href="https://hydrusnetwork.github.io/hydrus/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              hydrus network
            </a>{" "}
            library — away from home.
          </Subheading>
        </div>
        <div className="flex flex-wrap gap-3">
          <LinkButton to="/settings/connection" size="lg">
            Get started
          </LinkButton>
          <a
            href="https://github.com/hyaway/hyaway/blob/main/docs/SETUP.md"
            target="_blank"
            rel="noopener noreferrer"
            className="border-border bg-input/30 hover:bg-input/50 hover:text-foreground inline-flex h-12 items-center justify-center gap-2 rounded-4xl border px-5 text-sm font-medium transition-all"
          >
            Need help?
            <IconExternalLink className="size-4" />
          </a>
        </div>
      </header>
      <FeaturesGrid />
    </section>
  );
}

function FeaturesGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {FEATURES.map((feature) => (
        <FeatureCard key={feature.title} feature={feature} />
      ))}
    </div>
  );
}

function FeatureCard({ feature }: { feature: FeatureItem }) {
  const Icon = feature.icon;
  return (
    <article className="flex flex-col gap-2 p-3">
      <div className="bg-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
        <Icon className="text-primary-foreground size-6" />
      </div>
      <div className="flex flex-col gap-1">
        <Heading level={3} className="text-sm font-medium">
          {feature.title}
        </Heading>
        <p className="text-muted-foreground text-sm">{feature.description}</p>
      </div>
    </article>
  );
}

function ShortcutsGrid() {
  const { hasPermission, isFetched } = usePermissions();
  const isConfigured = useIsApiConfigured();

  return (
    <div className="flex flex-col gap-8">
      {NAV_GROUPS.map((group) => (
        <section key={group.title} className="flex flex-col gap-4">
          <Heading level={2} className="text-xl font-semibold">
            {group.title}
          </Heading>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {group.items.map((item) => (
              <ShortcutCard
                key={item.to}
                item={item}
                isConfigured={isConfigured}
                permissionsFetched={isFetched}
                hasPermission={hasPermission}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

interface ShortcutCardProps {
  item: NavItem;
  isConfigured: boolean;
  permissionsFetched: boolean;
  hasPermission: (permission: Permission) => boolean;
}

function ShortcutCard({
  item,
  isConfigured,
  permissionsFetched,
  hasPermission,
}: ShortcutCardProps) {
  const Icon = item.icon;
  const requiresPermissions = (item.requiredPermissions ?? []).length > 0;

  // Check permissions
  const missingPermissions = (item.requiredPermissions ?? []).filter(
    (p) => !hasPermission(p),
  );
  // Items without required permissions (like Settings) are never muted
  const isMuted =
    requiresPermissions &&
    (!isConfigured || (permissionsFetched && missingPermissions.length > 0));

  const card = (
    <Link
      to={item.to}
      className={cn(
        "border-border hover:border-ring/50 hover:bg-accent/50 flex items-start gap-4 rounded-2xl border p-4 transition-colors",
        isMuted && "opacity-50",
      )}
    >
      <div className="bg-primary flex size-12 shrink-0 items-center justify-center rounded-xl">
        <Icon className="text-primary-foreground size-6" />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">{item.title}</span>
        <p className="text-muted-foreground text-sm">{item.description}</p>
      </div>
    </Link>
  );

  // Show tooltip for unconfigured state (only for items that require permissions)
  if (!isConfigured && requiresPermissions) {
    return (
      <Tooltip>
        <TooltipTrigger className="text-left">{card}</TooltipTrigger>
        <TooltipContent>Configure connection first</TooltipContent>
      </Tooltip>
    );
  }

  // Show tooltip for missing permissions (only if configured)
  if (missingPermissions.length > 0) {
    const tooltipText = missingPermissions
      .map((p) => PERMISSION_LABELS[p])
      .join(", ");

    return (
      <Tooltip>
        <TooltipTrigger className="text-left">{card}</TooltipTrigger>
        <TooltipContent>Missing: {tooltipText}</TooltipContent>
      </Tooltip>
    );
  }

  return card;
}

function AboutSection() {
  return (
    <footer className="flex flex-col gap-4">
      <Separator />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <Heading level={2} className="text-base font-medium">
            About hyAway
          </Heading>
          <p className="text-muted-foreground text-sm">
            An open-source web client for{" "}
            <a
              href="https://hydrusnetwork.github.io/hydrus/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              hydrus network
            </a>
            .
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={
              <a
                href="https://github.com/hyaway/hyaway"
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            <IconBrandGithub className="size-4" />
            GitHub
          </Button>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={
              <a
                href="https://x.com/hyAway_dev"
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            <IconBrandX className="size-4" />
          </Button>
        </div>
      </div>
    </footer>
  );
}
