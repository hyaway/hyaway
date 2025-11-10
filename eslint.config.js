// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import pluginQuery from "@tanstack/eslint-plugin-query";
import { tanstackConfig } from "@tanstack/eslint-config";
import { defineConfig, globalIgnores } from "eslint/config";

export default [
  ...pluginQuery.configs["flat/recommended"],
  ...tanstackConfig,
  ...storybook.configs["flat/recommended"],
  globalIgnores(["eslint.config.js", "prettier.config.js"]),
];
