// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { URL, fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import viteReact from "@vitejs/plugin-react";
import { devtools } from "@tanstack/devtools-vite";
import tailwindcss from "@tailwindcss/vite";

import { tanstackRouter } from "@tanstack/router-plugin/vite";

const ReactCompilerConfig = {
  target: "19", // React 19
};

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
