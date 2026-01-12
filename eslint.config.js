// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";
import reactCompiler from "eslint-plugin-react-compiler";

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
    },
    rules: {
      "react-compiler/react-compiler": "warn",
    },
  },
  globalIgnores(["eslint.config.js", "prettier.config.js", "public/**/*.js"]),
);
