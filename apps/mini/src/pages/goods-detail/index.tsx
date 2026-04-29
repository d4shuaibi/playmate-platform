import { View, Text, ScrollView, Swiper, SwiperItem, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useEffect, useMemo, useState } from "react";
import "./index.scss";
import { fetchMiniProductDetail } from "../../services/products";
import { createMiniOrder } from "../../services/orders";
import { getToken } from "../../utils/session";

const GoodsDetailPage = () => {
  const router = useMemo(() => Taro.getCurrentInstance().router, []);
  const productId = String(router?.params?.id ?? "");
  const [currentSwiperIndex, setCurrentSwiperIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<{
    heroImages: string[];
    priceText: string;
    originPriceText: string;
    stockText: string;
    title: string;
    titleAccent: string;
    badges: string[];
    descriptionLines: string[];
    notices: Array<{ id: string; level: "warn" | "error" | "info"; text: string }>;
  } | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        const product = await fetchMiniProductDetail(productId);
        setDetail({
          heroImages: product.heroImages,
          priceText: `¥${product.price.toFixed(2)}`,
          originPriceText: product.originPrice ? `¥${product.originPrice.toFixed(2)}` : "",
          stockText: product.stockText || "",
          title: product.name,
          titleAccent: product.titleAccent || "",
          badges: product.badges ?? [],
          descriptionLines: product.descriptionLines ?? [],
          notices: product.notices ?? []
        });
      } catch (error) {
        void Taro.showToast({
          title: error instanceof Error ? error.message : "加载商品失败",
          icon: "none"
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [productId]);

  const handleToggleFavorite = () => {
    // TODO(backend): 接入收藏/取消收藏接口，返回真实收藏状态
    setIsFavorite((prevState) => !prevState);
  };

  const handleContactService = () => {
    void Taro.navigateTo({
      url: `/pages/customer-service/index?from=goods-detail&id=${encodeURIComponent(productId)}`
    });
  };

  const handlePlaceOrder = async () => {
    if (!getToken()) {
      void Taro.showToast({ title: "请先登录", icon: "none" });
      return;
    }
    if (!productId) {
      void Taro.showToast({ title: "缺少商品信息", icon: "none" });
      return;
    }
    try {
      const order = await createMiniOrder(productId);
      void Taro.navigateTo({
        url: `/pages/order-detail/index?id=${encodeURIComponent(order.id)}`
      });
    } catch (error: unknown) {
      void Taro.showToast({
        title: error instanceof Error ? error.message : "下单失败",
        icon: "none"
      });
    }
  };

  if (loading || !detail) {
    return (
      <View className="goodsDetail">
        <View className="goodsDetail__footer" />
      </View>
    );
  }

  return (
    <View className="goodsDetail">
      <ScrollView className="goodsDetail__scroll" scrollY enhanced showScrollbar={false}>
        <View className="goodsDetail__hero">
          <View className="goodsDetail__collect">
            <View
              className={`goodsDetail__iconBtn ${isFavorite ? "goodsDetail__iconBtn--active" : ""}`}
              onClick={handleToggleFavorite}
              aria-label={isFavorite ? "取消收藏" : "收藏商品"}
            >
              <Text className="goodsDetail__iconBtnText">{isFavorite ? "★" : "☆"}</Text>
            </View>
          </View>
          <Swiper
            className="goodsDetail__heroSwiper"
            circular
            autoplay
            interval={4500}
            current={currentSwiperIndex}
            onChange={(event) => setCurrentSwiperIndex(event.detail.current)}
          >
            {detail.heroImages.map((imageUrl) => (
              <SwiperItem key={imageUrl}>
                <Image className="goodsDetail__heroImage" src={imageUrl} mode="aspectFill" />
              </SwiperItem>
            ))}
          </Swiper>

          <View className="goodsDetail__heroMask" />
          <View className="goodsDetail__heroPrice">
            <View className="goodsDetail__priceRow">
              <Text className="goodsDetail__price">{detail.priceText}</Text>
              {detail.originPriceText ? (
                <Text className="goodsDetail__originPrice">{detail.originPriceText}</Text>
              ) : null}
              {detail.stockText ? (
                <View className="goodsDetail__stockChip">
                  <Text className="goodsDetail__stockChipText">{detail.stockText}</Text>
                </View>
              ) : null}
            </View>
            <View className="goodsDetail__dotRow">
              {detail.heroImages.map((item, index) => (
                <View
                  key={item}
                  className={`goodsDetail__dot ${index === currentSwiperIndex ? "goodsDetail__dot--active" : ""}`}
                />
              ))}
            </View>
          </View>
        </View>

        <View className="goodsDetail__content">
          <View className="goodsDetail__header">
            <Text className="goodsDetail__title">
              {detail.title}
              {detail.titleAccent ? (
                <Text className="goodsDetail__titleAccent">{detail.titleAccent}</Text>
              ) : null}
            </Text>
            <View className="goodsDetail__badgeRow">
              {detail.badges.map((badgeText, index) => (
                <View
                  key={badgeText}
                  className={`goodsDetail__badge ${index === 0 ? "goodsDetail__badge--signal" : ""} ${index === 3 ? "goodsDetail__badge--primary" : ""}`}
                >
                  {index === 0 ? <View className="goodsDetail__badgeDot" /> : null}
                  <Text className="goodsDetail__badgeText">{badgeText}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className="goodsDetail__card goodsDetail__descCard">
            <Text className="goodsDetail__cardTitle">商品说明</Text>
            <View className="goodsDetail__descContent">
              {detail.descriptionLines.map((lineText) => (
                <Text key={lineText} className="goodsDetail__descText">
                  {lineText}
                </Text>
              ))}
            </View>
          </View>

          <View className="goodsDetail__card goodsDetail__noticeCard">
            <View className="goodsDetail__sectionHeader">
              <Text className="goodsDetail__sectionTitle">下单须知</Text>
            </View>
            <View className="goodsDetail__noticeList">
              {detail.notices.map((notice) => (
                <View key={notice.id} className="goodsDetail__noticeItem">
                  <View
                    className={`goodsDetail__noticeDot ${notice.level === "error" ? "goodsDetail__noticeDot--error" : "goodsDetail__noticeDot--info"}`}
                  />
                  <Text className="goodsDetail__noticeText">{notice.text}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      <View className="goodsDetail__footer">
        <View className="goodsDetail__footerRow">
          <View
            className="goodsDetail__smallBtn"
            onClick={handleContactService}
            aria-label="联系客服"
          >
            <Text className="goodsDetail__smallBtnText">🎧</Text>
          </View>
          <View className="goodsDetail__orderBtn" onClick={handlePlaceOrder} aria-label="立即下单">
            <Text className="goodsDetail__orderBtnText">立即下单</Text>
            <Text className="goodsDetail__orderBtnArrow">›</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default GoodsDetailPage;
