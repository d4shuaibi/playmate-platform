import { View, Text, ScrollView, Image } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useCallback, useState } from "react";
import "./index.scss";
import { BottomBar } from "../../components/bottom-bar/BottomBar";
import {
  fetchMiniMe,
  fetchWorkerJoinProgress,
  logoutMiniUser,
  type MiniMePayload
} from "../../services";
import { getRole, setRole } from "../../utils/role";
import { getToken } from "../../utils/session";
import { LoginModal } from "../../components/login-modal/LoginModal";
import type { MiniOrderTabCounts } from "../../services/orders";

type MenuItem = {
  key: string;
  iconSrc: string;
  label: string;
};

import pendingPayIcon from "../../assets/font/待付款.svg";
import pendingTakeIcon from "../../assets/font/待接单.svg";
import servingIcon from "../../assets/font/服务中.svg";
import doneIcon from "../../assets/font/待结单.svg";
import refundIcon from "../../assets/font/退款售后.svg";
import benefitIcon from "../../assets/font/福利活动.svg";
import joinIcon from "../../assets/font/入驻.svg";
import settingIcon from "../../assets/font/系统设置.svg";
import aboutIcon from "../../assets/font/关于我们.svg";

/** 订单快捷入口：展示 Tab 数量键与后端 MiniOrderTabCounts 对齐 */
const ORDER_STATE_DEFS: Array<{
  key: string;
  countKey: keyof MiniOrderTabCounts;
  label: string;
  iconSrc: string;
}> = [
  { key: "pendingPay", countKey: "pendingPay", label: "待付款", iconSrc: pendingPayIcon },
  { key: "pendingTake", countKey: "pendingTake", label: "待接单", iconSrc: pendingTakeIcon },
  { key: "serving", countKey: "serving", label: "服务中", iconSrc: servingIcon },
  { key: "pendingDone", countKey: "pendingDone", label: "待结单", iconSrc: doneIcon },
  { key: "refundAfterSale", countKey: "refundAfterSale", label: "退款/售后", iconSrc: refundIcon }
];

/** 菜单仍为本地静态配置（运营配置可后置接入） */
const STATIC_MENUS: MenuItem[] = [
  { key: "benefit", iconSrc: benefitIcon, label: "福利活动" },
  { key: "join", iconSrc: joinIcon, label: "打手入驻" },
  { key: "setting", iconSrc: settingIcon, label: "系统设置" },
  { key: "about", iconSrc: aboutIcon, label: "关于我们" }
];

/**
 * 余额展示（元）
 */
