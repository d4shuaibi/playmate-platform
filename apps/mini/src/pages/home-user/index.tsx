import { View, Text, Swiper, SwiperItem, ScrollView, Input } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { Notice, Search, Star, HeartFill } from "@nutui/icons-react-taro";
import React, { useEffect, useMemo, useState } from "react";
import "./index.scss";
import { BottomBar } from "../../components/bottom-bar/BottomBar";
import { AppIconFont } from "../../components/icon-font/IconFont";
import { LoginModal } from "../../components/login-modal/LoginModal";
import { getRole } from "../../utils/role";
import { getToken } from "../../utils/session";
import { fetchMiniProductCategories, fetchMiniProducts } from "../../services/products";

type ServiceTab = { key: string; label: string };

type BannerItem = {
  tag: string;
  title: string;
  subtitle: string;
  rightTitle: string;
  rightSubTitle: string;
};

type ServiceItem = {
  id: string;
  categoryKey: string;
  categoryName: string;
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

const DEFAULT_TABS: ServiceTab[] = [{ key: "all", label: "全部类型" }];

const UserHomePage = () => {
  const role = getRole();
  const [tabs, setTabs] = useState<ServiceTab[]>(DEFAULT_TABS);
  const [activeTypeKey, setActiveTypeKey] = useState<string>("all");
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loginOpen, setLoginOpen] = useState(false);
  /** 搜索框草稿，确认后跳转分类页并带上 keyword / categoryId */
  const [searchDraft, setSearchDraft] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const categories = await fetchMiniProductCategories();
        setTabs([
          { key: "all", label: "全部类型" },
          ...categories.map((c) => ({ key: c.id, label: c.name }))
        ]);
      } catch (error) {
        void Taro.showToast({
          title: error instanceof Error ? error.message : "加载类型失败",
          icon: "none"
        });
      }
    })();
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const items = await fetchMiniProducts({
          categoryId: activeTypeKey === "all" ? undefined : activeTypeKey
        });
        setServices(
          items.map((item, index) => {
            const coverClassName =
              index % 4 === 0
                ? "userHome__serviceCover--a"
                : index % 4 === 1
                  ? "userHome__serviceCover--b"
                  : index % 4 === 2
                    ? "userHome__serviceCover--c"
                    : "userHome__serviceCover--d";
            return {
              id: item.id,
              categoryKey: item.categoryId,
              categoryName: item.categoryName,
              title: item.name,
              subtitle: item.descriptionLines?.[0] ?? item.stockText ?? "",
              price: `¥${item.price.toFixed(2)}`,
              coverClassName,
              chip: item.categoryName,
              chipClassName: "userHome__coverChip--brand"
            };
          })
        );
      } catch (error) {
        void Taro.showToast({
          title: error instanceof Error ? error.message : "加载服务失败",
          icon: "none"
        });
      }
    })();
  }, [activeTypeKey]);

  const visibleServices = useMemo(
    () =>
      activeTypeKey === "all"
        ? services
        : services.filter((service) => service.categoryKey === activeTypeKey),
    [activeTypeKey, services]
  );

  const handleGoWorkerHome = () => {
    void Taro.navigateTo({ url: "/pages/home-worker/index" });
  };

  const handleSelectTypeTab = (typeKey: string) => {
    setActiveTypeKey(typeKey);
  };

  /** 构造分类页路径，与列表筛选参数一致 */
  const buildCategoryListUrl = () => {
    const query = new URLSearchParams();
    const trimmedKeyword = searchDraft.trim();
    if (trimmedKeyword.length > 0) {
      query.set("keyword", trimmedKeyword);
    }
    if (activeTypeKey !== "all") {
      query.set("categoryId", activeTypeKey);
    }
    const queryString = query.toString();
    return queryString.length > 0
      ? `/pages/category/index?${queryString}`
      : "/pages/category/index";
  };

  const handleSearchConfirm = () => {
    void Taro.navigateTo({ url: buildCategoryListUrl() });
  };

  const handleViewAllServices = () => {
    void Taro.navigateTo({ url: buildCategoryListUrl() });
  };

  const handleServiceCardClick = (serviceId: string) => {
    if (!getToken()) {
      setLoginOpen(true);
      return;
    }

    // TODO(backend): 改为根据 serviceId 查询真实商品详情
    void Taro.navigateTo({ url: `/pages/goods-detail/index?id=${encodeURIComponent(serviceId)}` });
  };

  return (
    <View className="userHome">
      <View className="userHome__topFixed">
        <View className="userHome__brandRow">
          <View className="userHome__brandLeft">
            <View className="userHome__avatar" />
            <Text className="userHome__brandName">澜动电竞</Text>
          </View>
          <View className="userHome__brandRight">
            <View className="userHome__iconBtn" aria-label="通知">
              <AppIconFont className="userHome__iconText" name="notice" />
            </View>
          </View>
        </View>

        <View className="userHome__search" aria-label="搜索服务">
          <Search className="userHome__searchIcon" />
          <Input
            className="userHome__searchInput"
            type="text"
            confirmType="search"
            value={searchDraft}
            placeholder="搜索精英代练服务..."
            placeholderClass="userHome__searchPlaceholder"
            onInput={(event) => setSearchDraft(String(event.detail.value ?? ""))}
            onConfirm={handleSearchConfirm}
          />
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
          <View
            className="userHome__sectionAction"
            onClick={handleViewAllServices}
            role="button"
            aria-label="查看全部服务"
          >
            <Text className="userHome__sectionActionText">查看全部</Text>
          </View>
        </View>

        <ScrollView className="userHome__tabsScroll" scrollX enhanced showScrollbar={false}>
          <View className="userHome__tabs">
            {tabs.map((tab) => {
              const isActive = tab.key === activeTypeKey;
              return (
                <View
                  key={tab.key}
                  className={`userHome__tab ${isActive ? "userHome__tab--active" : ""}`}
                  onClick={() => handleSelectTypeTab(tab.key)}
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
              onClick={() => handleServiceCardClick(service.id)}
              aria-label={`选择${service.categoryName}服务`}
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

      <LoginModal visible={loginOpen} onClose={() => setLoginOpen(false)} />
    </View>
  );
};

export default UserHomePage;
