import { defineConfig } from "vitepress";

export default defineConfig({
  title: "hyAway",
  description: "Documentation for hyAway",
  cleanUrls: true,
  sitemap: {
    hostname: "https://docs.hyaway.com",
  },
  ignoreDeadLinks: [/^http:\/\/localhost/, /^http:\/\/127\.0\.0\.1/],
  head: [
    ["link", { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
  ],
  themeConfig: {
    nav: [
      { text: "Guide", link: "/getting-started" },
      { text: "Self-host", link: "/self-hosting/" },
      {
        text: "Hydrus docs",
        items: [
          {
            text: "Hydrus network",
            link: "https://hydrusnetwork.github.io/hydrus/",
          },
          {
            text: "Client API",
            link: "https://hydrusnetwork.github.io/hydrus/client_api.html",
          },
        ],
      },
    ],
    sidebar: [
      {
        text: "Getting started",
        items: [
          { text: "Enable Hydrus API", link: "/getting-started" },
          { text: "Access methods", link: "/access-methods" },
          { text: "Connect to Hydrus", link: "/connect" },
        ],
      },
      {
        text: "Self-hosting",
        items: [
          { text: "Overview", link: "/self-hosting/" },
          { text: "Docker", link: "/self-hosting/docker" },
          { text: "Local development", link: "/self-hosting/local-dev" },
        ],
      },
      {
        text: "Hydrus documentation",
        items: [
          {
            text: "Hydrus Network ↗",
            link: "https://hydrusnetwork.github.io/hydrus/",
          },
          {
            text: "Client API ↗",
            link: "https://hydrusnetwork.github.io/hydrus/client_api.html",
          },
        ],
      },
    ],
    socialLinks: [{ icon: "github", link: "https://github.com/hyaway/hyaway" }],
  },
});
