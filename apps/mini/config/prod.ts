import type { UserConfigExport } from "@tarojs/cli";

const config = {
  env: {
    TARO_APP_API_BASE_URL: "https://admin.example.com/api"
  },
  defineConstants: {}
} as unknown as UserConfigExport;

export default config;
