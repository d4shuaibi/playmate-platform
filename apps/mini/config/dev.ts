import type { UserConfigExport } from "@tarojs/cli";

export default {
  logger: {
    quiet: false
  },
  defineConstants: {
    __APP_ENV__: JSON.stringify("development")
  }
} satisfies UserConfigExport;
