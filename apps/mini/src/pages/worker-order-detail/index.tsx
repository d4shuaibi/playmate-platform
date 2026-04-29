import { View, Text, ScrollView } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { useCallback, useEffect, useState } from "react";
import "./index.scss";
import { getRole } from "../../utils/role";
import {
  completeWorkerOrder,
  fetchWorkerOrderDetail,
  startWorkerOrder,
  type WorkerOrderDetail,
  type WorkerOrderStage
} from "../../services/worker-workbench";

type WorkerProgressStep = {
  key: string;
  label: string;
  done: boolean;
  active: boolean;
};

type WorkerStatusPresentation = {
  title: string;
  description: string;
  sessionText: string;
};

const STAGE_PRESENTATION: Record<WorkerOrderStage, WorkerStatusPresentation> = {
  pool: {
    title: "待接单",
    description: "订单在池中等待打手接单，接单后将进入执行阶段。",
    sessionText: "WAITING POOL"
  },
  serving: {
    title: "进行中",
    description: "订单执行中，请按任务目标推进并保持与用户沟通。",
    sessionText: "ACTIVE SESSION"
  },
  pending_done: {
    title: "待验收",
    description: "您已提交完成，等待老板确认结单与结算。",
    sessionText: "WAITING CONFIRM"
  },
  done: {
    title: "已完成",
    description: "订单已完结，收益计入统计。如有争议请联系客服。",
    sessionText: "MISSION COMPLETE"
  }
};

/** 金额展示 */
const formatMoney = (amount: number): string => {
  const text = amount.toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return `¥ ${text}`;
};

/** 顶部进度条宽度 */
const lineWidthForStage = (stage: WorkerOrderStage): string => {
  if (stage === "pool") return "12%";
  if (stage === "serving") return "52%";
  if (stage === "pending_done") return "88%";
  return "100%";
};

/** 步骤条状态 */
const buildProgressSteps = (stage: WorkerOrderStage): WorkerProgressStep[] => {
  return [
    {
      key: "accept",
      label: "待处理",
      done: stage !== "pool",
      active: stage === "pool"
    },
    {
      key: "run",
      label: "进行中",
      done: stage === "serving" || stage === "pending_done" || stage === "done",
      active: stage === "serving"
    },
    {
      key: "finish",
      label: "已完成",
      done: stage === "done",
      active: stage === "pending_done" || stage === "done"
    }
  ];
};

const BOSS_STATUS_LABEL: Record<string, string> = {
  pendingPay: "待付款",
  pendingTake: "待接单",
  serving: "服务中",
  pendingDone: "待结单",
  done: "已完成",
  cancelled: "已取消"
};

