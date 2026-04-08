import type { UserConfigExport } from "@tarojs/cli";

export default {
  projectName: "playmate-mini",
  date: "2026-04-08",
  designWidth: 375,
  deviceRatio: {
    375: 2
  },
  sourceRoot: "src",
  outputRoot: "dist",
  plugins: ["@tarojs/plugin-framework-react", "@tarojs/plugin-platform-weapp"],
  compiler: "vite",
  framework: "react",
  mini: {},
  h5: {}
} satisfies UserConfigExport;
