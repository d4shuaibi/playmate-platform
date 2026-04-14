import { View, Text, ScrollView, Swiper, SwiperItem, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useState } from "react";
import "./index.scss";

type NoticeItem = {
  id: string;
  level: "warn" | "error" | "info";
  text: string;
};

type GoodsDetailData = {
  heroImages: string[];
  priceText: string;
  originPriceText: string;
  stockText: string;
  title: string;
  titleAccent: string;
  badges: string[];
  descriptionLines: string[];
  notices: NoticeItem[];
};

// TODO(backend): 接入商品详情接口（轮播图、价格、标题、标签、说明、福利、下单须知）
const mockGoodsDetail: GoodsDetailData = {
  heroImages: [
    "https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1542751110-97427bbecf20?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80"
  ],
  priceText: "¥69.90",
  originPriceText: "¥128.00",
  stockText: "LIMITED STOCK",
  title: "绝密保底400-1000万！",
  titleAccent: "赠送转盘",
  badges: ["极速接单", "极速响应", "服务至上", "官方严选"],
  descriptionLines: [
    "必须打绝密并且保底400-1000万！（地图由打手选择）",
    "可单护可双护根据打手情况来。",
    "专业打手，稳定产出，极速回款。"
  ],
  notices: [
    {
      id: "notice-1",
      level: "error",
      text: "未成年禁止下单。本店严格执行国家未成年人防沉迷相关规定。"
    },
    { id: "notice-2", level: "error", text: "拒绝卡保底行为。一经发现，立即终止服务且不予退款。" },
    { id: "notice-3", level: "info", text: "服务过程中请勿顶号，否则造成的损失由买家自行承担。" }
  ]
};

const GoodsDetailPage = () => {
  const [currentSwiperIndex, setCurrentSwiperIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  const handleToggleFavorite = () => {
    // TODO(backend): 接入收藏/取消收藏接口，返回真实收藏状态
    setIsFavorite((prevState) => !prevState);
  };

  const handleContactService = () => {
    // TODO(backend): 接入客服会话（在线客服/IM）
    void Taro.showToast({ title: "客服功能开发中（Mock）", icon: "none" });
  };

  const handlePlaceOrder = () => {
    // TODO(backend): 接入下单接口（套餐、数量、支付）
    void Taro.showToast({ title: "立即下单（Mock）", icon: "none" });
  };

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
            {mockGoodsDetail.heroImages.map((imageUrl) => (
              <SwiperItem key={imageUrl}>
                <Image className="goodsDetail__heroImage" src={imageUrl} mode="aspectFill" />
              </SwiperItem>
            ))}
          </Swiper>

          <View className="goodsDetail__heroMask" />
          <View className="goodsDetail__heroPrice">
            <View className="goodsDetail__priceRow">
              <Text className="goodsDetail__price">{mockGoodsDetail.priceText}</Text>
              <Text className="goodsDetail__originPrice">{mockGoodsDetail.originPriceText}</Text>
              <View className="goodsDetail__stockChip">
                <Text className="goodsDetail__stockChipText">{mockGoodsDetail.stockText}</Text>
              </View>
            </View>
            <View className="goodsDetail__dotRow">
              {mockGoodsDetail.heroImages.map((item, index) => (
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
              {mockGoodsDetail.title}
              <Text className="goodsDetail__titleAccent">{mockGoodsDetail.titleAccent}</Text>
            </Text>
            <View className="goodsDetail__badgeRow">
              {mockGoodsDetail.badges.map((badgeText, index) => (
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
              {mockGoodsDetail.descriptionLines.map((lineText) => (
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
              {mockGoodsDetail.notices.map((notice) => (
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
