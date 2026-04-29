import { View, Text, ScrollView } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useCallback, useEffect, useRef, useState } from "react";
import "./index.scss";
import { BottomBar } from "../../components/bottom-bar/BottomBar";
import { getRole } from "../../utils/role";
import type { MiniOrder } from "../../services/orders";
import {
  fetchWorkerWorkbench,
  patchWorkerPresence,
  startWorkerOrder,
  type WorkerPresenceMode,
  type WorkerWorkbenchSummary
} from "../../services/worker-workbench";

type PendingCardModel = {
  id: string;
  title: string;
  difficulty: string;
  requirement: string;
  remainTimeText: string;
  amountText: string;
};

/** 待接单卡片映射 */
const mapPendingCard = (order: MiniOrder): PendingCardModel => ({
  id: order.id,
  title: order.serviceTitle,
  difficulty: order.packageTag || "常规",
  requirement: order.deliveries[0]?.text ?? order.serviceTitle,
  remainTimeText: `下单 ${order.createdAt}`,
  amountText: `¥${order.amount.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
});

/** 收益较昨日文案 */
const formatTrendText = (pct: number | null): string => {
  if (pct === null || Number.isNaN(pct)) return "— 较昨日";
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct}% 较昨日`;
};

const WorkerHomePage = () => {
  const role = getRole();
  const [presence, setPresence] = useState<WorkerPresenceMode>("rest");
  const [summary, setSummary] = useState<WorkerWorkbenchSummary | null>(null);
  const [pendingOrders, setPendingOrders] = useState<MiniOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const skipDidShowOnceRef = useRef(true);

  const loadWorkbench = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchWorkerWorkbench();
      setPresence(data.presence);
      setSummary(data.summary);
      setPendingOrders(data.pendingOrders ?? []);
    } catch (error: unknown) {
      void Taro.showToast({
        title: error instanceof Error ? error.message : "加载工作台失败",
        icon: "none"
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWorkbench();
  }, [loadWorkbench]);

  useDidShow(() => {
    if (skipDidShowOnceRef.current) {
      skipDidShowOnceRef.current = false;
      return;
    }
    void loadWorkbench();
  });

  const handleGoUserHome = () => {
    void Taro.navigateTo({ url: "/pages/home-user/index" });
  };

  const handleStatusActionClick = async (mode: WorkerPresenceMode) => {
    try {
      const res = await patchWorkerPresence(mode);
      setPresence(res.mode);
      void Taro.showToast({
        title: res.mode === "online" ? "已切换为在线" : "已切换为休整",
        icon: "none"
      });
    } catch (error: unknown) {
      void Taro.showToast({
        title: error instanceof Error ? error.message : "状态更新失败",
        icon: "none"
      });
    }
  };

  const handleGoAllOrders = () => {
    void Taro.navigateTo({ url: "/pages/worker-orders/index" });
  };

  const handleStartOrder = async (orderId: string) => {
    try {
      await startWorkerOrder(orderId);
      void Taro.navigateTo({
        url: `/pages/worker-order-detail/index?id=${encodeURIComponent(orderId)}`
      });
    } catch (error: unknown) {
      void Taro.showToast({
        title: error instanceof Error ? error.message : "开始执行失败",
        icon: "none"
      });
    }
  };

  const incomeMain =
    summary != null
      ? summary.todayIncome.toLocaleString("zh-CN", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        })
      : "—";

  const trendText = summary != null ? formatTrendText(summary.incomeTrendPercent) : "—";

  return (
    <View className="workerCommand">
      <View className="workerCommand__topBar">
        <View className="workerCommand__brandWrap">
          <Text className="workerCommand__brandIcon">⌘</Text>
          <Text className="workerCommand__brandText">欢迎回来，准备好下一次任务了吗？</Text>
        </View>
        <View
          className={`workerCommand__onlineBadge ${presence === "online" ? "" : "workerCommand__onlineBadge--rest"}`}
        >
          <View className="workerCommand__onlineDot" />
          <Text className="workerCommand__onlineText">
            {presence === "online" ? "在线" : "休整"}
          </Text>
        </View>
      </View>

      <ScrollView scrollY enhanced showScrollbar={false} className="workerCommand__scroll">
        <View className="workerCommand__content">
          <View className="workerCommand__heroHeader workerCommand__statsCard">
            <View>
              <Text className="workerCommand__heroTitle">调整状态</Text>
            </View>
            <View className="workerCommand__statusActions">
              <View
                className={`workerCommand__statusBtn ${presence === "rest" ? "workerCommand__statusBtn--online" : ""}`}
                onClick={() => void handleStatusActionClick("rest")}
                aria-label="切换状态为休整"
              >
                <Text className="workerCommand__statusBtnText">休整</Text>
              </View>
              <View
                className={`workerCommand__statusBtn ${presence === "online" ? "workerCommand__statusBtn--online" : ""}`}
                onClick={() => void handleStatusActionClick("online")}
                aria-label="切换状态为在线"
              >
                <Text className="workerCommand__statusBtnText">在线</Text>
              </View>
            </View>
          </View>

          {loading ? (
            <View className="workerCommand__loadingHint">
              <Text className="workerCommand__loadingHintText">加载中…</Text>
            </View>
          ) : null}

          <View className="workerCommand__statsGrid">
            <View className="workerCommand__statsCard workerCommand__statsCard--income">
              <Text className="workerCommand__statsLabel">今日收益</Text>
              <View className="workerCommand__incomeRow">
                <Text className="workerCommand__incomeCurrency">¥</Text>
                <Text className="workerCommand__incomeValue">{incomeMain}</Text>
              </View>
              <Text className="workerCommand__statsTrend">{trendText}</Text>
            </View>

            <View className="workerCommand__statsCard workerCommand__statsCardFinish">
              <Text className="workerCommand__statsLabel">今日完成单</Text>
              <Text className="workerCommand__statsValue">
                {summary != null ? String(summary.completedOrdersToday) : "—"}
              </Text>
            </View>

            <View className="workerCommand__statsCard">
              <View className="workerCommand__statsCardFinish">
                <Text className="workerCommand__statsLabel">成功率</Text>
                <Text className="workerCommand__statsValue">
                  {summary != null ? `${summary.successRatePercent}%` : "—"}
                </Text>
              </View>
              <View className="workerCommand__progressTrack">
                <View
                  className="workerCommand__progressFill"
                  style={{
                    width: `${summary != null ? Math.min(100, Math.max(0, summary.successRatePercent)) : 0}%`
                  }}
                />
              </View>
            </View>
          </View>

          <View className="workerCommand__sectionHeader">
            <View className="workerCommand__sectionLeft">
              <Text className="workerCommand__sectionTitle">待处理订单</Text>
              <Text className="workerCommand__sectionCount">
                {!loading ? `${pendingOrders.length} Active` : "…"}
              </Text>
            </View>
            <View
              className="workerCommand__sectionLink"
              onClick={handleGoAllOrders}
              aria-label="查看全部订单"
            >
              <Text className="workerCommand__sectionLinkText">全部订单</Text>
              <Text className="workerCommand__sectionLinkArrow">›</Text>
            </View>
          </View>

          <View className="workerCommand__orderList">
            {!loading &&
              pendingOrders.map((order) => {
                const card = mapPendingCard(order);
                return (
                  <View key={card.id} className="workerCommand__orderCard">
                    <View className="workerCommand__orderMain">
                      <View className="workerCommand__orderTitleRow">
                        <Text className="workerCommand__orderTitle">{card.title}</Text>
                        <Text className="workerCommand__orderDifficulty">{card.difficulty}</Text>
                      </View>
                      <Text className="workerCommand__orderDesc">{card.requirement}</Text>
                      <View className="workerCommand__orderMeta">
                        <Text className="workerCommand__orderMetaItem">
                          ⏱ {card.remainTimeText}
                        </Text>
                        <Text className="workerCommand__orderMetaItem workerCommand__orderMetaItem--amount">
                          {card.amountText}
                        </Text>
                      </View>
                    </View>
                    <View
                      className="workerCommand__orderAction"
                      onClick={() => void handleStartOrder(card.id)}
                      aria-label={`执行${card.title}`}
                    >
                      <Text className="workerCommand__orderActionText">开始执行</Text>
                    </View>
                  </View>
                );
              })}
          </View>

          {!loading && pendingOrders.length === 0 ? (
            <View className="workerCommand__emptyPool">
              <Text className="workerCommand__emptyPoolText">暂无待接单订单</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <BottomBar role={role} activeKey="home" />

      <View
        className="workerCommand__roleSwitch"
        onClick={handleGoUserHome}
        aria-label="切换到用户端"
      >
        <Text className="workerCommand__roleSwitchText">用户端</Text>
      </View>
    </View>
  );
};

export default WorkerHomePage;
