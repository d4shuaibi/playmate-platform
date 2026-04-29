import { View, Text, ScrollView, Input, Image } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./index.scss";
import { BottomBar } from "../../components/bottom-bar/BottomBar";
import { getRole } from "../../utils/role";
import {
  fetchMiniOrders,
  type MiniOrder,
  type MiniOrderStatus,
  type MiniOrderTabCounts
} from "../../services/orders";

type OrderStatusKey =
  | "all"
  | "pendingPay"
  | "pendingTake"
  | "serving"
  | "pendingDone"
  | "cancelled";

type OrderTab = {
  key: OrderStatusKey;
  label: string;
};

type OrderAccent = "primary" | "secondary" | "error" | "neutral";

type OrderCard = {
  id: string;
  orderNo: string;
  statusKey: MiniOrderStatus;
  statusLabel: string;
  title: string;
  createdAtText: string;
  amountText: string;
  planText: string;
  accent: OrderAccent;
  actionLabel: string;
  coverImage: string;
};

const TAB_DEFS: OrderTab[] = [
  { key: "all", label: "全部" },
  { key: "pendingPay", label: "待付款" },
  { key: "pendingTake", label: "待接单" },
  { key: "serving", label: "服务中" },
  { key: "pendingDone", label: "待结单" },
  { key: "cancelled", label: "已取消" }
];

const STATUS_LABEL: Record<MiniOrderStatus, string> = {
  pendingPay: "待付款",
  pendingTake: "待接单",
  serving: "服务中",
  pendingDone: "待结单",
  done: "已完成",
  cancelled: "已取消"
};

const EMPTY_COUNTS: MiniOrderTabCounts = {
  all: 0,
  pendingPay: 0,
  pendingTake: 0,
  serving: 0,
  pendingDone: 0,
  cancelled: 0,
  refundAfterSale: 0
};

/** 列表卡片左侧强调色 */
const resolveAccent = (status: MiniOrderStatus): OrderAccent => {
  if (status === "pendingPay") return "primary";
  if (status === "pendingTake") return "neutral";
  if (status === "serving" || status === "pendingDone") return "secondary";
  if (status === "cancelled") return "error";
  return "neutral";
};

/** 金额展示（元） */
const formatMoney = (amount: number): string => {
  const text = amount.toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return `¥ ${text}`;
};

/** 将接口订单映射为卡片展示模型 */
const mapOrderToCard = (order: MiniOrder): OrderCard => {
  const statusKey = order.status;
  const actionLabel = statusKey === "pendingPay" ? "去支付" : "查看详情";
  return {
    id: order.id,
    orderNo: order.orderNo,
    statusKey,
    statusLabel: STATUS_LABEL[statusKey],
    title: order.serviceTitle,
    createdAtText: `下单时间：${order.createdAt}`,
    amountText: formatMoney(order.amount),
    planText: order.packageTag,
    accent: resolveAccent(statusKey),
    actionLabel,
    coverImage: order.coverImage
  };
};

/** Tab 文案带上数量 */
const formatTabLabel = (tab: OrderTab, counts: MiniOrderTabCounts): string => {
  if (tab.key === "all") return `${tab.label} (${counts.all})`;
  const n = counts[tab.key];
  return `${tab.label} (${n})`;
};

