import { View, Text, Swiper, SwiperItem, ScrollView } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { Notice, Search, Star, HeartFill } from "@nutui/icons-react-taro";
import { useMemo, useState } from "react";
import "./index.scss";
import { BottomBar } from "../../components/bottom-bar/BottomBar";
import { AppIconFont } from "../../components/icon-font/IconFont";
import {
  getRole,
  resolveWorkerPermission,
  setRole,
  setToken,
  setWorkerPermission
} from "../../utils/role";
import { request } from "../../services/http";

type GameTab = {
  key: string;
  label: string;
};

type BannerItem = {
  tag: string;
  title: string;
  subtitle: string;
  rightTitle: string;
  rightSubTitle: string;
};

type ServiceItem = {
  id: string;
  gameKey: string;
  gameName: string;
  title: string;
  subtitle: string;
  price: string;
  coverClassName: string;
  chip: string;
  chipClassName: string;
};

const BANNERS: BannerItem[] = [
  {
    tag: "限时优惠",
    title: "夏季赛",
    subtitle: "冠军冲刺代练",
    rightTitle: "GAMING",
    rightSubTitle: "SAFE WORK"
  },
  {
    tag: "新客福利",
    title: "首单特惠",
    subtitle: "资深大神 8 折起",
    rightTitle: "PRO TEAM",
    rightSubTitle: "FAST MATCH"
  },
  {
    tag: "今晚爆单",
    title: "高分冲榜",
    subtitle: "稳定不掉星",
    rightTitle: "NIGHT RUN",
    rightSubTitle: "RANK UP"
  }
];

const NOTICE_LIST: string[] = [
  "系统通知：周末大促已开启，部分服务立减 20%",
  "平台公告：新入驻大神已上线，可优先下单",
  "温馨提醒：下单前请确认服务时段和需求"
];

const GAME_TABS: GameTab[] = [
  { key: "all", label: "全部游戏" },
  { key: "wzry", label: "王者荣耀" },
  { key: "lol", label: "英雄联盟" },
  { key: "ys", label: "原神" },
  { key: "peace", label: "和平精英" },
  { key: "jcc", label: "金铲铲之战" }
];

const SERVICES: ServiceItem[] = [
  {
    id: "wzry-rank",
    gameKey: "wzry",
    gameName: "王者荣耀",
    title: "王者荣耀: 排位上分",
    subtitle: "专业多单保障团队",
    price: "¥168.00",
    coverClassName: "userHome__serviceCover--a",
    chip: "热门",
    chipClassName: "userHome__coverChip--hot"
  },
  {
    id: "lol-duo",
    gameKey: "lol",
    gameName: "英雄联盟",
    title: "LOL: 双排指导",
    subtitle: "大师级教练带你学",
    price: "¥315.00",
    coverClassName: "userHome__serviceCover--b",
    chip: "新品",
    chipClassName: "userHome__coverChip--new"
  },
  {
    id: "jcc-fast",
    gameKey: "jcc",
    gameName: "金铲铲之战",
    title: "金铲铲: 快速升级",
    subtitle: "高效冲榜冲段专家",
    price: "¥98.00",
    coverClassName: "userHome__serviceCover--c",
    chip: "金铲铲",
    chipClassName: "userHome__coverChip--brand"
  },
  {
    id: "peace-rank",
    gameKey: "peace",
    gameName: "和平精英",
    title: "和平精英: 王者上分",
    subtitle: "冠军枪法带你冲榜",
    price: "¥128.00",
    coverClassName: "userHome__serviceCover--d",
    chip: "和平精英",
    chipClassName: "userHome__coverChip--brand"
  },
  {
    id: "ys-open",
    gameKey: "ys",
    gameName: "原神",
    title: "原神: 深渊满星",
    subtitle: "高练度配队稳定通关",
    price: "¥228.00",
    coverClassName: "userHome__serviceCover--b",
    chip: "原神",
    chipClassName: "userHome__coverChip--brand"
  }
];

