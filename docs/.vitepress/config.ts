// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

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
    // OG tags
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { property: "og:title", content: "hyAway Documentation" }],
    [
      "meta",
      {
        property: "og:description",
        content:
          "Documentation for hyAway - a companion web interface for hydrus network",
      },
    ],
    [
      "meta",
      {
        property: "og:image",
        content: "https://docs.hyaway.com/images/og-image.png",
      },
    ],
    ["meta", { property: "og:image:width", content: "1200" }],
    ["meta", { property: "og:image:height", content: "630" }],
    ["meta", { property: "og:url", content: "https://docs.hyaway.com" }],
    ["meta", { property: "og:site_name", content: "hyAway" }],
    // Twitter card
    ["meta", { name: "twitter:card", content: "summary_large_image" }],
    ["meta", { name: "twitter:title", content: "hyAway Documentation" }],
    [
      "meta",
      {
        name: "twitter:description",
        content:
          "Documentation for hyAway - a companion web interface for hydrus network",
      },
    ],
    [
      "meta",
      {
        name: "twitter:image",
        content: "https://docs.hyaway.com/images/og-image.png",
      },
    ],
  ],
  themeConfig: {
    logo: {
      light: "/logo-light.svg",
      dark: "/logo-dark.svg",
    },
    nav: [
      { text: "Go to app", link: "https://hyaway.com" },
      { text: "Guide", link: "/getting-started" },
      { text: "Screenshots", link: "/screenshots" },
      { text: "Changelog", link: "/changelog" },
    ],
    sidebar: [
      {
        text: "Introduction",
        items: [
          { text: "What is hyAway?", link: "/guide/what-is-hyaway" },
          { text: "Screenshots", link: "/screenshots" },
        ],
      },
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
          { text: "Build from source", link: "/self-hosting/build-from-source" },
          { text: "Local development", link: "/self-hosting/local-dev" },
        ],
      },
      {
        text: "Hydrus documentation",
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
      {
        text: "Resources",
        items: [{ text: "Changelog", link: "/changelog" }],
      },
    ],
    socialLinks: [{ icon: "github", link: "https://github.com/hyaway/hyaway" }],
    footer: {
      message:
        '<a href="https://hyaway.com/LICENSE.txt">License</a> · <a href="https://hyaway.com/NOTICE.txt">Notice</a> · <a href="/changelog">Changelog</a>',
      copyright: "Copyright 2026 hyAway contributors",
    },
  },
});
