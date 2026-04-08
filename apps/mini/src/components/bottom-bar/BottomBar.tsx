import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import type { AppRole } from "../../utils/role";

type BottomBarKey = "home" | "category" | "orders" | "income" | "me";

type BottomBarProps = {
  role: AppRole;
  activeKey: BottomBarKey;
};

type BottomItem = {
  key: BottomBarKey;
  label: string;
  icon: string;
  url: string;
};

const USER_ITEMS: BottomItem[] = [
  { key: "home", label: "首页", icon: "▦", url: "/pages/home-user/index" },
  { key: "category", label: "分类", icon: "△", url: "/pages/category/index" },
  { key: "orders", label: "订单", icon: "▤", url: "/pages/orders/index" },
  { key: "me", label: "我的", icon: "👤", url: "/pages/me/index" }
];

const WORKER_ITEMS: BottomItem[] = [
  { key: "home", label: "工作台", icon: "▦", url: "/pages/home-worker/index" },
  { key: "orders", label: "订单", icon: "▤", url: "/pages/orders/index" },
  { key: "income", label: "收益", icon: "▣", url: "/pages/income/index" },
  { key: "me", label: "我的", icon: "👤", url: "/pages/me/index" }
];

const navigateByKey = (url: string) => {
  void Taro.redirectTo({ url });
};

export const BottomBar = ({ role, activeKey }: BottomBarProps) => {
  const items = role === "worker" ? WORKER_ITEMS : USER_ITEMS;

  return (
    <View className="bottomBar">
      {items.map((item) => {
        const isActive = item.key === activeKey;

        return (
          <View
            key={item.key}
            className={`bottomBar__item ${isActive ? "bottomBar__item--active" : ""}`}
            onClick={() => navigateByKey(item.url)}
          >
            <Text className="bottomBar__icon">{item.icon}</Text>
            <Text className={`bottomBar__text ${isActive ? "bottomBar__text--active" : ""}`}>
              {item.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
};
