import type { UserConfigExport } from "@tarojs/cli";

// NOTE: `@tarojs/cli` 的类型在部分版本下会把 compiler 泛型收窄到 webpack5，
// 但运行时 Taro 4 支持 `compiler: "vite"`。这里保持与 `config/dev.ts` 一致的写法避免误报。
const config = {
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
    __API_BASE_URL__: JSON.stringify(process.env.TARO_APP_API_BASE_URL || "http://localhost:3000")
  },
  mini: {},
  h5: {}
} as unknown as UserConfigExport;

export default config;
