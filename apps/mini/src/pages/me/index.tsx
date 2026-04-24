import { View, Text, ScrollView, Image } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useState } from "react";
import "./index.scss";
import { BottomBar } from "../../components/bottom-bar/BottomBar";
import { fetchWorkerJoinProgress, logoutMiniUser } from "../../services";
// import { getRole, getWorkerPermission, setRole } from "../../utils/role";
import { getRole, setRole } from "../../utils/role";
import { getToken } from "../../utils/session";
import { LoginModal } from "../../components/login-modal/LoginModal";

type OrderStateItem = {
  key: string;
  iconSrc: string;
  label: string;
};

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

const mockProfile = {
  // TODO(backend): 接入用户资料接口，替换昵称/ID/等级/资产标签
  nickname: "王牌指挥官",
  userIdLabel: "ID_88291",
  levelLabel: "LVL45",
  assetTag: "GOLD"
};

const mockBalance = {
  // TODO(backend): 接入钱包接口，替换余额
  amountText: "¥1,250.00"
};

const mockOrderStates: OrderStateItem[] = [
  // TODO(backend): 接入订单统计接口（各状态数量）
  { key: "pendingPay", iconSrc: pendingPayIcon, label: "待付款" },
  { key: "pendingTake", iconSrc: pendingTakeIcon, label: "待接单" },
  { key: "serving", iconSrc: servingIcon, label: "服务中" },
  { key: "done", iconSrc: doneIcon, label: "待结单" },
  { key: "refund", iconSrc: refundIcon, label: "退款/售后" }
];

const mockMenus: MenuItem[] = [
  // TODO(backend): 接入运营配置/导航配置接口
  { key: "benefit", iconSrc: benefitIcon, label: "福利活动" },
  { key: "join", iconSrc: joinIcon, label: "打手入驻" },
  { key: "setting", iconSrc: settingIcon, label: "系统设置" },
  { key: "about", iconSrc: aboutIcon, label: "关于我们" }
];

const MePage = () => {
  const [role, setCurrentRole] = useState(() => getRole());
  const [loggedIn, setLoggedIn] = useState(() => Boolean(getToken()));
  const [loginOpen, setLoginOpen] = useState(false);

  useDidShow(() => {
    const nextLoggedIn = Boolean(getToken());
    const nextRole = getRole();
    setLoggedIn((prev) => (prev === nextLoggedIn ? prev : nextLoggedIn));
    setCurrentRole((prev) => (prev === nextRole ? prev : nextRole));
  });

  const handleLogout = () => {
    logoutMiniUser();
    setLoggedIn(false);
    setCurrentRole("user");
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
    // 预留：后续若要按服务端权限控制，这里改为 getWorkerPermission() 再允许切换
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

  const handleOpenCustomerService = () => {
    // TODO(backend): 可传递用户身份与会话上下文，接入真实客服系统
    void Taro.navigateTo({ url: "/pages/customer-service/index?from=me" });
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

  return (
    <View className="mePage">
      <ScrollView className="mePage__scroll" scrollY enhanced showScrollbar={false}>
        <View className="mePage__profileCard">
          <View className="mePage__avatarWrap">
            <View className="mePage__avatar">
              <Text className="mePage__avatarText">👤</Text>
            </View>
          </View>
          <View className="mePage__profileMain">
            <Text className="mePage__nickname">{loggedIn ? mockProfile.nickname : "未登录"}</Text>
            {loggedIn ? (
              <View className="mePage__profileMetaRow">
                <Text className="mePage__profileMeta">{mockProfile.userIdLabel}</Text>
                <Text className="mePage__profileMeta mePage__profileMeta--level">
                  {mockProfile.levelLabel}
                </Text>
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
          {loggedIn ? (
            <View className="mePage__assetTag">
              <Text className="mePage__assetTagText">{mockProfile.assetTag}</Text>
            </View>
          ) : null}
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
            <Text className="mePage__balanceAmount">{loggedIn ? mockBalance.amountText : "—"}</Text>
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
          <View className="mePage__sectionHeader">
            <Text className="mePage__sectionTitle">订单状态</Text>
            <Text className="mePage__sectionArrow">›</Text>
          </View>
          <View className="mePage__stateRow">
            {mockOrderStates.map((item) => (
              <View
                key={item.key}
                className="mePage__stateItem"
                onClick={() => handleFeatureClick(item.label)}
              >
                <View className="mePage__stateIconWrap">
                  <Image
                    className="mePage__stateIcon"
                    src={item.iconSrc}
                    mode="aspectFit"
                    aria-label={`${item.label}图标`}
                  />
                </View>
                <Text className="mePage__stateLabel">{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className="mePage__sectionCard">
          {mockMenus.map((menu) => (
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
        }}
      />
    </View>
  );
};

export default MePage;
