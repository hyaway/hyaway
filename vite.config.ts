// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { URL, fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import viteReact from "@vitejs/plugin-react";
import { devtools } from "@tanstack/devtools-vite";
import tailwindcss from "@tailwindcss/vite";

import { tanstackRouter } from "@tanstack/router-plugin/vite";
import type { Plugin } from "vite";

const ReactCompilerConfig = {
  target: "19", // React 19
};

/** Copies LICENSE and NOTICE to dist after build, serves them in dev */
function copyLicenseFiles(): Plugin {
  return {
    name: "copy-license-files",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === "/LICENSE.txt") {
          res.setHeader("Content-Type", "text/plain");
          res.end(readFileSync("LICENSE", "utf-8"));
          return;
        }
        if (req.url === "/NOTICE.txt") {
          res.setHeader("Content-Type", "text/plain");
          res.end(readFileSync("NOTICE", "utf-8"));
          return;
        }
        next();
      });
    },
    writeBundle(options) {
      const outDir = options.dir ?? "dist";
      copyFileSync("LICENSE", `${outDir}/LICENSE.txt`);
      copyFileSync("NOTICE", `${outDir}/NOTICE.txt`);
    },
  };
}

interface ManifestOptions {
  appName?: string;
  iconVariant?: string;
}

/**
 * Transforms manifest.json at dev-serve and build time:
 * - Replaces `name`/`short_name` when appName is provided
 * - Rewrites icon paths to use variant-suffixed files (e.g. `-dev`) when iconVariant is set
 *
 * In dev, also intercepts favicon.svg and apple-touch-icon.png to serve variants.
 */
function transformManifest({ appName, iconVariant }: ManifestOptions): Plugin {
  const MANIFEST_SRC = join("public", "manifest.json");

  /** Map of files that need to be swapped to their variant counterparts */
  const VARIANT_FILE_MAP: Record<string, string> = iconVariant
    ? {
        "/favicon.svg": `/favicon-${iconVariant}.svg`,
        "/apple-touch-icon.png": `/apple-touch-icon-${iconVariant}.png`,
      }
    : {};

  function addVariantSuffix(filename: string): string {
    if (!iconVariant) return filename;
    // "logo192.png" → "logo192-dev.png", "favicon.svg" → "favicon-dev.svg"
    const dotIndex = filename.lastIndexOf(".");
    if (dotIndex === -1) return filename;
    return `${filename.slice(0, dotIndex)}-${iconVariant}${filename.slice(dotIndex)}`;
  }

  function patchManifest(raw: string): string {
    const manifest = JSON.parse(raw);
    if (appName) {
      manifest.name = appName;
      manifest.short_name = appName;
    }
    if (iconVariant) {
      // Rewrite app icon paths
      for (const icon of manifest.icons ?? []) {
        icon.src = addVariantSuffix(icon.src);
      }
      // Rewrite shortcut icon paths
      for (const shortcut of manifest.shortcuts ?? []) {
        for (const icon of shortcut.icons ?? []) {
          // Strip leading slash for suffix, then re-add
          const src = icon.src.startsWith("/") ? icon.src.slice(1) : icon.src;
          icon.src = `/${addVariantSuffix(src)}`;
        }
      }
    }
    return JSON.stringify(manifest, null, 2);
  }

  return {
    name: "transform-manifest",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === "/manifest.json") {
          const patched = patchManifest(readFileSync(MANIFEST_SRC, "utf-8"));
          res.setHeader("Content-Type", "application/manifest+json");
          res.end(patched);
          return;
        }
        // Serve variant icons in place of originals (favicon, apple-touch-icon)
        const variantPath = VARIANT_FILE_MAP[req.url ?? ""];
        if (variantPath) {
          const filePath = join("public", variantPath.slice(1));
          const ext = variantPath.endsWith(".svg")
            ? "image/svg+xml"
            : "image/png";
          res.setHeader("Content-Type", ext);
          res.end(readFileSync(filePath));
          return;
        }
        next();
      });
    },
    writeBundle(options) {
      const outDir = options.dir ?? "dist";
      // Patch manifest
      const manifestPath = join(outDir, "manifest.json");
      const patched = patchManifest(readFileSync(manifestPath, "utf-8"));
      writeFileSync(manifestPath, patched, "utf-8");
      // Overwrite favicon and apple-touch-icon with variants
      for (const [original, variant] of Object.entries(VARIANT_FILE_MAP)) {
        const src = join(outDir, variant.slice(1));
        const dest = join(outDir, original.slice(1));
        copyFileSync(src, dest);
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  // Resolve effective app name: auto-suffix "(dev)" in development when using the default
  const isDev = mode === "development";
  const resolvedAppName =
    env.VITE_APP_NAME && env.VITE_APP_NAME !== "hyAway"
      ? env.VITE_APP_NAME
      : isDev
        ? "hyAway (dev)"
        : "hyAway";
  // Make it available for Vite's %VITE_APP_NAME% HTML substitution
  process.env.VITE_APP_NAME = resolvedAppName;

  const resolvedIconVariant =
    env.VITE_APP_ICON_VARIANT || (isDev ? "dev" : undefined);

  const allowedHosts: Array<string> = [];
  if (env.VITE_ALLOWED_HOST) {
    allowedHosts.push(env.VITE_ALLOWED_HOST);
  }

  return {
    plugins: [
      devtools({
        removeDevtoolsOnBuild: true,
      }),
      tanstackRouter({
        target: "react",
        autoCodeSplitting: true,
        quoteStyle: "double",
        semicolons: true,
      }),
      viteReact({
        babel: {
          plugins: [["babel-plugin-react-compiler", ReactCompilerConfig]],
        },
      }),
      tailwindcss(),
      copyLicenseFiles(),
      resolvedIconVariant || resolvedAppName !== "hyAway"
        ? transformManifest({
            appName: resolvedAppName,
            iconVariant: resolvedIconVariant,
          })
        : null,
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    build: {
      assetsInlineLimit: (filePath) => {
        // Never inline fonts as base64 to avoid CSP issues
        if (filePath.endsWith(".woff2") || filePath.endsWith(".woff")) {
          return false;
        }
        // Use default behavior for other assets
        return undefined;
      },
    },
    server: {
      allowedHosts,
    },
  };
});
