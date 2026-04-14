import { View, Text, ScrollView, Input } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useMemo, useState } from "react";
import "./index.scss";
import { BottomBar } from "../../components/bottom-bar/BottomBar";
import { getRole } from "../../utils/role";

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

type OrderCard = {
  id: string;
  orderNo: string;
  statusKey: Exclude<OrderStatusKey, "all">;
  statusLabel: string;
  title: string;
  createdAtText: string;
  amountText: string;
  planText: string;
  accent: "primary" | "secondary" | "error" | "neutral";
  actionLabel: string;
};

const mockTabs: OrderTab[] = [
  // TODO(backend): 后端返回订单状态枚举与数量
  { key: "all", label: "全部" },
  { key: "pendingPay", label: "待付款" },
  { key: "pendingTake", label: "待接单" },
  { key: "serving", label: "服务中" },
  { key: "pendingDone", label: "待结单" },
  { key: "cancelled", label: "已取消" }
];

const mockOrders: OrderCard[] = [
  // TODO(backend): 订单列表接口：订单号/状态/标题/下单时间/金额/套餐/封面图/可执行操作等
  {
    id: "o1",
    orderNo: "ORD-8829-X",
    statusKey: "serving",
    statusLabel: "服务中",
    title: "暗区突围：全地图红卡带出",
    createdAtText: "下单时间：2023.11.24 14:30",
    amountText: "¥ 2,899.00",
    planText: "至尊服务",
    accent: "secondary",
    actionLabel: "查看详情"
  },
  {
    id: "o2",
    orderNo: "ORD-7741-K",
    statusKey: "pendingPay",
    statusLabel: "待付款",
    title: "使命召唤：现代战争 III 全皮肤解锁",
    createdAtText: "下单时间：2023.11.24 12:15",
    amountText: "¥ 599.00",
    planText: "标准套餐",
    accent: "primary",
    actionLabel: "去支付"
  },
  {
    id: "o3",
    orderNo: "ORD-6620-M",
    statusKey: "pendingTake",
    statusLabel: "待接单",
    title: "英雄联盟：S14 赛季全区大师直达",
    createdAtText: "下单时间：2023.11.23 21:00",
    amountText: "¥ 1,200.00",
    planText: "精英服务",
    accent: "neutral",
    actionLabel: "查看详情"
  },
  {
    id: "o4",
    orderNo: "ORD-5512-Z",
    statusKey: "cancelled",
    statusLabel: "已取消",
    title: "绝地求生：百强选手组队带打",
    createdAtText: "下单时间：2023.11.23 18:45",
    amountText: "¥ 150.00",
    planText: "团队护航",
    accent: "error",
    actionLabel: "查看详情"
  }
];

const OrdersPage = () => {
  const role = getRole();
  const [activeTab, setActiveTab] = useState<OrderStatusKey>("all");
  const [keyword, setKeyword] = useState("");

  const visibleOrders = useMemo(() => {
    const byTab =
      activeTab === "all" ? mockOrders : mockOrders.filter((o) => o.statusKey === activeTab);
    const trimmed = keyword.trim();
    if (!trimmed) return byTab;
    return byTab.filter((o) => o.orderNo.includes(trimmed) || o.title.includes(trimmed));
  }, [activeTab, keyword]);

  const handleAction = (order: OrderCard) => {
    // TODO(backend): 跳转订单详情 / 拉起支付 / 取消订单等
    void Taro.showToast({ title: `${order.actionLabel}：${order.orderNo}`, icon: "none" });
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
            {mockTabs.map((tab) => {
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
                    {tab.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </ScrollView>

        <View className="ordersPage__list">
          {visibleOrders.map((o) => (
            <View
              key={o.id}
              className={`ordersPage__card ordersPage__card--${o.accent}`}
              onClick={() => handleAction(o)}
              aria-label={`订单：${o.orderNo}`}
            >
              <View className="ordersPage__cardMain">
                <View className="ordersPage__cover">
                  <Text className="ordersPage__coverText">▣</Text>
                </View>
                <View className="ordersPage__info">
                  <View className="ordersPage__infoTop">
                    <Text className="ordersPage__orderNo">{o.orderNo}</Text>
                    <View className={`ordersPage__statusChip ordersPage__statusChip--${o.accent}`}>
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
                    handleAction(o);
                  }}
                >
                  <Text className="ordersPage__actionText">{o.actionLabel}</Text>
                </View>
              </View>
            </View>
          ))}

          {visibleOrders.length === 0 ? (
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
