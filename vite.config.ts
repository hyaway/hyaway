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

/**
 * Replaces `name` and `short_name` in manifest.json with the given app name.
 * In dev, intercepts requests to /manifest.json and serves the modified JSON.
 * In production, rewrites the file after Vite copies it to dist.
 */
function transformManifest(appName: string): Plugin {
  const MANIFEST_SRC = join("public", "manifest.json");

  function patchManifest(raw: string): string {
    const manifest = JSON.parse(raw);
    manifest.name = appName;
    manifest.short_name = appName;
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
        next();
      });
    },
    writeBundle(options) {
      const outDir = options.dir ?? "dist";
      const manifestPath = join(outDir, "manifest.json");
      const patched = patchManifest(readFileSync(manifestPath, "utf-8"));
      writeFileSync(manifestPath, patched, "utf-8");
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

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
      env.VITE_APP_NAME ? transformManifest(env.VITE_APP_NAME) : null,
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
