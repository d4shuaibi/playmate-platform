import type { UserConfigExport } from "@tarojs/cli";

const config = {
  env: {
    TARO_APP_API_BASE_URL: "https://landongdj.cn",
    TARO_APP_CLOUD_ENV_ID: "",
    TARO_APP_CLOUD_SERVICE_NAME: "api"
  },
  defineConstants: {}
} as unknown as UserConfigExport;

export default config;
