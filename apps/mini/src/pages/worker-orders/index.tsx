import { View, Text, ScrollView } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./index.scss";
import { BottomBar } from "../../components/bottom-bar/BottomBar";
import { getRole } from "../../utils/role";
import type { MiniOrder, MiniOrderStatus } from "../../services/orders";
import {
  fetchWorkerOrders,
  type WorkerOrderBucket,
  type WorkerOrderTabCounts
} from "../../services/worker-workbench";

type WorkerOrderTab = {
  key: WorkerOrderBucket;
  label: string;
};

type WorkerOrderCard = {
  id: string;
  statusKey: MiniOrderStatus;
  statusLabel: string;
  serviceTitle: string;
  targetText: string;
  amountText: string;
  dueText: string;
  actionLabel: string;
  isCompleted: boolean;
};

const TAB_DEFS: WorkerOrderTab[] = [
  { key: "processing", label: "进行中" },
  { key: "completed", label: "已完成" },
  { key: "all", label: "全部" }
];

const EMPTY_COUNTS: WorkerOrderTabCounts = {
  processing: 0,
  completed: 0,
  all: 0
};

/** 打手列表展示用状态文案（与老板端枚举映射） */
const workerRowStatusLabel = (status: MiniOrderStatus): string => {
  if (status === "serving") return "处理中";
  if (status === "pendingDone") return "待验收";
  if (status === "done") return "已完成";
  return "";
};

/** 金额展示 */
const formatMoney = (amount: number): string => {
  const text = amount.toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return `¥ ${text}`;
};

/** 截止时间 / 完成时间展示 */
const formatDueLine = (order: MiniOrder): string => {
  if (order.status === "done" && order.completedAt?.trim()) {
    try {
      const d = new Date(order.completedAt);
      return `完成于: ${d.toLocaleString("zh-CN")}`;
    } catch {
      return `完成于: ${order.completedAt}`;
    }
  }
  if (order.assignedAt?.trim()) return `接单时间: ${order.assignedAt}`;
  return `下单: ${order.createdAt}`;
};

/** 接口订单 → 卡片模型 */
const mapToCard = (order: MiniOrder): WorkerOrderCard => {
  const isCompleted = order.status === "done";
  return {
    id: order.id,
    statusKey: order.status,
    statusLabel: workerRowStatusLabel(order.status),
    serviceTitle: order.serviceTitle,
    targetText: order.deliveries[0]?.text ?? order.packageTag,
    amountText: formatMoney(order.amount),
    dueText: formatDueLine(order),
    actionLabel: "查看详情",
    isCompleted
  };
};

const formatTabLabel = (tab: WorkerOrderTab, counts: WorkerOrderTabCounts): string => {
  const n =
    tab.key === "processing"
      ? counts.processing
      : tab.key === "completed"
        ? counts.completed
        : counts.all;
  return `${tab.label} (${n})`;
};

const WorkerOrdersPage = () => {
  const role = getRole();
  const [workerActiveTab, setWorkerActiveTab] = useState<WorkerOrderBucket>("processing");
  const [orders, setOrders] = useState<MiniOrder[]>([]);
  const [counts, setCounts] = useState<WorkerOrderTabCounts>(EMPTY_COUNTS);
  const [loading, setLoading] = useState(false);
  const skipDidShowOnceRef = useRef(true);

  const cards = useMemo(() => orders.map(mapToCard), [orders]);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchWorkerOrders({
        bucket: workerActiveTab,
        page: 1,
        pageSize: 50
      });
      setOrders(data.items);
      setCounts(data.counts);
    } catch (error: unknown) {
      void Taro.showToast({
        title: error instanceof Error ? error.message : "加载失败",
        icon: "none"
      });
    } finally {
      setLoading(false);
    }
  }, [workerActiveTab]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  useDidShow(() => {
    if (skipDidShowOnceRef.current) {
      skipDidShowOnceRef.current = false;
      return;
    }
    void loadOrders();
  });

  const handleWorkerOrderAction = (order: WorkerOrderCard) => {
    void Taro.navigateTo({
      url: `/pages/worker-order-detail/index?id=${encodeURIComponent(order.id)}`
    });
  };

  if (role !== "worker") {
    void Taro.redirectTo({ url: "/pages/orders/index" });
    return <View className="ordersWorker" />;
  }

  return (
    <View className="ordersWorker">
      <ScrollView className="ordersWorker__scroll" scrollY enhanced showScrollbar={false}>
        <View className="ordersWorker__body">
          <ScrollView className="ordersWorker__tabs" scrollX enhanced showScrollbar={false}>
            <View className="ordersWorker__tabsInner">
              {TAB_DEFS.map((tab) => {
                const isActive = tab.key === workerActiveTab;
                return (
                  <View
                    key={tab.key}
                    className={`ordersWorker__tab ${isActive ? "ordersWorker__tab--active" : ""}`}
                    onClick={() => setWorkerActiveTab(tab.key)}
                    aria-label={`筛选${tab.label}订单`}
                  >
                    <Text
                      className={`ordersWorker__tabText ${isActive ? "ordersWorker__tabText--active" : ""}`}
                    >
                      {formatTabLabel(tab, counts)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </ScrollView>

          {loading ? (
            <View className="ordersWorker__empty">
              <Text className="ordersWorker__emptyText">加载中…</Text>
            </View>
          ) : null}

          <View className="ordersWorker__list">
            {!loading &&
              cards.map((order) => (
                <View
                  key={order.id}
                  className={`ordersWorker__card ${order.isCompleted ? "ordersWorker__card--completed" : ""}`}
                  onClick={() => handleWorkerOrderAction(order)}
                  aria-label={`打手订单${order.serviceTitle}`}
                >
                  <View className="ordersWorker__statusRow">
                    <View className="ordersWorker__statusWrap">
                      <View className="ordersWorker__statusDot" />
                      <Text
                        className={`ordersWorker__statusText ${order.isCompleted ? "ordersWorker__statusText--completed" : ""}`}
                      >
                        {order.statusLabel}
                      </Text>
                    </View>
                  </View>

                  <View className="ordersWorker__block">
                    <Text className="ordersWorker__blockLabel">服务内容</Text>
                    <Text className="ordersWorker__title">{order.serviceTitle}</Text>
                  </View>

                  <View className="ordersWorker__metaGrid">
                    <View>
                      <Text className="ordersWorker__blockLabel">任务目标</Text>
                      <Text className="ordersWorker__target">{order.targetText}</Text>
                    </View>
                    <View className="ordersWorker__amountBox">
                      <Text className="ordersWorker__blockLabel">收益金额</Text>
                      <Text
                        className={`ordersWorker__amount ${order.isCompleted ? "ordersWorker__amount--completed" : ""}`}
                      >
                        {order.amountText}
                      </Text>
                    </View>
                  </View>

                  <View className="ordersWorker__footer">
                    <Text className="ordersWorker__dueText">{order.dueText}</Text>
                    {!order.isCompleted ? (
                      <View className="ordersWorker__detailBtn">
                        <Text className="ordersWorker__detailBtnText">{order.actionLabel}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              ))}

            {!loading && cards.length === 0 ? (
              <View className="ordersWorker__empty">
                <Text className="ordersWorker__emptyText">暂无订单</Text>
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>

      <BottomBar role={role} activeKey="orders" />
    </View>
  );
};

export default WorkerOrdersPage;
