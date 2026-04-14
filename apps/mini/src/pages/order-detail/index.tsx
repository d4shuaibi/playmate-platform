import { View, Text, ScrollView, Image } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import "./index.scss";

type ProgressStep = {
  key: string;
  label: string;
  done: boolean;
};

type OrderRuntimeStatus =
  | "pendingPay"
  | "pendingTake"
  | "serving"
  | "pendingDone"
  | "done"
  | "cancelled";

type DeliveryItem = {
  id: string;
  text: string;
  done: boolean;
};

type OrderDetailData = {
  orderNo: string;
  packageTag: string;
  serviceTitle: string;
  amountText: string;
  quantityText: string;
  coverImage: string;
  createdAt: string;
  payMethod: string;
  paidAmount: string;
  progress: ProgressStep[];
  deliveries: DeliveryItem[];
};

type StatusPresentation = {
  statusText: string;
  statusDesc: string;
  sessionText: string;
};

// TODO(backend): 接入订单详情接口（根据订单ID返回状态、商品信息、进度、金额、支付信息）
const mockOrderDetail: OrderDetailData = {
  orderNo: "CN-2023082499102",
  packageTag: "Premium Package",
  serviceTitle: "绝密保底：400-1000万",
  amountText: "¥899.00",
  quantityText: "× 1 套服务",
  coverImage:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDYi_2hfQ_QdmpZ6R0mEIRmCWANryQA3XfuFHRAshY17FNjeqygj4SItHwCbhseAOQYktoTId8sfzwAndrUsafJXNXzp30xQMB3VMxOeDcysbav0fMG1fXmLNFfkZaH__ly4KkLomU6q3tN0ljl3kdV44q7QkW67QmQuLbkDEPovMEWPHTu7yT_Vwbk2-9GgOhOSorTrrv1cCSqxCZMw-Dc06d256Yzx6naV6K9vwg1-JsOA9OehopSCDGbkvn_r9ZrGpV3o0XskdA",
  createdAt: "2023.08.24 14:30:15",
  payMethod: "极氪代币支付",
  paidAmount: "¥ 899.00",
  progress: [],
  deliveries: [
    { id: "d1", text: "绝密红卡 (400-1000万价值)", done: true },
    { id: "d2", text: "全套满配装备 & 弹药补给", done: true },
    { id: "d3", text: "角色技能等级经验提升", done: false }
  ]
};

const PROGRESS_TEMPLATE: Array<Omit<ProgressStep, "done">> = [
  { key: "pendingTake", label: "待接单" },
  { key: "serving", label: "进行中" },
  { key: "pendingDone", label: "待验收" },
  { key: "done", label: "已完成" }
];

const STATUS_STAGE_INDEX: Record<OrderRuntimeStatus, number> = {
  pendingPay: -1,
  pendingTake: 0,
  serving: 1,
  pendingDone: 2,
  done: 3,
  cancelled: -1
};

const STATUS_PRESENTATION: Record<OrderRuntimeStatus, StatusPresentation> = {
  pendingPay: {
    statusText: "待付款",
    statusDesc: "订单尚未完成支付，请尽快支付以便安排陪玩接单。",
    sessionText: "PENDING PAYMENT"
  },
  pendingTake: {
    statusText: "待接单",
    statusDesc: "已提交订单，系统正在为您匹配可用陪玩，请耐心等待。",
    sessionText: "MATCHING AGENT"
  },
  serving: {
    statusText: "进行中",
    statusDesc: "专业陪玩正在全力为您获取预期战利品，请保持通信畅通。",
    sessionText: "ACTIVE SESSION"
  },
  pendingDone: {
    statusText: "待验收",
    statusDesc: "服务已完成，请及时确认结果，确认后订单将进入已完成状态。",
    sessionText: "WAITING CONFIRM"
  },
  done: {
    statusText: "已完成",
    statusDesc: "订单已完成，感谢使用。欢迎再次下单继续体验高阶服务。",
    sessionText: "MISSION COMPLETE"
  },
  cancelled: {
    statusText: "已取消",
    statusDesc: "该订单已取消，如需继续服务可重新下单。",
    sessionText: "ORDER CLOSED"
  }
};

