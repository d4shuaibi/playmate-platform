import type { UserConfigExport } from "@tarojs/cli";

export default {
  defineConstants: {
    __APP_ENV__: JSON.stringify("production")
  }
} satisfies UserConfigExport;
