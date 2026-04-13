import { View, Text, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import type { AppRole } from "../../utils/role";

import homeIcon from "../../assets/font/首页.svg";
import homeIconActive from "../../assets/font/首页-active.svg";
import categoryIcon from "../../assets/font/分类.svg";
import categoryIconActive from "../../assets/font/分类-active.svg";
import ordersIcon from "../../assets/font/订单.svg";
import ordersIconActive from "../../assets/font/订单-active.svg";
import meIcon from "../../assets/font/我的.svg";
import meIconActive from "../../assets/font/我的-active.svg";
import incomeIcon from "../../assets/font/收益.svg";
import incomeIconActive from "../../assets/font/收益-active.svg";
import workbenchIcon from "../../assets/font/工作台.svg";
import workbenchIconActive from "../../assets/font/工作台-active.svg";

type BottomBarKey = "home" | "category" | "orders" | "income" | "me";

type BottomBarProps = {
  role: AppRole;
  activeKey: BottomBarKey;
};

type BottomItem = {
  key: BottomBarKey;
  label: string;
  iconSrc: string;
  activeIconSrc: string;
  url: string;
};

const USER_ITEMS: BottomItem[] = [
  {
    key: "home",
    label: "首页",
    iconSrc: homeIcon,
    activeIconSrc: homeIconActive,
    url: "/pages/home-user/index"
  },
  {
    key: "category",
    label: "分类",
    iconSrc: categoryIcon,
    activeIconSrc: categoryIconActive,
    url: "/pages/category/index"
  },
  {
    key: "orders",
    label: "订单",
    iconSrc: ordersIcon,
    activeIconSrc: ordersIconActive,
    url: "/pages/orders/index"
  },
  { key: "me", label: "我的", iconSrc: meIcon, activeIconSrc: meIconActive, url: "/pages/me/index" }
];

const WORKER_ITEMS: BottomItem[] = [
  {
    key: "home",
    label: "工作台",
    iconSrc: workbenchIcon,
    activeIconSrc: workbenchIconActive,
    url: "/pages/home-worker/index"
  },
  {
    key: "orders",
    label: "订单",
    iconSrc: ordersIcon,
    activeIconSrc: ordersIconActive,
    url: "/pages/orders/index"
  },
  {
    key: "income",
    label: "收益",
    iconSrc: incomeIcon,
    activeIconSrc: incomeIconActive,
    url: "/pages/income/index"
  },
  { key: "me", label: "我的", iconSrc: meIcon, activeIconSrc: meIconActive, url: "/pages/me/index" }
];

const navigateByKey = async (url: string, label: string) => {
  try {
    await Taro.redirectTo({ url });
  } catch {
    // TODO: 底部导航页面待补齐时，统一替换为真实页面。
    const fallbackUrl = `/pages/blank/index?title=${encodeURIComponent(label)}&target=${encodeURIComponent(url)}`;
    await Taro.redirectTo({ url: fallbackUrl });
  }
};

export const BottomBar = ({ role, activeKey }: BottomBarProps) => {
  const items = role === "worker" ? WORKER_ITEMS : USER_ITEMS;

  return (
    <View className="bottom-bar">
      {items.map((item) => {
        const isActive = item.key === activeKey;

        return (
          <View
            key={item.key}
            className={`bottom-bar__item ${isActive ? "bottom-bar__item--active" : ""}`}
            onClick={() => void navigateByKey(item.url, item.label)}
            aria-label={`切换到${item.label}`}
          >
            <Image
              className={`bottom-bar__icon-image ${isActive ? "bottom-bar__icon-image--active" : ""}`}
              src={isActive ? item.activeIconSrc : item.iconSrc}
              mode="aspectFit"
              aria-label={`${item.label}图标`}
            />
            <Text className={`bottom-bar__text ${isActive ? "bottom-bar__text--active" : ""}`}>
              {item.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
};