const OrdersPage = () => {
  const role = getRole();
  const [activeTab, setActiveTab] = useState<OrderStatusKey>("all");
  const [keyword, setKeyword] = useState("");
  const [orders, setOrders] = useState<MiniOrder[]>([]);
  const [counts, setCounts] = useState<MiniOrderTabCounts>(EMPTY_COUNTS);
  const [loading, setLoading] = useState(false);
  const skipDidShowOnceRef = useRef(true);

  const cards = useMemo(() => orders.map(mapOrderToCard), [orders]);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const statusFilter = activeTab === "all" ? undefined : activeTab;
      const data = await fetchMiniOrders({
        keyword: keyword.trim(),
        status: statusFilter,
        page: 1,
        pageSize: 50
      });
      setOrders(data.items);
      setCounts(data.counts);
    } catch (error: unknown) {
      void Taro.showToast({
        title: error instanceof Error ? error.message : "加载订单失败",
        icon: "none"
      });
    } finally {
      setLoading(false);
    }
  }, [activeTab, keyword]);

  useEffect(() => {
    const delayMs = keyword.trim() ? 400 : 0;
    const timer = setTimeout(() => {
      void loadOrders();
    }, delayMs);
    return () => clearTimeout(timer);
  }, [loadOrders]);

  useDidShow(() => {
    if (skipDidShowOnceRef.current) {
      skipDidShowOnceRef.current = false;
      return;
    }
    void loadOrders();
  });

  const handleOpenDetail = (order: Pick<OrderCard, "id">) => {
    void Taro.navigateTo({
      url: `/pages/order-detail/index?id=${encodeURIComponent(order.id)}`
    });
  };

  if (role === "worker") {
    void Taro.redirectTo({ url: "/pages/worker-orders/index" });
    return <View className="ordersPage" />;
  }

  return (
    <View className="ordersPage">
      <ScrollView className="ordersPage__scroll" scrollY enhanced showScrollbar={false}>
        <View className="ordersPage__hero">
          <Text className="ordersPage__heroKicker">任务中心</Text>
          <View className="ordersPage__heroRow">
            <Text className="ordersPage__heroTitle">
              订单 <Text className="ordersPage__heroTitleAccent">历史</Text>
            </Text>
            <View className="ordersPage__search">
              <Text className="ordersPage__searchIcon">⌕</Text>
              <Input
                className="ordersPage__searchInput"
                value={keyword}
                onInput={(e) => setKeyword(String(e.detail.value ?? ""))}
                placeholder="搜索订单编号..."
                placeholderClass="ordersPage__searchPlaceholder"
              />
            </View>
          </View>
        </View>

        <ScrollView className="ordersPage__tabs" scrollX enhanced showScrollbar={false}>
          <View className="ordersPage__tabsInner">
            {TAB_DEFS.map((tab) => {
              const isActive = tab.key === activeTab;
              return (
                <View
                  key={tab.key}
                  className={`ordersPage__tab ${isActive ? "ordersPage__tab--active" : ""}`}
                  onClick={() => setActiveTab(tab.key)}
                  aria-label={`筛选：${tab.label}`}
                >
                  <Text
                    className={`ordersPage__tabText ${isActive ? "ordersPage__tabText--active" : ""}`}
                  >
                    {formatTabLabel(tab, counts)}
                  </Text>
                </View>
              );
            })}
          </View>
        </ScrollView>

        {loading ? (
          <View className="ordersPage__empty">
            <Text className="ordersPage__emptyText">加载中…</Text>
          </View>
        ) : null}

        <View className="ordersPage__list">
          {!loading &&
            cards.map((o) => (
              <View
                key={o.id}
                className={`ordersPage__card ordersPage__card--${o.accent}`}
                onClick={() => handleOpenDetail(o)}
                aria-label={`订单：${o.orderNo}`}
              >
                <View className="ordersPage__cardMain">
                  <View className="ordersPage__cover">
                    {o.coverImage ? (
                      <Image
                        className="ordersPage__coverImg"
                        src={o.coverImage}
                        mode="aspectFill"
                      />
                    ) : (
                      <Text className="ordersPage__coverText">▣</Text>
                    )}
                  </View>
                  <View className="ordersPage__info">
                    <View className="ordersPage__infoTop">
                      <Text className="ordersPage__orderNo">{o.orderNo}</Text>
                      <View
                        className={`ordersPage__statusChip ordersPage__statusChip--${o.accent}`}
                      >
                        <Text className="ordersPage__statusChipText">{o.statusLabel}</Text>
                      </View>
                    </View>
                    <Text className="ordersPage__title">{o.title}</Text>
                    <Text className="ordersPage__time">{o.createdAtText}</Text>
                  </View>
                </View>

                <View className="ordersPage__cardRight">
                  <View className="ordersPage__amountBlock">
                    <Text className="ordersPage__amount">{o.amountText}</Text>
                    <Text className="ordersPage__plan">{o.planText}</Text>
                  </View>
                  <View
                    className={`ordersPage__actionBtn ordersPage__actionBtn--${o.accent}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDetail(o);
                    }}
                  >
                    <Text className="ordersPage__actionText">{o.actionLabel}</Text>
                  </View>
                </View>
              </View>
            ))}

          {!loading && cards.length === 0 ? (
            <View className="ordersPage__empty">
              <Text className="ordersPage__emptyText">暂无订单，换个筛选项试试</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <BottomBar role={role} activeKey="orders" />
    </View>
  );
};

export default OrdersPage;
