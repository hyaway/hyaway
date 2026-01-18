// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { copyFileSync, readFileSync } from "node:fs";
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
    ],
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
