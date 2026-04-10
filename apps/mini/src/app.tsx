import { PropsWithChildren } from "react";
import { useLaunch } from "@tarojs/taro";
import "./components/bottom-bar/bottom-bar.scss";
import "./assets/font/iconfont.css";
import { setRole } from "./utils/role";

const App = ({ children }: PropsWithChildren) => {
  useLaunch(() => {
    // 每次进入小程序默认回到用户端。
    setRole("user");
  });

  return children;
};

export default App;
