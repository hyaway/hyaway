import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  async viteFinal(inlineConfig) {
    const { default: tailwindcss } = await import("@tailwindcss/vite");
    inlineConfig.plugins = inlineConfig.plugins || [];
    inlineConfig.plugins.push(tailwindcss());
    return inlineConfig;
  },
};
export default config;