const WorkerOrderDetailPage = () => {
  const role = getRole();
  const router = useRouter();
  const orderId = String(router.params?.id ?? "").trim();

  const [detail, setDetail] = useState<WorkerOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDetail = useCallback(async () => {
    if (!orderId) {
      setDetail(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const next = await fetchWorkerOrderDetail(orderId);
      setDetail(next);
    } catch (error: unknown) {
      setDetail(null);
      void Taro.showToast({
        title: error instanceof Error ? error.message : "加载失败",
        icon: "none"
      });
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  const handleContactService = () => {
    void Taro.navigateTo({
      url: `/pages/customer-service/index?from=worker-order-detail&id=${encodeURIComponent(orderId)}`
    });
  };

  const handleStartOrder = async () => {
    if (!detail || detail.workerStage !== "pool") return;
    try {
      const next = await startWorkerOrder(detail.id);
      setDetail(next);
      void Taro.showToast({ title: "已开始执行", icon: "success" });
    } catch (error: unknown) {
      void Taro.showToast({
        title: error instanceof Error ? error.message : "接单失败",
        icon: "none"
      });
    }
  };

  const handleConfirmDone = async () => {
    if (!detail || detail.workerStage !== "serving") return;
    try {
      const next = await completeWorkerOrder(detail.id);
      setDetail(next);
      void Taro.showToast({ title: "已提交完成", icon: "success" });
    } catch (error: unknown) {
      void Taro.showToast({
        title: error instanceof Error ? error.message : "提交失败",
        icon: "none"
      });
    }
  };

  if (role !== "worker") {
    void Taro.redirectTo({ url: "/pages/orders/index" });
    return <View className="workerOrderDetail" />;
  }

  if (!orderId) {
    return (
      <View className="workerOrderDetail">
        <Text className="workerOrderDetail__hint">缺少订单参数</Text>
      </View>
    );
  }

  if (loading || !detail) {
    return (
      <View className="workerOrderDetail">
        <Text className="workerOrderDetail__hint">{loading ? "加载中…" : "订单不可用"}</Text>
      </View>
    );
  }

  const stage = detail.workerStage;
  const statusInfo = STAGE_PRESENTATION[stage];
  const progressSteps = buildProgressSteps(stage);
  const lineWidth = lineWidthForStage(stage);

  const directives = detail.deliveries.map((d) => d.text).filter(Boolean);

  const renderPrimaryAction = () => {
    if (stage === "pool") {
      return (
        <View className="workerOrderDetail__primaryBtn" onClick={() => void handleStartOrder()}>
          <Text className="workerOrderDetail__primaryBtnText">开始接单</Text>
        </View>
      );
    }
    if (stage === "serving") {
      return (
        <View className="workerOrderDetail__primaryBtn" onClick={() => void handleConfirmDone()}>
          <Text className="workerOrderDetail__primaryBtnText">确认完成</Text>
        </View>
      );
    }
    if (stage === "pending_done") {
      return (
        <View className="workerOrderDetail__primaryBtn workerOrderDetail__primaryBtn--muted">
          <Text className="workerOrderDetail__primaryBtnText">等待老板结单</Text>
        </View>
      );
    }
    return (
      <View className="workerOrderDetail__primaryBtn workerOrderDetail__primaryBtn--muted">
        <Text className="workerOrderDetail__primaryBtnText">已完结</Text>
      </View>
    );
  };

  return (
    <View className="workerOrderDetail">
      <ScrollView className="workerOrderDetail__scroll" scrollY enhanced showScrollbar={false}>
        <View className="workerOrderDetail__statusSection">
          <View className="workerOrderDetail__progressWrap">
            <View className="workerOrderDetail__line">
              <View className="workerOrderDetail__lineFill" style={{ width: lineWidth }} />
            </View>
            <View className="workerOrderDetail__stepRow">
              {progressSteps.map((step) => (
                <View key={step.key} className="workerOrderDetail__stepItem">
                  <View
                    className={`workerOrderDetail__stepDot ${step.done ? "workerOrderDetail__stepDot--done" : ""} ${
                      step.active ? "workerOrderDetail__stepDot--active" : ""
                    }`}
                  />
                  <Text
                    className={`workerOrderDetail__stepText ${
                      step.active
                        ? "workerOrderDetail__stepText--active"
                        : step.done
                          ? "workerOrderDetail__stepText--done"
                          : ""
                    }`}
                  >
                    {step.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View className="workerOrderDetail__hero">
          <Text className="workerOrderDetail__heroTag">{statusInfo.sessionText}</Text>
          <View className="workerOrderDetail__heroMain">
            <View>
              <Text className="workerOrderDetail__heroTitle">{detail.serviceTitle}</Text>
              <Text className="workerOrderDetail__heroSubtitle">{detail.packageTag}</Text>
            </View>
            <View className="workerOrderDetail__incomeBlock">
              <Text className="workerOrderDetail__incomeLabel">预计收益</Text>
              <Text className="workerOrderDetail__incomeValue">{formatMoney(detail.amount)}</Text>
            </View>
          </View>
          <Text className="workerOrderDetail__heroStatus">{statusInfo.title}</Text>
          <Text className="workerOrderDetail__heroDesc">{statusInfo.description}</Text>
        </View>

        <View className="workerOrderDetail__section">
          <View className="workerOrderDetail__sectionTitleRow">
            <Text className="workerOrderDetail__sectionIcon">✓</Text>
            <Text className="workerOrderDetail__sectionTitle">任务目标</Text>
          </View>
          <View className="workerOrderDetail__directiveList">
            {directives.length === 0 ? (
              <Text className="workerOrderDetail__hintInline">暂无明细，参见商品说明</Text>
            ) : (
              directives.map((directive) => (
                <View key={directive} className="workerOrderDetail__directiveItem">
                  <View className="workerOrderDetail__directiveDot" />
                  <Text className="workerOrderDetail__directiveText">{directive}</Text>
                </View>
              ))
            )}
          </View>
        </View>

        <View className="workerOrderDetail__section">
          <View className="workerOrderDetail__sectionTitleRow">
            <Text className="workerOrderDetail__sectionIcon">ⓘ</Text>
            <Text className="workerOrderDetail__sectionTitle">订单信息</Text>
          </View>
          <View className="workerOrderDetail__kvRow">
            <Text className="workerOrderDetail__kvKey">订单编号</Text>
            <Text className="workerOrderDetail__kvValue">{detail.orderNo}</Text>
          </View>
          <View className="workerOrderDetail__kvRow">
            <Text className="workerOrderDetail__kvKey">分配时间</Text>
            <Text className="workerOrderDetail__kvValue">
              {detail.assignedAt?.trim() ? detail.assignedAt : "尚未接单"}
            </Text>
          </View>
          <View className="workerOrderDetail__kvRow">
            <Text className="workerOrderDetail__kvKey">服务类型</Text>
            <Text className="workerOrderDetail__serviceType">{detail.packageTag}</Text>
          </View>
          <View className="workerOrderDetail__kvRow">
            <Text className="workerOrderDetail__kvKey">老板端状态</Text>
            <Text className="workerOrderDetail__kvValue">
              {BOSS_STATUS_LABEL[detail.status] ?? detail.status}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View className="workerOrderDetail__footer">
        <View
          className="workerOrderDetail__secondaryBtn"
          onClick={handleContactService}
          aria-label="联系客服"
        >
          <Text className="workerOrderDetail__secondaryBtnText">联系客服</Text>
        </View>
        {renderPrimaryAction()}
      </View>
    </View>
  );
};

export default WorkerOrderDetailPage;
