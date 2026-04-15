import { View, Text, ScrollView } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useMemo, useState } from "react";
import "./index.scss";
import { BottomBar } from "../../components/bottom-bar/BottomBar";
import { getRole } from "../../utils/role";

type WorkerOrderStatusKey = "processing" | "completed" | "all";

type WorkerOrderTab = {
  key: WorkerOrderStatusKey;
  label: string;
};

type WorkerOrderCard = {
  id: string;
  statusKey: Exclude<WorkerOrderStatusKey, "all">;
  statusLabel: string;
  serviceTitle: string;
  targetText: string;
  amountText: string;
  dueText: string;
  actionLabel: string;
};

const mockWorkerTabs: WorkerOrderTab[] = [
  // TODO(backend): 打手端订单筛选项（进行中/已完成/全部）由后端枚举返回
  { key: "processing", label: "进行中" },
  { key: "completed", label: "已完成" },
  { key: "all", label: "全部" }
];

const mockWorkerOrders: WorkerOrderCard[] = [
  // TODO(backend): 打手端订单列表接口（服务内容/任务目标/收益金额/截止时间/状态）
  {
    id: "w-o1",
    statusKey: "processing",
    statusLabel: "处理中",
    serviceTitle: "红卡提取",
    targetText: "实验室核心区域红卡 2张",
    amountText: "¥ 450.00",
    dueText: "截止: 2023.10.24 23:00",
    actionLabel: "查看详情"
  },
  {
    id: "w-o2",
    statusKey: "processing",
    statusLabel: "处理中",
    serviceTitle: "段位冲刺",
    targetText: "青铜 I 升至 黄金 III",
    amountText: "¥ 1,200.00",
    dueText: "截止: 2023.10.26 12:00",
    actionLabel: "查看详情"
  },
  {
    id: "w-o3",
    statusKey: "completed",
    statusLabel: "已完成",
    serviceTitle: "全图收集",
    targetText: "森林地图全点位点亮",
    amountText: "¥ 280.00",
    dueText: "完成于: 2023.10.20",
    actionLabel: "查看详情"
  }
];

const WorkerOrdersPage = () => {
  const role = getRole();
  const [workerActiveTab, setWorkerActiveTab] = useState<WorkerOrderStatusKey>("processing");

  if (role !== "worker") {
    void Taro.redirectTo({ url: "/pages/orders/index" });
    return <View className="ordersWorker" />;
  }

  const visibleWorkerOrders = useMemo(() => {
    if (workerActiveTab === "all") {
      return mockWorkerOrders;
    }
    return mockWorkerOrders.filter((order) => order.statusKey === workerActiveTab);
  }, [workerActiveTab]);

  const handleWorkerOrderAction = (order: WorkerOrderCard) => {
    // TODO(backend): 后续接入真实详情接口参数（如任务类型、阶段、来源场景）
    void Taro.navigateTo({
      url: `/pages/worker-order-detail/index?id=${encodeURIComponent(order.id)}&status=${encodeURIComponent(order.statusKey)}`
    });
  };

  return (
    <View className="ordersWorker">
      <ScrollView className="ordersWorker__scroll" scrollY enhanced showScrollbar={false}>
        <View className="ordersWorker__body">
          <ScrollView className="ordersWorker__tabs" scrollX enhanced showScrollbar={false}>
            <View className="ordersWorker__tabsInner">
              {mockWorkerTabs.map((tab) => {
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
                      {tab.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </ScrollView>

          <View className="ordersWorker__list">
            {visibleWorkerOrders.map((order) => {
              const isCompleted = order.statusKey === "completed";
              return (
                <View
                  key={order.id}
                  className={`ordersWorker__card ${isCompleted ? "ordersWorker__card--completed" : ""}`}
                  onClick={() => handleWorkerOrderAction(order)}
                  aria-label={`打手订单${order.serviceTitle}`}
                >
                  <View className="ordersWorker__statusRow">
                    <View className="ordersWorker__statusWrap">
                      <View className="ordersWorker__statusDot" />
                      <Text
                        className={`ordersWorker__statusText ${isCompleted ? "ordersWorker__statusText--completed" : ""}`}
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
                        className={`ordersWorker__amount ${isCompleted ? "ordersWorker__amount--completed" : ""}`}
                      >
                        {order.amountText}
                      </Text>
                    </View>
                  </View>

                  <View className="ordersWorker__footer">
                    <Text className="ordersWorker__dueText">{order.dueText}</Text>
                    {!isCompleted ? (
                      <View className="ordersWorker__detailBtn">
                        <Text className="ordersWorker__detailBtnText">{order.actionLabel}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <BottomBar role={role} activeKey="orders" />
    </View>
  );
};

export default WorkerOrdersPage;
