import { View, Text, ScrollView } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import "./index.scss";
import { getRole } from "../../utils/role";

type WorkerOrderRuntimeStatus = "processing" | "completed";

type WorkerProgressStep = {
  key: string;
  label: string;
  done: boolean;
  active: boolean;
};

type WorkerOrderDetailData = {
  orderNo: string;
  assignedAt: string;
  serviceType: string;
  missionTitle: string;
  missionSubtitle: string;
  expectedIncome: string;
  directives: string[];
};

type WorkerStatusPresentation = {
  title: string;
  description: string;
  sessionText: string;
};

// TODO(backend): 接入打手端订单详情接口（订单号、状态、收益、任务目标、分配时间等）
const mockWorkerOrderDetail: WorkerOrderDetailData = {
  orderNo: "ORD-20231024-8892",
  assignedAt: "2023-10-24 14:30:22",
  serviceType: "高级陪玩",
  missionTitle: "绝密保底带出",
  missionSubtitle: "暗区突围 · 专业打手服务",
  expectedIncome: "¥120.00",
  directives: ["带出指定稀有物资 (400-1000万价值)", "满配装备及弹药补给", "角色技能等级提升"]
};

const WORKER_STATUS_PRESENTATION: Record<WorkerOrderRuntimeStatus, WorkerStatusPresentation> = {
  processing: {
    title: "进行中",
    description: "订单执行中，请按任务目标推进并保持和用户沟通。",
    sessionText: "ACTIVE SESSION"
  },
  completed: {
    title: "已完成",
    description: "订单已完成，等待系统最终结算。若有争议请及时联系客服。",
    sessionText: "MISSION COMPLETE"
  }
};

const WorkerOrderDetailPage = () => {
  const role = getRole();
  const router = useRouter();
  const orderId = String(router.params?.id ?? "");
  const rawStatus = String(router.params?.status ?? "processing");
  const runtimeStatus: WorkerOrderRuntimeStatus =
    rawStatus === "completed" ? "completed" : "processing";

  if (role !== "worker") {
    void Taro.redirectTo({ url: "/pages/orders/index" });
    return <View className="workerOrderDetail" />;
  }

  const statusInfo = WORKER_STATUS_PRESENTATION[runtimeStatus];
  const progressSteps: WorkerProgressStep[] = [
    { key: "pending", label: "待处理", done: true, active: runtimeStatus !== "completed" },
    { key: "processing", label: "进行中", done: true, active: runtimeStatus !== "completed" },
    {
      key: "completed",
      label: "已完成",
      done: runtimeStatus === "completed",
      active: runtimeStatus === "completed"
    }
  ];
  const lineWidth = runtimeStatus === "completed" ? "100%" : "50%";

  const handleContactService = () => {
    // TODO(backend): 将订单ID透传客服系统，建立打手端工单会话
    void Taro.navigateTo({
      url: `/pages/customer-service/index?from=worker-order-detail&id=${encodeURIComponent(orderId || "mock-worker-order")}`
    });
  };

  const handleConfirmDone = () => {
    // TODO(backend): 调用打手端确认完成接口，提交结果并等待验收/结算
    void Taro.showToast({ title: "确认完成（Mock）", icon: "none" });
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
              <Text className="workerOrderDetail__heroTitle">
                {mockWorkerOrderDetail.missionTitle}
              </Text>
              <Text className="workerOrderDetail__heroSubtitle">
                {mockWorkerOrderDetail.missionSubtitle}
              </Text>
            </View>
            <View className="workerOrderDetail__incomeBlock">
              <Text className="workerOrderDetail__incomeLabel">预计收益</Text>
              <Text className="workerOrderDetail__incomeValue">
                {mockWorkerOrderDetail.expectedIncome}
              </Text>
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
            {mockWorkerOrderDetail.directives.map((directive) => (
              <View key={directive} className="workerOrderDetail__directiveItem">
                <View className="workerOrderDetail__directiveDot" />
                <Text className="workerOrderDetail__directiveText">{directive}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className="workerOrderDetail__section">
          <View className="workerOrderDetail__sectionTitleRow">
            <Text className="workerOrderDetail__sectionIcon">ⓘ</Text>
            <Text className="workerOrderDetail__sectionTitle">订单信息</Text>
          </View>
          <View className="workerOrderDetail__kvRow">
            <Text className="workerOrderDetail__kvKey">订单编号</Text>
            <Text className="workerOrderDetail__kvValue">{mockWorkerOrderDetail.orderNo}</Text>
          </View>
          <View className="workerOrderDetail__kvRow">
            <Text className="workerOrderDetail__kvKey">分配时间</Text>
            <Text className="workerOrderDetail__kvValue">{mockWorkerOrderDetail.assignedAt}</Text>
          </View>
          <View className="workerOrderDetail__kvRow">
            <Text className="workerOrderDetail__kvKey">服务类型</Text>
            <Text className="workerOrderDetail__serviceType">
              {mockWorkerOrderDetail.serviceType}
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
        <View
          className="workerOrderDetail__primaryBtn"
          onClick={handleConfirmDone}
          aria-label="确认完成"
        >
          <Text className="workerOrderDetail__primaryBtnText">确认完成</Text>
        </View>
      </View>
    </View>
  );
};

export default WorkerOrderDetailPage;
