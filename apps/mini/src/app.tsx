import { PropsWithChildren } from "react";
import Taro, { useLaunch } from "@tarojs/taro";
import { setRole } from "./utils/role";

const App = ({ children }: PropsWithChildren) => {
  useLaunch((options) => {
    // 每次进入小程序默认回到用户端。
    setRole("user");

    // 保存广告/渠道 clickId 供登录上报
    const query = options.query ?? {};
    const clickId =
      (query.clickId as string | undefined) ||
      (query.gdt_vid as string | undefined) ||
      (query.qz_gdt as string | undefined);
    if (clickId) {
      void Taro.setStorage({ key: "playmate.clickId", data: String(clickId) });
    }
  });

  return children;
};

export default App;
