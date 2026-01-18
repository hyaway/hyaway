// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";
import reactCompiler from "eslint-plugin-react-compiler";
import localPlugin from "./eslint-plugin-local/index.js";

import pluginQuery from "@tanstack/eslint-plugin-query";
import { tanstackConfig } from "@tanstack/eslint-config";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig(
  ...pluginQuery.configs["flat/recommended"],
  ...tanstackConfig,
  ...storybook.configs["flat/recommended"],
  {
    plugins: {
      "react-compiler": reactCompiler,
      local: localPlugin,
    },
    rules: {
      "react-compiler/react-compiler": "warn",
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    plugins: {
      local: localPlugin,
    },
    rules: {
      "local/license-header": "error",
    },
  },
  globalIgnores([
    // Config files
    "eslint.config.js",
    "prettier.config.js",
    // From .gitignore
    "node_modules/**",
    "dist/**",
    "dist-ssr/**",
    "docs/.vitepress/cache/**",
    "docs/.vitepress/dist/**",
    ".nitro/**",
    ".tanstack/**",
    ".wrangler/**",
    // From .prettierignore
    "pnpm-lock.yaml",
    "routeTree.gen.ts",
    "public/**",
    "LICENSE",
  ]),
);
