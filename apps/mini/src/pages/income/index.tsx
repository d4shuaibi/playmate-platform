import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import "./index.scss";
import { BottomBar } from "../../components/bottom-bar/BottomBar";
import "../../components/bottom-bar/bottom-bar.scss";
import { getRole } from "../../utils/role";

const IncomePage = () => {
  const role = getRole();
  if (role !== "worker") {
    void Taro.showToast({ title: "仅打手可查看收益", icon: "none" });
    void Taro.redirectTo({ url: "/pages/home-user/index" });
    return <View className="pageShell" />;
  }

  return (
    <View className="pageShell">
      <View className="pageCard">
        <Text className="pageTitle">收益</Text>
        <Text className="pageDesc">打手端收益页占位（余额/账单/提现）。</Text>
      </View>
      <BottomBar role={role} activeKey="income" />
    </View>
  );
};

export default IncomePage;
