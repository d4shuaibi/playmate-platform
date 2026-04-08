import type { UserConfigExport } from "@tarojs/cli";

const config = {
  logger: {
    quiet: false
  },
  env: {
    TARO_APP_API_BASE_URL: "http://localhost:3000/api"
  },
  compiler: {
    type: "vite",
    viteConfig: {
      build: {
        sourcemap: true
      }
    }
  },
  defineConstants: {}
} as unknown as UserConfigExport;

export default config;
