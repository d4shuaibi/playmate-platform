import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import "./index.scss";
import { BottomBar } from "../../components/bottom-bar/BottomBar";
import "../../components/bottom-bar/bottom-bar.scss";
import { getRole, getWorkerPermission, setRole, type AppRole } from "../../utils/role";

const roleLabelMap: Record<AppRole, string> = {
  user: "普通用户",
  worker: "打手/陪玩"
};

const MePage = () => {
  const role = getRole();

  const handleSwitchToUser = () => {
    setRole("user");
    void Taro.redirectTo({ url: "/pages/home-user/index" });
  };

  const handleSwitchToWorker = () => {
    if (!getWorkerPermission()) {
      void Taro.showToast({ title: "你暂无打手端权限", icon: "none" });
      return;
    }
    setRole("worker");
    void Taro.redirectTo({ url: "/pages/home-worker/index" });
  };

  return (
    <View className="mePage">
      <View className="mePage__card">
        <Text className="mePage__title">我的</Text>
        <Text className="mePage__desc">当前身份：{roleLabelMap[role]}</Text>

        <View className="mePage__switchRow">
          <View
            className={`mePage__switchBtn ${role === "user" ? "mePage__switchBtn--activeUser" : ""}`}
            onClick={handleSwitchToUser}
          >
            <Text className="mePage__switchText">用户端</Text>
          </View>
          <View
            className={`mePage__switchBtn ${role === "worker" ? "mePage__switchBtn--activeWorker" : ""}`}
            onClick={handleSwitchToWorker}
          >
            <Text className="mePage__switchText">打手端</Text>
          </View>
        </View>

        {role === "user" ? (
          <View className="mePage__section">
            <Text className="mePage__sectionTitle">身份认证与角色申请</Text>
            <Text className="mePage__sectionDesc">
              申请成为陪玩：提交段位截图、实名认证、擅长游戏等资料，等待管理员审核。
            </Text>
            <View
              className="mePage__cta"
              onClick={() =>
                void Taro.showToast({ title: "原型阶段：此处跳转申请页", icon: "none" })
              }
            >
              <Text className="mePage__ctaText">申请成为陪玩</Text>
            </View>
          </View>
        ) : (
          <View className="mePage__section">
            <Text className="mePage__sectionTitle">打手信息</Text>
            <Text className="mePage__sectionDesc">审核状态：已通过（原型占位）</Text>
            <View className="mePage__pillRow">
              <View className="mePage__pill">
                <Text className="mePage__pillText">擅长：王者荣耀</Text>
              </View>
              <View className="mePage__pill">
                <Text className="mePage__pillText">段位：王者</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      <BottomBar role={role} activeKey="me" />
    </View>
  );
};

export default MePage;
