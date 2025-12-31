//  @ts-check

/** @type {import('prettier').Config} */
const config = {
  endOfLine: "lf",
  plugins: ["prettier-plugin-tailwindcss"],
  tailwindFunctions: [
    "tv",
    "composeTailwindRenderProps",
    "twMerge",
    "cn",
    "cx",
    "clsx",
  ],
};

export default config;
