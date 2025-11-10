//  @ts-check

/** @type {import('prettier').Config} */
const config = {
  plugins: ["prettier-plugin-tailwindcss"],
  tailwindFunctions: [
    "tv",
    "composeTailwindRenderProps",
    "twMerge",
    "cn",
    "clsx",
  ],
};

export default config;
