import { View, Text, ScrollView, Input } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useMemo, useState } from "react";
import "./index.scss";
import { BottomBar } from "../../components/bottom-bar/BottomBar";
import { getRole } from "../../utils/role";

type ServiceCategory = {
  key: string;
  label: string;
  subtitle: string;
};

type ServiceTag = {
  label: string;
  tone: "primary" | "secondary" | "neutral";
};

type ServiceCard = {
  id: string;
  categoryKey: string;
  title: string;
  desc: string;
  priceText: string;
  soldText: string;
  tag?: ServiceTag;
};

const mockCategories: ServiceCategory[] = [
  // TODO(backend): 后端返回分类列表（key/label/icon/排序）
  { key: "extract", label: "带出类", subtitle: "精品带出服务" },
  { key: "guarantee", label: "保底类", subtitle: "高价值保底方案" },
  { key: "rank", label: "上分类", subtitle: "上分/上段服务" },
  { key: "escort", label: "护航类", subtitle: "全程陪跑护航" },
  { key: "custom", label: "定制类", subtitle: "按需定制方案" }
];

const mockServices: ServiceCard[] = [
  // TODO(backend): 后端返回服务卡片列表（标题/描述/价格/销量/标签/库存等）
  {
    id: "svc-1",
    categoryKey: "extract",
    title: "红卡稳定带出服务",
    desc: "针对高级战区红卡提取，全程专业护航，保证物资安全撤离。",
    priceText: "¥299.00",
    soldText: "已售 1.2k+",
    tag: { label: "成功率 98%", tone: "secondary" }
  },
  {
    id: "svc-2",
    categoryKey: "extract",
    title: "全地图通用带出",
    desc: "不限地图，不限物资等级，全天候 24 小时随时发车。",
    priceText: "¥158.00",
    soldText: "已售 856",
    tag: { label: "极速提取", tone: "primary" }
  },
  {
    id: "svc-3",
    categoryKey: "extract",
    title: "VIP 专享：顶级组合带出",
    desc: "包含实验室权限卡、秘密文件及顶级防具套，由顶尖团队带队。",
    priceText: "¥1,299",
    soldText: "VIP 专享",
    tag: { label: "100% 成功保底", tone: "secondary" }
  },
  {
    id: "svc-4",
    categoryKey: "extract",
    title: "快速撤离：黄金时段",
    desc: "晚间黄金时段极速响应，平均等待时间小于 3 分钟。",
    priceText: "¥88.00",
    soldText: "已售 431",
    tag: { label: "中级套餐", tone: "neutral" }
  }
];

const CategoryPage = () => {
  const role = getRole();
  const [activeCategoryKey, setActiveCategoryKey] = useState<string>(mockCategories[0]?.key ?? "");
  const [keyword, setKeyword] = useState("");

  const activeCategory = useMemo(
    () => mockCategories.find((c) => c.key === activeCategoryKey) ?? mockCategories[0],
    [activeCategoryKey]
  );

  const visibleServices = useMemo(() => {
    const byCategory = mockServices.filter((s) => s.categoryKey === activeCategoryKey);
    const trimmed = keyword.trim();
    if (!trimmed) return byCategory;
    return byCategory.filter(
      (s) => s.title.includes(trimmed) || s.desc.includes(trimmed) || s.soldText.includes(trimmed)
    );
  }, [activeCategoryKey, keyword]);

  const handleBuy = (service: ServiceCard) => {
    // TODO(backend): 跳转下单/服务详情页
    void Taro.showToast({ title: `选择：${service.title}`, icon: "none" });
  };

  return (
    <View className="categoryPage">
      <View className="categoryPage__topBar">
        <View className="categoryPage__searchRow">
          <Text className="categoryPage__searchIcon">⌕</Text>
          <View className="categoryPage__searchBox">
            <Input
              className="categoryPage__searchInput"
              value={keyword}
              onInput={(e) => setKeyword(String(e.detail.value ?? ""))}
              placeholder="搜索服务内容..."
              placeholderClass="categoryPage__searchPlaceholder"
            />
          </View>
        </View>
        <View className="categoryPage__topRight">
          <Text className="categoryPage__topTitle">SEARCH_SERVICES</Text>
          <View className="categoryPage__cartBtn" aria-label="购物车">
            <Text className="categoryPage__cartIcon">🛒</Text>
          </View>
        </View>
      </View>

      <View className="categoryPage__body">
        <View className="categoryPage__side">
          <ScrollView className="categoryPage__sideScroll" scrollY enhanced showScrollbar={false}>
            {mockCategories.map((c) => {
              const isActive = c.key === activeCategoryKey;
              return (
                <View
                  key={c.key}
                  className={`categoryPage__sideItem ${isActive ? "categoryPage__sideItem--active" : ""}`}
                  onClick={() => setActiveCategoryKey(c.key)}
                  aria-label={`切换分类：${c.label}`}
                >
                  <Text className="categoryPage__sideLabel">{c.label}</Text>
                </View>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView className="categoryPage__content" scrollY enhanced showScrollbar={false}>
          <View className="categoryPage__contentHeader">
            <Text className="categoryPage__contentTitle">{activeCategory?.subtitle ?? "服务"}</Text>
            <Text className="categoryPage__contentDesc">Elite services for high-tier players.</Text>
          </View>

          <View className="categoryPage__grid">
            {visibleServices.map((service) => (
              <View key={service.id} className="categoryPage__card">
                <View className="categoryPage__cardTop">
                  {service.tag ? (
                    <View
                      className={`categoryPage__tag categoryPage__tag--${service.tag.tone}`}
                      aria-label={service.tag.label}
                    >
                      <View className="categoryPage__tagDot" />
                      <Text className="categoryPage__tagText">{service.tag.label}</Text>
                    </View>
                  ) : (
                    <View />
                  )}
                  <Text className="categoryPage__sold">{service.soldText}</Text>
                </View>

                <Text className="categoryPage__cardTitle">{service.title}</Text>
                <Text className="categoryPage__cardDesc">{service.desc}</Text>

                <View className="categoryPage__cardBottom">
                  <View className="categoryPage__priceBlock">
                    <Text className="categoryPage__priceLabel">Starting at</Text>
                    <Text className="categoryPage__price">{service.priceText}</Text>
                  </View>
                  <View className="categoryPage__buyBtn" onClick={() => handleBuy(service)}>
                    <Text className="categoryPage__buyBtnText">立即购</Text>
                  </View>
                </View>
              </View>
            ))}

            {visibleServices.length === 0 ? (
              <View className="categoryPage__empty">
                <Text className="categoryPage__emptyText">暂无匹配服务，换个关键词试试</Text>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </View>

      <BottomBar role={role} activeKey="category" />
    </View>
  );
};

export default CategoryPage;
