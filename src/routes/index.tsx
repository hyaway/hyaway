import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Heading } from "@/components/ui-primitives/heading";
import { Button } from "@/components/ui-primitives/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui-primitives/card";
import { useIsApiConfigured } from "@/integrations/hydrus-api/hydrus-config-store";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const isConfigured = useIsApiConfigured();
  const router = useRouter();

  const features: Array<{
    title: string;
    description: string;
  }> = [
    {
      title: "Browse Anywhere",
      description:
        "Securely explore your Hydrus gallery from any device with a modern responsive UI.",
    },
    {
      title: "Fast Tag Searching",
      description:
        "Query tags and relationships quickly using cached & batched Hydrus API calls.",
    },
    {
      title: "Live Client Pages",
      description:
        "Peek into active client pages remotely and jump straight to what matters.",
    },
    {
      title: "Inbox / Archive Views",
      description:
        "Jump to Recently Inboxed, Archived, or Deleted media in one click.",
    },
    {
      title: "Adaptive Theming",
      description:
        "Switch between light & dark themes instantly; respects system preferences.",
    },
    {
      title: "Local Keys Only",
      description:
        "Your access & session keys stay client-side (persisted with secure storage logic).",
    },
  ];

  const primaryCta = isConfigured
    ? {
        label: "Go to Inbox",
        to: "/recently-inboxed" as const,
        intent: "primary" as const,
      }
    : {
        label: "Configure Access",
        to: "/settings" as const,
        intent: "primary" as const,
      };

  const secondaryCta = isConfigured
    ? { label: "Settings", to: "/settings" as const }
    : { label: "See Features", to: "#features" as const };

  return (
    <>
      <Hero
        primaryCta={primaryCta}
        secondaryCta={secondaryCta}
        onNavigate={(to) => router.navigate({ to })}
      />
      <Features id="features" features={features} />
      <QuickStart
        hasClient={isConfigured}
        onNavigate={(to) => router.navigate({ to })}
      />
      <Footer />
    </>
  );
}

interface NavigateProps {
  onNavigate: (to: string) => void;
}

function Hero({
  primaryCta,
  secondaryCta,
  onNavigate,
}: {
  primaryCta: { label: string; to: string; intent: "primary" };
  secondaryCta: { label: string; to: string };
} & NavigateProps) {
  return (
    <div className="relative flex flex-col gap-10 p-6 py-20 sm:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="from-primary/25 via-primary/5 absolute inset-0 bg-linear-to-br to-transparent opacity-60 dark:opacity-40" />
        <div className="absolute top-1/2 left-1/2 size-240 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,var(--color-primary)/25%,transparent_70%)] opacity-30 blur-3xl" />
      </div>
      <div className="bg-background/85 ring-border/40 max-w-3xl space-y-6 rounded-lg p-6 shadow-lg ring-1 backdrop-blur-sm">
        <Heading level={1} className="text-4xl/10 font-bold sm:text-5xl/12">
          Remote gateway to your Hydrus Network gallery
        </Heading>
        <p className="text-lg/8 sm:text-xl/9">
          HyAway lets you securely manage, search, and explore your Hydrus
          collection without being at your workstation. Optimized for speed,
          clarity, and keyboard navigation.
        </p>
        <div className="flex flex-wrap gap-4 pt-2">
          <Button size="lg" onClick={() => onNavigate(primaryCta.to)}>
            {primaryCta.label}
          </Button>
          <Button size="lg" onClick={() => onNavigate(secondaryCta.to)}>
            {secondaryCta.label}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Features({
  features,
  id,
}: {
  features: Array<{ title: string; description: string }>;
  id?: string;
}) {
  return (
    <div id={id} className="flex flex-col gap-10 border-t pt-16 sm:pt-24">
      <Heading level={2} className="text-3xl/10 font-semibold">
        Why <span className="text-orange-400">hy</span>
        <span className="text-yellow-400">AWAY</span>?
      </Heading>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <Card key={f.title} className="h-full">
            <CardHeader title={f.title} />
            <CardContent>
              <CardDescription>{f.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function QuickStart({
  hasClient,
  onNavigate,
}: { hasClient: boolean } & NavigateProps) {
  return (
    <div className="flex flex-col gap-8 pt-24">
      <Heading level={2} className="text-3xl/9 font-semibold">
        {hasClient ? "Next up" : "Get started in 3 steps"}
      </Heading>
      {hasClient ? (
        <div className="flex flex-col gap-4">
          <p>
            You already have an active API client. Dive straight into your
            inbox, or fine-tune tag search & layout preferences.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button onClick={() => onNavigate("/recently-inboxed")}>
              Open Inbox
            </Button>
            <Button onClick={() => onNavigate("/settings/ux")}>
              UX Settings
            </Button>
          </div>
        </div>
      ) : (
        <ol className="grid gap-6 sm:grid-cols-3">
          <li className="flex flex-col gap-2">
            <Heading level={3}>1. Generate Access Key</Heading>
            <p>
              In Hydrus: Services → Manage Services → Client API → Generate a
              new access key.
            </p>
          </li>
          <li className="flex flex-col gap-2">
            <Heading level={3}>2. Enter Credentials</Heading>
            <p>
              Paste the access key & endpoint in Settings. HyAway stores them
              locally only.
            </p>
          </li>
          <li className="flex flex-col gap-2">
            <Heading level={3}>3. Explore</Heading>
            <p>
              Start browsing pages, search tags, and manage inbox/archived items
              remotely.
            </p>
          </li>
        </ol>
      )}
    </div>
  );
}

function Footer() {
  return (
    <div className="mt-32 border-t pt-10 text-center">
      <p className="text-sm/6">
        Built with TanStack Router & Hydrus API. Privacy-first: keys never leave
        your browser.
      </p>
      <p className="mt-2 text-xs/5 opacity-60">
        © {new Date().getFullYear()} HyAway
      </p>
    </div>
  );
}