const OrderDetailPage = () => {
  const router = useRouter();
  const orderId = String(router.params?.id ?? "");
  const rawStatus = String(router.params?.status ?? "serving");
  const runtimeStatus: OrderRuntimeStatus =
    rawStatus in STATUS_STAGE_INDEX ? (rawStatus as OrderRuntimeStatus) : "serving";
  const stageIndex = STATUS_STAGE_INDEX[runtimeStatus];
  const statusInfo = STATUS_PRESENTATION[runtimeStatus];
  const progressSteps: ProgressStep[] = PROGRESS_TEMPLATE.map((step, index) => ({
    ...step,
    done: stageIndex >= 0 && index <= stageIndex
  }));
  const progressWidth =
    stageIndex <= 0 ? "0%" : `${Math.max((stageIndex / (PROGRESS_TEMPLATE.length - 1)) * 100, 0)}%`;

  const handleCopyOrderNo = () => {
    // TODO(backend): 如有脱敏策略，改为后端返回可复制的展示单号
    void Taro.setClipboardData({ data: mockOrderDetail.orderNo });
  };

  const handleApplyRefund = () => {
    // TODO(backend): 接入退款申请接口/退款申请页
    void Taro.showToast({ title: "申请退款（Mock）", icon: "none" });
  };

  const handleContactService = () => {
    // TODO(backend): 透传订单ID到客服系统，建立关联会话
    void Taro.navigateTo({
      url: `/pages/customer-service/index?from=order-detail&id=${encodeURIComponent(orderId || "mock-order")}`
    });
  };

  return (
    <View className="orderDetail">
      <ScrollView className="orderDetail__scroll" scrollY enhanced showScrollbar={false}>
        <View className="orderDetail__section orderDetail__statusSection">
          <View className="orderDetail__sessionTag">
            <View className="orderDetail__sessionDot" />
            <Text className="orderDetail__sessionText">{statusInfo.sessionText}</Text>
          </View>
          <Text className="orderDetail__statusTitle">{statusInfo.statusText}</Text>
          <Text className="orderDetail__statusDesc">{statusInfo.statusDesc}</Text>

          <View className="orderDetail__progressWrap">
            <View className="orderDetail__progressLine">
              <View className="orderDetail__progressLineFill" style={{ width: progressWidth }} />
            </View>
            <View className="orderDetail__progressRow">
              {progressSteps.map((step) => (
                <View key={step.key} className="orderDetail__progressItem">
                  <View
                    className={`orderDetail__progressDot ${step.done ? "orderDetail__progressDot--done" : ""}`}
                  />
                  <Text
                    className={`orderDetail__progressLabel ${
                      step.done ? "orderDetail__progressLabel--done" : ""
                    }`}
                  >
                    {step.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View className="orderDetail__section orderDetail__productSection">
          <View className="orderDetail__coverWrap">
            <Image
              className="orderDetail__cover"
              src={mockOrderDetail.coverImage}
              mode="aspectFill"
            />
            <View className="orderDetail__coverMask" />
            <View className="orderDetail__coverMeta">
              <Text className="orderDetail__packageTag">{mockOrderDetail.packageTag}</Text>
              <Text className="orderDetail__serviceTitle">{mockOrderDetail.serviceTitle}</Text>
              <Text className="orderDetail__serviceAmount">{mockOrderDetail.amountText}</Text>
            </View>
          </View>
          <View className="orderDetail__productBottom">
            <View>
              <Text className="orderDetail__smallLabel">Quantity</Text>
              <Text className="orderDetail__quantity">{mockOrderDetail.quantityText}</Text>
            </View>
            <View className="orderDetail__badgeStack">
              <View className="orderDetail__badge orderDetail__badge--mvp">MVP</View>
              <View className="orderDetail__badge orderDetail__badge--pro">PRO</View>
            </View>
          </View>
        </View>

        <View className="orderDetail__deliveryWrap">
          <View className="orderDetail__deliveryHeader">
            <Text className="orderDetail__smallLabel">预期结果交付</Text>
            <Text className="orderDetail__liveText">LIVE UPDATE</Text>
          </View>
          <View className="orderDetail__section orderDetail__deliverySection">
            {mockOrderDetail.deliveries.map((item) => (
              <View key={item.id} className="orderDetail__deliveryItem">
                <Text
                  className={`orderDetail__deliveryDot ${item.done ? "orderDetail__deliveryDot--done" : ""}`}
                >
                  •
                </Text>
                <Text className="orderDetail__deliveryText">{item.text}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className="orderDetail__section orderDetail__manifestSection">
          <View className="orderDetail__manifestTitleRow">
            <Text className="orderDetail__manifestIcon">ⓘ</Text>
            <Text className="orderDetail__smallLabel">Order Manifest</Text>
          </View>

          <View
            className="orderDetail__kvRow"
            onClick={handleCopyOrderNo}
            aria-label="复制订单编号"
          >
            <Text className="orderDetail__kvKey">订单编号</Text>
            <View className="orderDetail__kvValueWrap">
              <Text className="orderDetail__kvValue">{mockOrderDetail.orderNo}</Text>
              <Text className="orderDetail__copyIcon">⧉</Text>
            </View>
          </View>

          <View className="orderDetail__kvRow">
            <Text className="orderDetail__kvKey">下单时间</Text>
            <Text className="orderDetail__kvValue">{mockOrderDetail.createdAt}</Text>
          </View>

          <View className="orderDetail__kvRow">
            <Text className="orderDetail__kvKey">支付方式</Text>
            <Text className="orderDetail__kvValue">{mockOrderDetail.payMethod}</Text>
          </View>

          <View className="orderDetail__totalRow">
            <Text className="orderDetail__totalLabel">实付金额</Text>
            <Text className="orderDetail__totalValue">{mockOrderDetail.paidAmount}</Text>
          </View>
        </View>
      </ScrollView>

      <View className="orderDetail__footer">
        <View
          className="orderDetail__secondaryBtn"
          onClick={handleApplyRefund}
          aria-label="申请退款"
        >
          <Text className="orderDetail__secondaryBtnText">申请退款</Text>
        </View>
        <View
          className="orderDetail__primaryBtn"
          onClick={handleContactService}
          aria-label="联系客服"
        >
          <Text className="orderDetail__primaryBtnText">联系客服</Text>
        </View>
      </View>
    </View>
  );
};

export default OrderDetailPage;
