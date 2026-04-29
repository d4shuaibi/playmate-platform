import { View, Text, ScrollView, Image } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { useCallback, useEffect, useState } from "react";
import "./index.scss";
import { BottomBar } from "../../components/bottom-bar/BottomBar";
import { getRole } from "../../utils/role";
import { fetchWorkerIncomeDetail, type WorkerIncomeDetail } from "../../services/worker-income";

const BOSS_STATUS_LABEL: Record<string, string> = {
  pendingPay: "待付款",
  pendingTake: "待接单",
  serving: "服务中",
  pendingDone: "待结单",
  done: "已完成",
  cancelled: "已取消"
};

const formatMoney = (n: number): string =>
  `¥ ${n.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const WorkerIncomeDetailPage = () => {
  const role = getRole();
  const router = useRouter();
  const orderId = String(router.params?.id ?? "").trim();

  const [detail, setDetail] = useState<WorkerIncomeDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDetail = useCallback(async () => {
    if (!orderId) {
      setDetail(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await fetchWorkerIncomeDetail(orderId);
      setDetail(data);
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

  const handleContactDispatcher = () => {
    const idParam = orderId || detail?.orderId || "";
    void Taro.navigateTo({
      url: `/pages/customer-service/index?from=worker-income-detail&id=${encodeURIComponent(idParam)}`
    });
  };

  if (role !== "worker") {
    void Taro.showToast({ title: "仅打手可查看收益详情", icon: "none" });
    void Taro.redirectTo({ url: "/pages/home-user/index" });
    return <View className="workerIncomeDetail" />;
  }

  if (!orderId) {
    return (
      <View className="workerIncomeDetail">
        <Text className="workerIncomeDetail__hint">缺少流水标识</Text>
      </View>
    );
  }

  if (loading || !detail) {
    return (
      <View className="workerIncomeDetail">
        <Text className="workerIncomeDetail__hint">{loading ? "加载中…" : "记录不存在"}</Text>
      </View>
    );
  }

  const heroAmountText = `+ ${formatMoney(detail.workerIncomeAmount)}`;

  return (
    <View className="workerIncomeDetail">
      <ScrollView className="workerIncomeDetail__scroll" scrollY enhanced showScrollbar={false}>
        <View className="workerIncomeDetail__hero">
          <View className="workerIncomeDetail__heroIconWrap">
            <Text className="workerIncomeDetail__heroIcon">✓</Text>
          </View>
          <Text className="workerIncomeDetail__heroAmount">{heroAmountText}</Text>
          <Text className="workerIncomeDetail__heroState">{detail.settlementStatusLabel}</Text>
          <Text className="workerIncomeDetail__heroMeta">关联订单 {detail.orderNo}</Text>
        </View>

        <View className="workerIncomeDetail__section workerIncomeDetail__orderCard">
          <View className="workerIncomeDetail__kvRow">
            <Text className="workerIncomeDetail__kvKey">订单编号</Text>
            <Text className="workerIncomeDetail__kvValue">{detail.orderNo}</Text>
          </View>
          <View className="workerIncomeDetail__kvRow">
            <Text className="workerIncomeDetail__kvKey">服务内容</Text>
            <Text className="workerIncomeDetail__kvValue workerIncomeDetail__kvValue--strong">
              {detail.serviceTitle}
            </Text>
          </View>
          <View className="workerIncomeDetail__kvRow">
            <Text className="workerIncomeDetail__kvKey">套餐标签</Text>
            <Text className="workerIncomeDetail__kvValue">{detail.packageTag}</Text>
          </View>
          <View className="workerIncomeDetail__kvRow">
            <Text className="workerIncomeDetail__kvKey">老板端订单状态</Text>
            <Text className="workerIncomeDetail__kvValue">
              {BOSS_STATUS_LABEL[detail.bossOrderStatus] ?? detail.bossOrderStatus}
            </Text>
          </View>
          <View className="workerIncomeDetail__kvRow">
            <Text className="workerIncomeDetail__kvKey">结算状态</Text>
            <Text className="workerIncomeDetail__kvValue">{detail.settlementStatusLabel}</Text>
          </View>
          <View className="workerIncomeDetail__kvRow">
            <Text className="workerIncomeDetail__kvKey">完成 / 结单时间</Text>
            <Text className="workerIncomeDetail__kvValue">
              {detail.completedAtDisplay ??
                detail.assignedAtDisplay ??
                detail.createdAtDisplay ??
                "—"}
            </Text>
          </View>
          <View className="workerIncomeDetail__kvRow">
            <Text className="workerIncomeDetail__kvKey">分成金额（测算）</Text>
            <Text className="workerIncomeDetail__kvValue">
              {formatMoney(detail.workerIncomeAmount)}
            </Text>
          </View>
        </View>

        <View className="workerIncomeDetail__section workerIncomeDetail__noteCard">
          <View className="workerIncomeDetail__noteHeader">
            <Text className="workerIncomeDetail__noteIcon">ⓘ</Text>
            <Text className="workerIncomeDetail__noteTitle">结算说明</Text>
          </View>
          <Text className="workerIncomeDetail__noteDesc">{detail.settleNote}</Text>
        </View>

        <View className="workerIncomeDetail__posterWrap">
          <Image className="workerIncomeDetail__poster" src={detail.coverImage} mode="aspectFill" />
          <View className="workerIncomeDetail__posterMask" />
          <Text className="workerIncomeDetail__posterTag">Income Ledger</Text>
        </View>

        <View className="workerIncomeDetail__actionWrap">
          <View
            className="workerIncomeDetail__actionBtn"
            onClick={handleContactDispatcher}
            aria-label="联系客服"
          >
            <Text className="workerIncomeDetail__actionBtnIcon">🎧</Text>
            <Text className="workerIncomeDetail__actionBtnText">联系客服</Text>
          </View>
        </View>
      </ScrollView>

      <BottomBar role={role} activeKey="income" />
    </View>
  );
};

export default WorkerIncomeDetailPage;
