import { View, Text, ScrollView, Swiper, SwiperItem, Image } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { useCallback, useEffect, useMemo, useState } from "react";
import "./index.scss";
import {
  fetchMiniCustomerServiceAgents,
  type MiniCustomerServiceAgent
} from "../../services/customer-service";

/** 路由参数 from → 文案 */
const SOURCE_LABELS: Record<string, string> = {
  me: "个人中心",
  "goods-detail": "商品详情",
  "order-detail": "订单详情",
  "worker-order-detail": "打手订单",
  "worker-income-detail": "收益明细"
};

/**
 * 组装咨询上下文说明（来源页、业务 ID、身份）。
 */
const buildContextDescription = (params: {
  from?: string;
  bizId?: string;
  role?: string;
}): string => {
  const fromKey = (params.from ?? "").trim();
  const src = fromKey ? (SOURCE_LABELS[fromKey] ?? fromKey) : "";
  const parts: string[] = [];
  if (src) parts.push(`来源：${src}`);
  const id = (params.bizId ?? "").trim();
  if (id) parts.push(`业务编号：${id}`);
  const role = (params.role ?? "").trim();
  if (role === "user") parts.push("身份：老板端");
  if (role === "worker") parts.push("身份：打手端");
  return parts.join(" · ");
};

/**
 * 列表项 UI 色板（轮播交替）。
 */
const accentAtIndex = (index: number): "primary" | "secondary" =>
  index % 2 === 0 ? "primary" : "secondary";