const formatBalanceText = (amount: number): string =>
  `¥${amount.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const MePage = () => {
  const [role, setCurrentRole] = useState(() => getRole());
  const [loggedIn, setLoggedIn] = useState(() => Boolean(getToken()));
  const [loginOpen, setLoginOpen] = useState(false);
  const [meData, setMeData] = useState<MiniMePayload | null>(null);

  const loadMe = useCallback(async () => {
    if (!getToken()) {
      setMeData(null);
      return;
    }
    try {
      const data = await fetchMiniMe();
      setMeData(data);
    } catch {
      setMeData(null);
    }
  }, []);

  useDidShow(() => {
    const nextLoggedIn = Boolean(getToken());
    const nextRole = getRole();
    setLoggedIn((prev) => (prev === nextLoggedIn ? prev : nextLoggedIn));
    setCurrentRole((prev) => (prev === nextRole ? prev : nextRole));
    if (nextLoggedIn) void loadMe();
    else setMeData(null);
  });

  const handleLogout = () => {
    logoutMiniUser();
    setLoggedIn(false);
    setCurrentRole("user");
    setMeData(null);
    void Taro.showToast({ title: "已退出登录", icon: "none" });
  };

  const handleSwitchToUser = () => {
    setRole("user");
    setCurrentRole("user");
    void Taro.redirectTo({ url: "/pages/home-user/index" });
  };

  const handleSwitchToWorker = () => {
    if (!getToken()) {
      setLoginOpen(true);
      return;
    }
    setRole("worker");
    setCurrentRole("worker");
    void Taro.redirectTo({ url: "/pages/home-worker/index" });
  };

  const handleFeatureClick = (label: string) => {
    if (!loggedIn) {
      setLoginOpen(true);
      return;
    }
    void Taro.showToast({ title: `${label}功能开发中`, icon: "none" });
  };

  const handleOpenOrders = () => {
    if (!loggedIn) {
      setLoginOpen(true);
      return;
    }
    void Taro.navigateTo({ url: "/pages/orders/index" });
  };

  const handleOpenCustomerService = () => {
    void Taro.navigateTo({
      url: `/pages/customer-service/index?from=me&role=${encodeURIComponent(role)}`
    });
  };

  const handleOpenWorkerJoin = () => {
    if (!getToken()) {
      void Taro.showToast({ title: "请先登录", icon: "none" });
      return;
    }
    void (async () => {
      try {
        const progress = await fetchWorkerJoinProgress();
        if (!progress) {
          void Taro.navigateTo({ url: "/pages/worker-join/index" });
          return;
        }
        void Taro.navigateTo({
          url: `/pages/worker-join-progress/index?status=${encodeURIComponent(progress.status)}&ref=${encodeURIComponent(progress.refNo)}`
        });
      } catch (error) {
        void Taro.showToast({
          title: error instanceof Error ? error.message : "打开入驻失败",
          icon: "none"
        });
      }
    })();
  };

  const handleMenuClick = (menu: MenuItem) => {
    if (menu.key === "join") {
      handleOpenWorkerJoin();
      return;
    }
    handleFeatureClick(menu.label);
  };

  const avatarUrl = meData?.avatarUrl?.trim();
  const nickname = loggedIn ? (meData?.nickname ?? "微信用户") : "未登录";
  const displayId = loggedIn ? (meData?.displayId ?? "") : "";
  const balanceText = loggedIn && meData ? formatBalanceText(meData.walletBalance) : "—";
  const counts = meData?.orderCounts;

  return (
    <View className="mePage">
      <ScrollView className="mePage__scroll" scrollY enhanced showScrollbar={false}>
        <View className="mePage__profileCard">
          <View className="mePage__avatarWrap">
            <View className="mePage__avatar">
              {loggedIn && avatarUrl ? (
                <Image
                  className="mePage__avatarImg"
                  src={avatarUrl}
                  mode="aspectFill"
                  aria-label="头像"
                />
              ) : (
                <Text className="mePage__avatarText">👤</Text>
              )}
            </View>
          </View>
          <View className="mePage__profileMain">
            <Text className="mePage__nickname">{nickname}</Text>
            {loggedIn ? (
              <View className="mePage__profileMetaRow">
                <Text className="mePage__profileMeta">{displayId}</Text>
              </View>
            ) : (
              <View
                className="mePage__balanceAction"
                onClick={() => setLoginOpen(true)}
                aria-label="登录或注册"
              >
                <Text className="mePage__balanceActionText">登录/注册</Text>
              </View>
            )}
          </View>
        </View>

        <View className="mePage__switchCard">
          <View
            className={`mePage__switchBtn ${role === "user" ? "mePage__switchBtn--activeUser" : ""}`}
            onClick={handleSwitchToUser}
          >
            <Text className="mePage__switchText">我是老板</Text>
          </View>
          <View
            className={`mePage__switchBtn ${role === "worker" ? "mePage__switchBtn--activeWorker" : ""}`}
            onClick={handleSwitchToWorker}
          >
            <Text className="mePage__switchText">我是打手</Text>
          </View>
        </View>

        <View className="mePage__balanceCard">
          <View className="mePage__balanceLeft">
            <Text className="mePage__balanceLabel">可用余额</Text>
            <Text className="mePage__balanceAmount">{balanceText}</Text>
          </View>
          <View
            className="mePage__balanceAction"
            onClick={() => handleFeatureClick("提现/充值")}
            aria-label="提现或充值"
          >
            <Text className="mePage__balanceActionText">提现/充值</Text>
          </View>
        </View>

        <View className="mePage__sectionCard">
          <View
            className="mePage__sectionHeader"
            onClick={handleOpenOrders}
            aria-label="查看订单列表"
          >
            <Text className="mePage__sectionTitle">订单状态</Text>
            <Text className="mePage__sectionArrow">›</Text>
          </View>
          <View className="mePage__stateRow">
            {ORDER_STATE_DEFS.map((item) => {
              const n = counts?.[item.countKey] ?? 0;
              return (
                <View
                  key={item.key}
                  className="mePage__stateItem"
                  onClick={() => handleOpenOrders()}
                  aria-label={`${item.label}${n > 0 ? ` ${n} 笔` : ""}`}
                >
                  <View className="mePage__stateIconWrap">
                    <Image
                      className="mePage__stateIcon"
                      src={item.iconSrc}
                      mode="aspectFit"
                      aria-hidden
                    />
                    {n > 0 ? (
                      <View className="mePage__stateBadge">
                        <Text className="mePage__stateBadgeText">{n > 99 ? "99+" : n}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text className="mePage__stateLabel">{item.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View className="mePage__sectionCard">
          {STATIC_MENUS.map((menu) => (
            <View key={menu.key} className="mePage__menuRow" onClick={() => handleMenuClick(menu)}>
              <View className="mePage__menuLeft">
                <Image
                  className="mePage__menuIcon"
                  src={menu.iconSrc}
                  mode="aspectFit"
                  aria-label={`${menu.label}图标`}
                />
                <Text className="mePage__menuLabel">{menu.label}</Text>
              </View>
              <Text className="mePage__menuArrow">›</Text>
            </View>
          ))}
        </View>

        <View className="mePage__serviceBtn" onClick={handleOpenCustomerService}>
          <Text className="mePage__serviceBtnIcon">🎧</Text>
          <Text className="mePage__serviceBtnText">联系在线客服</Text>
        </View>

        {loggedIn ? (
          <View className="mePage__logoutRow">
            <View className="mePage__logoutBtn" onClick={handleLogout} aria-label="退出登录">
              <Text className="mePage__logoutText">退出登录</Text>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <BottomBar role={role} activeKey="me" />

      <LoginModal
        visible={loginOpen}
        onClose={() => setLoginOpen(false)}
        onLoginSuccess={() => {
          setLoggedIn(true);
          setCurrentRole(getRole());
          void loadMe();
        }}
      />
    </View>
  );
};

export default MePage;
