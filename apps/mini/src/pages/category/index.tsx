import { View, Text, ScrollView, Input } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useEffect, useMemo, useState } from "react";
import "./index.scss";
import { BottomBar } from "../../components/bottom-bar/BottomBar";
import { getRole } from "../../utils/role";
import { fetchMiniProductCategories, fetchMiniProducts } from "../../services/products";

type ServiceCategory = { key: string; label: string; subtitle: string };
type ServiceCard = {
  id: string;
  categoryKey: string;
  title: string;
  desc: string;
  priceText: string;
  soldText: string;
};

const CategoryPage = () => {
  const role = getRole();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<ServiceCard[]>([]);
  const [activeCategoryKey, setActiveCategoryKey] = useState<string>("");
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const cats = await fetchMiniProductCategories();
        const nextCats: ServiceCategory[] = cats.map((item) => ({
          key: item.id,
          label: item.name,
          subtitle: item.name
        }));
        setCategories(nextCats);
        if (nextCats.length > 0) {
          setActiveCategoryKey(nextCats[0].key);
        }
      } catch (error) {
        void Taro.showToast({
          title: error instanceof Error ? error.message : "加载分类失败",
          icon: "none"
        });
      }
    })();
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const items = await fetchMiniProducts({
          keyword,
          categoryId: activeCategoryKey || undefined
        });
        setServices(
          items.map((item) => ({
            id: item.id,
            categoryKey: item.categoryId,
            title: item.name,
            desc: item.descriptionLines?.[0] ?? "",
            priceText: `¥${item.price.toFixed(2)}`,
            soldText: ""
          }))
        );
      } catch (error) {
        void Taro.showToast({
          title: error instanceof Error ? error.message : "加载商品失败",
          icon: "none"
        });
      }
    })();
  }, [activeCategoryKey, keyword]);

  const activeCategory = useMemo(
    () => categories.find((c) => c.key === activeCategoryKey) ?? categories[0],
    [activeCategoryKey, categories]
  );

  const visibleServices = useMemo(() => {
    return services.filter((s) => s.categoryKey === activeCategoryKey);
  }, [activeCategoryKey, services]);

  const handleBuy = (service: ServiceCard) => {
    void Taro.navigateTo({ url: `/pages/goods-detail/index?id=${encodeURIComponent(service.id)}` });
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
          <View className="categoryPage__sideScroll">
            {categories.map((c) => {
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
          </View>
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
                  <View />
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