const CustomerServicePage = () => {
  const router = useRouter();
  const fromParam = String(router.params?.from ?? "").trim();
  const bizIdParam = String(router.params?.id ?? "").trim();
  const roleParam = String(router.params?.role ?? "").trim();

  const contextText = useMemo(
    () =>
      buildContextDescription({
        from: fromParam || undefined,
        bizId: bizIdParam || undefined,
        role: roleParam || undefined
      }),
    [fromParam, bizIdParam, roleParam]
  );

  const [agents, setAgents] = useState<MiniCustomerServiceAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeAgentIndex, setActiveAgentIndex] = useState(0);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        const items = await fetchMiniCustomerServiceAgents();
        setAgents(items);
      } catch (error: unknown) {
        void Taro.showToast({
          title: error instanceof Error ? error.message : "加载失败",
          icon: "none"
        });
        setAgents([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const activeAgent = agents[activeAgentIndex] ?? agents[0];

  const handleSaveQrCode = useCallback(async () => {
    const qrUrl = activeAgent?.wechatQrUrl?.trim();
    if (!qrUrl) {
      void Taro.showToast({ title: "暂无二维码", icon: "none" });
      return;
    }

    try {
      const download = await Taro.downloadFile({ url: qrUrl });
      const filePath = download.tempFilePath;
      if (!filePath) {
        void Taro.showToast({ title: "二维码下载失败", icon: "none" });
        return;
      }

      try {
        await Taro.saveImageToPhotosAlbum({ filePath });
        void Taro.showToast({ title: "已保存到相册", icon: "success" });
      } catch (saveErr: unknown) {
        const errMsg =
          typeof saveErr === "object" && saveErr !== null && "errMsg" in saveErr
            ? String((saveErr as { errMsg?: string }).errMsg ?? "")
            : saveErr instanceof Error
              ? saveErr.message
              : "";
        const needSetting =
          errMsg.includes("auth deny") ||
          errMsg.includes("authorize") ||
          errMsg.includes("permission");

        if (!needSetting) {
          void Taro.showToast({
            title: errMsg || "保存失败",
            icon: "none"
          });
          return;
        }

        const modal = await Taro.showModal({
          title: "需要相册权限",
          content: "保存二维码需授权「保存到相册」。请在设置中开启后重试。",
          confirmText: "去设置"
        });
        if (modal.confirm) {
          await Taro.openSetting();
        }
      }
    } catch (error: unknown) {
      void Taro.showToast({
        title: error instanceof Error ? error.message : "保存失败",
        icon: "none"
      });
    }
  }, [activeAgent]);

  const handleCopyWechatId = useCallback(async () => {
    const wid = activeAgent?.wechatId?.trim();
    if (!wid) {
      void Taro.showToast({ title: "暂无微信号", icon: "none" });
      return;
    }
    try {
      await Taro.setClipboardData({ data: wid });
      void Taro.showToast({ title: "微信号已复制", icon: "success" });
    } catch {
      void Taro.showToast({ title: "复制失败", icon: "none" });
    }
  }, [activeAgent]);

  return (
    <View className="customerService">
      <ScrollView className="customerService__scroll" scrollY enhanced showScrollbar={false}>
        <View className="customerService__glow" />
        <View className="customerService__header">
          <Text className="customerService__headline">扫码添加</Text>
          <Text className="customerService__subHeadline">专属客服</Text>
        </View>

        {contextText ? (
          <View className="customerService__contextBanner">
            <Text className="customerService__contextText">{contextText}</Text>
          </View>
        ) : null}

        {loading ? (
          <View className="customerService__emptyWrap">
            <Text className="customerService__emptyText">客服资料加载中…</Text>
          </View>
        ) : null}

        {!loading && agents.length === 0 ? (
          <View className="customerService__emptyWrap">
            <Text className="customerService__emptyText">
              暂无可用客服，请稍后再试或通过其它渠道联系平台。
            </Text>
          </View>
        ) : null}

        {!loading && agents.length > 0 ? (
          <>
            <Swiper
              className="customerService__swiper"
              current={activeAgentIndex}
              circular={agents.length > 1}
              onChange={(event) => setActiveAgentIndex(event.detail.current)}
            >
              {agents.map((agent, slideIndex) => {
                const accent = accentAtIndex(slideIndex);
                const isPrimary = accent === "primary";
                return (
                  <SwiperItem key={agent.id}>
                    <View className="customerService__slide">
                      <View className="customerService__card">
                        <View
                          className={`customerService__cardAccent ${isPrimary ? "customerService__cardAccent--primary" : "customerService__cardAccent--secondary"}`}
                        />
                        <View className="customerService__avatarWrap">
                          <Image
                            className="customerService__avatar"
                            src={agent.avatarUrl}
                            mode="aspectFill"
                          />
                        </View>
                        <View className="customerService__nameRow">
                          <Text className="customerService__agentTitle">专属客服：</Text>
                          <Text
                            className={`customerService__agentName ${isPrimary ? "customerService__agentName--primary" : "customerService__agentName--secondary"}`}
                          >
                            {agent.nickname}
                          </Text>
                        </View>
                        <View className="customerService__statusRow">
                          <View
                            className={`customerService__statusDot ${
                              agent.presenceStatus === "online"
                                ? "customerService__statusDot--online"
                                : agent.presenceStatus === "busy"
                                  ? "customerService__statusDot--busy"
                                  : "customerService__statusDot--offline"
                            }`}
                          />
                          <Text className="customerService__statusText">{agent.presenceLabel}</Text>
                        </View>

                        <View className="customerService__wechatRow">
                          <Text className="customerService__wechatLabel">微信号</Text>
                          <Text className="customerService__wechatValue">{agent.wechatId}</Text>
                          <View
                            className="customerService__wechatCopy"
                            onClick={handleCopyWechatId}
                            aria-label="复制微信号"
                          >
                            <Text className="customerService__wechatCopyText">复制</Text>
                          </View>
                        </View>

                        <View className="customerService__qrFrame">
                          <View
                            className={`customerService__corner customerService__corner--tl ${
                              isPrimary
                                ? "customerService__corner--primary"
                                : "customerService__corner--secondary"
                            }`}
                          />
                          <View
                            className={`customerService__corner customerService__corner--tr ${
                              isPrimary
                                ? "customerService__corner--primary"
                                : "customerService__corner--secondary"
                            }`}
                          />
                          <View
                            className={`customerService__corner customerService__corner--bl ${
                              isPrimary
                                ? "customerService__corner--secondary"
                                : "customerService__corner--primary"
                            }`}
                          />
                          <View
                            className={`customerService__corner customerService__corner--br ${
                              isPrimary
                                ? "customerService__corner--secondary"
                                : "customerService__corner--primary"
                            }`}
                          />
                          <View className="customerService__qrInner">
                            <Image
                              className="customerService__qrImage"
                              src={agent.wechatQrUrl}
                              mode="aspectFill"
                            />
                          </View>
                        </View>
                      </View>
                    </View>
                  </SwiperItem>
                );
              })}
            </Swiper>

            <View className="customerService__dotRow">
              {agents.map((agent, index) => (
                <View
                  key={agent.id}
                  className={`customerService__dot ${index === activeAgentIndex ? "customerService__dot--active" : ""}`}
                />
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>

      {!loading && agents.length > 0 ? (
        <View className="customerService__footer">
          <View
            className="customerService__primaryBtn"
            onClick={handleSaveQrCode}
            aria-label="保存二维码到相册"
          >
            <Text className="customerService__primaryBtnText">保存二维码</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
};

export default CustomerServicePage;