const UserHomePage = () => {
  const role = getRole();
  const [activeGameKey, setActiveGameKey] = useState<string>("all");

  const visibleServices = useMemo(
    () =>
      activeGameKey === "all"
        ? SERVICES
        : SERVICES.filter((service) => service.gameKey === activeGameKey),
    [activeGameKey]
  );

  const handleGoWorkerHome = () => {
    void Taro.navigateTo({ url: "/pages/home-worker/index" });
  };

  const handleSelectGameTab = (gameKey: string) => {
    setActiveGameKey(gameKey);
  };

  const handleServiceCardClick = async () => {
    try {
      // TODO: 页面联调阶段先用假数据，后续这里改成真实后端登录与下单接口。
      const loginResult = await Taro.login();
      const apiResult = await request<{
        token: string;
        hasWorkerPermission?: boolean;
      }>("/auth/mini/login", { method: "POST", body: { code: loginResult.code } });
      setToken(apiResult.data.token);
      const hasWorkerPermission = resolveWorkerPermission(apiResult.data);
      setWorkerPermission(hasWorkerPermission);
      // 登录后统一回到用户端，打手端通过“我的”页手动切换。
      setRole("user");

      void Taro.showToast({ title: "下单成功（原型）", icon: "none" });
    } catch (error) {
      console.log("登录失败", error);
      void Taro.showToast({ title: "登录失败，请重试", icon: "none" });
    }
  };

  return (
    <View className="userHome">
      <View className="userHome__topFixed">
        <View className="userHome__brandRow">
          <View className="userHome__brandLeft">
            <View className="userHome__avatar" />
            <Text className="userHome__brandName">夜曲电竞</Text>
          </View>
          <View className="userHome__brandRight">
            <View className="userHome__iconBtn" aria-label="通知">
              <AppIconFont className="userHome__iconText" name="notice" />
            </View>
          </View>
        </View>

        <View className="userHome__search">
          <Search className="userHome__searchIcon" />
          <Text className="userHome__searchPlaceholder">搜索精英代练服务...</Text>
        </View>
      </View>

      <View className="userHome__content">
        <View className="userHome__header">
          <Swiper
            className="userHome__bannerSwiper"
            indicatorDots
            circular
            autoplay
            interval={3500}
            duration={500}
            indicatorColor="rgba(255,255,255,0.30)"
            indicatorActiveColor="#a78bfa"
          >
            {BANNERS.map((banner) => (
              <SwiperItem key={banner.title}>
                <View className="userHome__banner">
                  <View className="userHome__bannerOverlay">
                    <Text className="userHome__bannerTag">{banner.tag}</Text>
                    <Text className="userHome__bannerTitle">{banner.title}</Text>
                    <Text className="userHome__bannerSubTitle">{banner.subtitle}</Text>
                  </View>
                  <View className="userHome__bannerRight">
                    <Text className="userHome__bannerRightTitle">{banner.rightTitle}</Text>
                    <Text className="userHome__bannerRightSub">{banner.rightSubTitle}</Text>
                  </View>
                </View>
              </SwiperItem>
            ))}
          </Swiper>

          <View className="userHome__noticeBar">
            <Notice className="userHome__noticeIcon" />
            <Swiper
              className="userHome__noticeSwiper"
              circular
              vertical
              autoplay
              interval={3000}
              duration={450}
            >
              {NOTICE_LIST.map((message) => (
                <SwiperItem key={message}>
                  <View className="userHome__noticeItem">
                    <Text className="userHome__noticeText">{message}</Text>
                  </View>
                </SwiperItem>
              ))}
            </Swiper>
          </View>

          <View className="userHome__quickGrid">
            <View className="userHome__quickCard userHome__quickCard--left">
              <View className="userHome__quickTitleRow">
                <Star className="userHome__quickTitleIcon" />
                <Text className="userHome__quickTitle">好评榜</Text>
              </View>
              <Text className="userHome__quickDesc">最高评分</Text>
            </View>
            <View className="userHome__quickCard userHome__quickCard--right">
              <View className="userHome__quickTitleRow">
                <HeartFill className="userHome__quickTitleIcon" />
                <Text className="userHome__quickTitle">热销榜</Text>
              </View>
              <Text className="userHome__quickDesc">火爆稳定</Text>
            </View>
          </View>
        </View>

        <View className="userHome__sectionHeader">
          <Text className="userHome__sectionTitle">精英服务</Text>
          <Text className="userHome__sectionAction">查看全部</Text>
        </View>

        <ScrollView className="userHome__tabsScroll" scrollX enhanced showScrollbar={false}>
          <View className="userHome__tabs">
            {GAME_TABS.map((tab) => {
              const isActive = tab.key === activeGameKey;
              return (
                <View
                  key={tab.key}
                  className={`userHome__tab ${isActive ? "userHome__tab--active" : ""}`}
                  onClick={() => handleSelectGameTab(tab.key)}
                >
                  <Text
                    className={`userHome__tabText ${isActive ? "userHome__tabText--active" : ""}`}
                  >
                    {tab.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </ScrollView>

        <View className="userHome__cardGrid">
          {visibleServices.map((service) => (
            <View
              key={service.id}
              className="userHome__serviceCard"
              onClick={handleServiceCardClick}
              aria-label={`选择${service.gameName}服务`}
            >
              <View className={`userHome__serviceCover ${service.coverClassName}`}>
                <Text className={`userHome__coverChip ${service.chipClassName}`}>
                  {service.chip}
                </Text>
              </View>
              <Text className="userHome__serviceName">{service.title}</Text>
              <Text className="userHome__serviceSub">{service.subtitle}</Text>
              <View className="userHome__serviceBottom">
                <Text className="userHome__servicePrice">{service.price}</Text>
              </View>
            </View>
          ))}
          {visibleServices.length === 0 ? (
            <View className="userHome__emptyState">
              <Text className="userHome__emptyStateText">暂无该分类服务，试试其他筛选项</Text>
            </View>
          ) : null}
        </View>
      </View>

      <BottomBar role={role} activeKey="home" />

      <View className="userHome__roleSwitch" onClick={handleGoWorkerHome} aria-label="切换到打手端">
        <Text className="userHome__roleSwitchText">打手端</Text>
      </View>
    </View>
  );
};

export default UserHomePage;
