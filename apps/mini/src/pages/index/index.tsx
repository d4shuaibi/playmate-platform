import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import "./index.scss";
import { getRole } from "../../utils/role";

const IndexPage = () => {
  const handleAutoEnter = () => {
    const role = getRole();
    if (role === "worker") {
      void Taro.redirectTo({ url: "/pages/home-worker/index" });
      return;
    }

    void Taro.redirectTo({ url: "/pages/home-user/index" });
  };

  const handleGoUserHome = () => {
    void Taro.navigateTo({ url: "/pages/home-user/index" });
  };

  const handleGoWorkerHome = () => {
    void Taro.navigateTo({ url: "/pages/home-worker/index" });
  };

  return (
    <View className="page">
      <View className="card">
        <Text className="title">原型预览入口</Text>
        <Text className="desc">请选择要预览的首页（用户端 / 打手端）。</Text>

        <View className="actions">
          <View className="btn btnSecondary" onClick={handleAutoEnter} aria-label="按当前身份进入">
            <Text className="btnText">按当前身份进入</Text>
          </View>
          <View className="btn btnPrimary" onClick={handleGoUserHome} aria-label="进入用户端首页">
            <Text className="btnText">用户端首页</Text>
          </View>
          <View
            className="btn btnSecondary"
            onClick={handleGoWorkerHome}
            aria-label="进入打手端首页"
          >
            <Text className="btnText">打手端首页</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default IndexPage;
