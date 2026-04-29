import { View, Text, ScrollView, Image } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { useCallback, useEffect, useMemo, useState } from "react";
import "./index.scss";
import {
  confirmMiniOrderClose,
  fetchMiniOrderDetail,
  requestMiniOrderRefund,
  requestMiniWechatPrepay,
  type MiniOrder,
  type MiniOrderStatus,
  type MiniRefundStatus
} from "../../services/orders";

type ProgressStep = {
  key: string;
  label: string;
  done: boolean;
};

type StatusPresentation = {
  statusText: string;
  statusDesc: string;
  sessionText: string;
};

const STATUS_PRESENTATION: Record<MiniOrderStatus, StatusPresentation> = {
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
    statusDesc:
      "陪玩已提交完成，请您核对服务结果；确认无误后可点击下方「确认结单」结束订单（非实体发货场景）。",
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

/** 顶部进度条宽度（与接口返回的 progress 对齐） */
const computeProgressWidth = (steps: ProgressStep[]): string => {
  const lastDoneIndex = steps.reduce<number>((acc, step, index) => (step.done ? index : acc), -1);
  if (lastDoneIndex <= 0) return "0%";
  const denom = Math.max(steps.length - 1, 1);
  const pct = Math.min(100, (lastDoneIndex / denom) * 100);
  return `${pct}%`;
};

/** 金额展示（元） */
const formatMoney = (amount: number): string => {
  const text = amount.toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return `¥ ${text}`;
};

const OrderDetailPage = () => {
  const router = useRouter();
  const orderId = String(router.params?.id ?? "").trim();

  const [detail, setDetail] = useState<MiniOrder | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDetail = useCallback(async () => {
    if (!orderId) {
      setDetail(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const next = await fetchMiniOrderDetail(orderId);
      setDetail(next);
    } catch (error: unknown) {
      setDetail(null);
      void Taro.showToast({
        title: error instanceof Error ? error.message : "加载订单失败",
        icon: "none"
      });
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  const runtimeStatus = detail?.status ?? "pendingPay";
  const statusInfo = STATUS_PRESENTATION[runtimeStatus];
  const progressSteps: ProgressStep[] =
    detail?.progress?.map((step) => ({
      key: step.key,
      label: step.label,
      done: Boolean(step.done)
    })) ?? [];

  const progressWidth = useMemo(() => computeProgressWidth(progressSteps), [progressSteps]);

  const refundLabelForStatus = (status: MiniRefundStatus): string => {
    if (status === "pending") return "退款处理中";
    if (status === "approved") return "已退款";
    if (status === "rejected") return "退款被拒";
    return "";
  };

  const refundHint = detail ? refundLabelForStatus(detail.refundStatus) : "";

  /** 是否允许发起退款申请（业务规则与后端一致） */
  const canRequestRefund = (order: MiniOrder): boolean => {
    if (order.refundStatus === "pending" || order.refundStatus === "approved") return false;
    if (order.status === "cancelled") return false;
    if (order.paidAmount <= 0) return false;
    return true;
  };

  const handleCopyOrderNo = () => {
    if (!detail?.orderNo) return;
    void Taro.setClipboardData({ data: detail.orderNo });
    void Taro.showToast({ title: "已复制订单号", icon: "none" });
  };

  const handleApplyRefund = async () => {
    if (!detail || !canRequestRefund(detail)) return;
    try {
      await requestMiniOrderRefund(detail.id);
      void Taro.showToast({ title: "已提交退款申请", icon: "success" });
      await loadDetail();
    } catch (error: unknown) {
      void Taro.showToast({
        title: error instanceof Error ? error.message : "申请失败",
        icon: "none"
      });
    }
  };

  const handleContactService = () => {
    const idParam = orderId || detail?.id || "";
    void Taro.navigateTo({
      url: `/pages/customer-service/index?from=order-detail&id=${encodeURIComponent(idParam)}`
    });
  };

  const handleConfirmCloseOrder = async () => {
    if (!detail || detail.status !== "pendingDone") return;
    try {
      await confirmMiniOrderClose(detail.id);
      void Taro.showToast({ title: "已确认结单", icon: "success" });
      await loadDetail();
    } catch (error: unknown) {
      void Taro.showToast({
        title: error instanceof Error ? error.message : "结单失败",
        icon: "none"
      });
    }
  };

  /** 微信支付：服务端 JSAPI 下单 + 小程序 requestPayment（见微信支付商户文档） */
  const handleWechatPay = async () => {
    if (!detail || detail.status !== "pendingPay") return;
    try {
      const prepay = await requestMiniWechatPrepay(detail.id);
      if (prepay.mockPaid) {
        void Taro.showToast({ title: "支付成功", icon: "success" });
        await loadDetail();
        return;
      }
      await Taro.requestPayment({
        timeStamp: prepay.payment.timeStamp,
        nonceStr: prepay.payment.nonceStr,
        package: prepay.payment.package,
        signType: prepay.payment.signType,
        paySign: prepay.payment.paySign
      });
      void Taro.showToast({ title: "支付完成", icon: "success" });
      await loadDetail();
    } catch (error: unknown) {
      const errMsg =
        typeof error === "object" && error !== null && "errMsg" in error
          ? String((error as { errMsg?: string }).errMsg ?? "")
          : error instanceof Error
            ? error.message
            : "";
      const cancelled =
        errMsg.includes("cancel") || errMsg.includes("取消") || errMsg.includes("fail cancel");
      void Taro.showToast({
        title: cancelled ? "已取消支付" : error instanceof Error ? error.message : "支付失败",
        icon: "none"
      });
    }
  };

  if (!orderId) {
    return (
      <View className="orderDetail">
        <View className="orderDetail__emptyHint">
          <Text className="orderDetail__emptyHintText">缺少订单参数</Text>
        </View>
      </View>
    );
  }

  if (loading || !detail) {
    return (
      <View className="orderDetail">
        <View className="orderDetail__emptyHint">
          <Text className="orderDetail__emptyHintText">{loading ? "加载中…" : "订单不存在"}</Text>
        </View>
      </View>
    );
  }

  const refundDisabled = !canRequestRefund(detail);

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

          {refundHint ? (
            <View className="orderDetail__refundBanner">
              <Text className="orderDetail__refundBannerText">{refundHint}</Text>
            </View>
          ) : null}

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
            <Image className="orderDetail__cover" src={detail.coverImage} mode="aspectFill" />
            <View className="orderDetail__coverMask" />
            <View className="orderDetail__coverMeta">
              <Text className="orderDetail__packageTag">{detail.packageTag}</Text>
              <Text className="orderDetail__serviceTitle">{detail.serviceTitle}</Text>
              <Text className="orderDetail__serviceAmount">{formatMoney(detail.amount)}</Text>
            </View>
          </View>
          <View className="orderDetail__productBottom">
            <View>
              <Text className="orderDetail__smallLabel">Quantity</Text>
              <Text className="orderDetail__quantity">{detail.quantityText}</Text>
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
            {detail.deliveries.length === 0 ? (
              <Text className="orderDetail__deliveryEmpty">暂无交付项说明</Text>
            ) : (
              detail.deliveries.map((item) => (
                <View key={item.id} className="orderDetail__deliveryItem">
                  <Text
                    className={`orderDetail__deliveryDot ${item.done ? "orderDetail__deliveryDot--done" : ""}`}
                  >
                    •
                  </Text>
                  <Text className="orderDetail__deliveryText">{item.text}</Text>
                </View>
              ))
            )}
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
              <Text className="orderDetail__kvValue">{detail.orderNo}</Text>
              <Text className="orderDetail__copyIcon">⧉</Text>
            </View>
          </View>

          <View className="orderDetail__kvRow">
            <Text className="orderDetail__kvKey">下单时间</Text>
            <Text className="orderDetail__kvValue">{detail.createdAt}</Text>
          </View>

          <View className="orderDetail__kvRow">
            <Text className="orderDetail__kvKey">支付方式</Text>
            <Text className="orderDetail__kvValue">{detail.payMethod}</Text>
          </View>

          <View className="orderDetail__totalRow">
            <Text className="orderDetail__totalLabel">实付金额</Text>
            <Text className="orderDetail__totalValue">{formatMoney(detail.paidAmount)}</Text>
          </View>
        </View>
      </ScrollView>

      <View className="orderDetail__footerDock">
        {detail.status === "pendingPay" ? (
          <View className="orderDetail__payBtnWrap">
            <View
              className="orderDetail__payBtn"
              onClick={() => void handleWechatPay()}
              aria-label="微信支付"
            >
              <Text className="orderDetail__payBtnText">微信支付</Text>
            </View>
          </View>
        ) : null}

        {detail.status === "pendingDone" ? (
          <View
            className="orderDetail__confirmCloseBtn"
            onClick={() => void handleConfirmCloseOrder()}
            aria-label="确认结单"
          >
            <Text className="orderDetail__confirmCloseBtnText">确认结单</Text>
          </View>
        ) : null}

        <View className="orderDetail__footer">
          <View
            className={`orderDetail__secondaryBtn ${refundDisabled ? "orderDetail__secondaryBtn--disabled" : ""}`}
            onClick={() => {
              if (refundDisabled) return;
              void handleApplyRefund();
            }}
            aria-label="申请退款"
            aria-disabled={refundDisabled}
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
    </View>
  );
};

export default OrderDetailPage;
