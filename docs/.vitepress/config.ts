import { defineConfig } from "vitepress";

export default defineConfig({
  title: "hyAway",
  description: "Documentation for hyAway",
  cleanUrls: true,
  head: [
    ["link", { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
  ],
  themeConfig: {
    nav: [{ text: "Setup", link: "/setup" }],
    sidebar: [
      {
        text: "Getting started",
        items: [{ text: "Setup", link: "/setup" }],
      },
    ],
    socialLinks: [{ icon: "github", link: "https://github.com/hyaway/hyaway" }],
  },
});
