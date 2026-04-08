import type { UserConfigExport } from "@tarojs/cli";

const config: UserConfigExport = {
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
  defineConstants: {
    __APP_ENV__: JSON.stringify(
      process.env.NODE_ENV === "production" ? "production" : "development"
    ),
    __API_BASE_URL__: JSON.stringify(
      process.env.TARO_APP_API_BASE_URL || "http://localhost:3000/api"
    )
  },
  mini: {},
  h5: {}
};

export default config;
