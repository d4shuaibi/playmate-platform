import { View, Text } from "@tarojs/components";
import "./index.scss";
import { BottomBar } from "../../components/bottom-bar/BottomBar";
import "../../components/bottom-bar/bottom-bar.scss";
import { getRole } from "../../utils/role";

const OrdersPage = () => {
  const role = getRole();
  const title = role === "worker" ? "接单列表" : "我的订单";
  const desc =
    role === "worker"
      ? "打手端订单页占位（展示我接的单：待接单/进行中/已完成）。"
      : "用户端订单页占位（展示我下的单：待支付/进行中/已完成）。";

  return (
    <View className="pageShell">
      <View className="pageCard">
        <Text className="pageTitle">{title}</Text>
        <Text className="pageDesc">{desc}</Text>
      </View>
      <BottomBar role={role} activeKey="orders" />
    </View>
  );
};

export default OrdersPage;
