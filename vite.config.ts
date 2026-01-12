import { URL, fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

import { tanstackRouter } from "@tanstack/router-plugin/vite";

const ReactCompilerConfig = {
  target: "19", // React 19
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
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
});
