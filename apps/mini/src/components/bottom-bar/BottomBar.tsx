import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import type { CSSProperties } from "react";
import type { AppRole } from "../../utils/role";
import "./bottom-bar.scss";
import "../../assets/font/iconfont.css";

type BottomBarKey = "home" | "category" | "orders" | "income" | "me";

type BottomBarProps = {
  role: AppRole;
  activeKey: BottomBarKey;
};

type BottomItem = {
  key: BottomBarKey;
  label: string;
  iconClassName: string;
  url: string;
};

const USER_ITEMS: BottomItem[] = [
  { key: "home", label: "首页", iconClassName: "icon-xiazai44", url: "/pages/home-user/index" },
  { key: "category", label: "分类", iconClassName: "icon-fenlei", url: "/pages/category/index" },
  { key: "orders", label: "订单", iconClassName: "icon-dingdan", url: "/pages/orders/index" },
  { key: "me", label: "我的", iconClassName: "icon-wode", url: "/pages/me/index" }
];

const WORKER_ITEMS: BottomItem[] = [
  {
    key: "home",
    label: "工作台",
    iconClassName: "icon-gongzuotai",
    url: "/pages/home-worker/index"
  },
  { key: "orders", label: "订单", iconClassName: "icon-dingdan", url: "/pages/orders/index" },
  { key: "income", label: "收益", iconClassName: "icon-shouyi", url: "/pages/income/index" },
  { key: "me", label: "我的", iconClassName: "icon-wode", url: "/pages/me/index" }
];

const bottomBarStyle: CSSProperties = {
  position: "fixed",
  left: 0,
  right: 0,
  bottom: 0,
  height: "78px",
  padding: "10px 18px 22px",
  background: "rgba(9, 10, 14, 0.92)",
  display: "flex",
  justifyContent: "space-between",
  borderTop: "1px solid rgba(255, 255, 255, 0.06)",
  boxSizing: "border-box",
  zIndex: 30
};

const bottomItemStyle: CSSProperties = {
  width: "64px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "6px",
  transition: "transform 0.2s ease"
};

const bottomItemActiveStyle: CSSProperties = {
  transform: "translateY(-2px)"
};

const bottomIconStyle: CSSProperties = {
  fontSize: "18px",
  lineHeight: "18px",
  opacity: 0.82,
  color: "rgba(229, 231, 235, 0.72)",
  transition: "all 0.2s ease",
  display: "block"
};

const bottomIconActiveStyle: CSSProperties = {
  fontSize: "22px",
  lineHeight: "22px",
  color: "#a78bfa",
  opacity: 1,
  display: "block"
};

const bottomTextStyle: CSSProperties = {
  fontSize: "11px",
  color: "rgba(229, 231, 235, 0.45)",
  transition: "all 0.2s ease"
};

const bottomTextActiveStyle: CSSProperties = {
  color: "#a78bfa",
  fontWeight: 800,
  transform: "scale(1.08)"
};

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
    <View className="bottomBar" style={bottomBarStyle}>
      {items.map((item) => {
        const isActive = item.key === activeKey;

        return (
          <View
            key={item.key}
            className={`bottomBar__item ${isActive ? "bottomBar__item--active" : ""}`}
            onClick={() => void navigateByKey(item.url, item.label)}
            aria-label={`切换到${item.label}`}
            style={isActive ? { ...bottomItemStyle, ...bottomItemActiveStyle } : bottomItemStyle}
          >
            <Text
              className={`iconfont ${item.iconClassName} bottomBar__icon ${isActive ? "bottomBar__icon--active" : ""}`}
              style={isActive ? { ...bottomIconStyle, ...bottomIconActiveStyle } : bottomIconStyle}
            />
            <Text
              className={`bottomBar__text ${isActive ? "bottomBar__text--active" : ""}`}
              style={isActive ? { ...bottomTextStyle, ...bottomTextActiveStyle } : bottomTextStyle}
            >
              {item.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
};
