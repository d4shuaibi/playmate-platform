import { View, Text, ScrollView } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useCallback, useEffect, useMemo, useState } from "react";
import "./index.scss";
import { BottomBar } from "../../components/bottom-bar/BottomBar";
import { getRole } from "../../utils/role";
import {
  fetchWorkerIncomeLedger,
  fetchWorkerIncomeSummary,
  type WorkerIncomeLedgerItem,
  type WorkerIncomeSettlementStatus,
  type WorkerIncomeSummary
} from "../../services/worker-income";

type SettlementAccent = "secondary" | "primary" | "neutral";

type SettlementRecordUi = {
  orderId: string;
  title: string;
  subTitle: string;
  amountText: string;
  stateText: string;
  accent: SettlementAccent;
  icon: string;
};

const ICONS = ["🏷️", "📦", "🏆", "🛡️"];

const todayYearMonth = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const formatMoney = (n: number): string =>
  `¥${n.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const accentForStatus = (s: WorkerIncomeSettlementStatus): SettlementAccent => {
  if (s === "settled") return "secondary";
  if (s === "pending_close") return "primary";
  return "neutral";
};

const mapToUi = (item: WorkerIncomeLedgerItem, index: number): SettlementRecordUi => {
  const sub =
    item.completedAtDisplay ??
    (item.assignedAtDisplay ? `接单 ${item.assignedAtDisplay}` : `下单 ${item.createdAtDisplay}`);
  return {
    orderId: item.orderId,
    title: item.serviceTitle,
    subTitle: `${item.orderNo} · ${sub}`,
    amountText: `+ ${formatMoney(item.workerIncomeAmount)}`,
    stateText: item.settlementStatusLabel,
    accent: accentForStatus(item.settlementStatus),
    icon: ICONS[index % ICONS.length]
  };
};

const IncomePage = () => {
  const role = getRole();
  const yearMonth = useMemo(() => todayYearMonth(), []);

  const [summary, setSummary] = useState<WorkerIncomeSummary | null>(null);
  const [recent, setRecent] = useState<WorkerIncomeLedgerItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [sum, ledger] = await Promise.all([
        fetchWorkerIncomeSummary(yearMonth),
        fetchWorkerIncomeLedger({ yearMonth, page: 1, pageSize: 10 })
      ]);
      setSummary(sum);
      setRecent(ledger.items);
    } catch (error: unknown) {
      void Taro.showToast({
        title: error instanceof Error ? error.message : "加载失败",
        icon: "none"
      });
    } finally {
      setLoading(false);
    }
  }, [yearMonth]);

  useEffect(() => {
    if (role !== "worker") return;
    void load();
  }, [load, role]);

  const recordsUi = useMemo(() => recent.map((item, idx) => mapToUi(item, idx)), [recent]);

  const heroMainText = summary ? formatMoney(summary.monthEstimateTotal) : loading ? "…" : "¥0.00";

  const heroSubText = summary
    ? `已结算入账 ${formatMoney(summary.settledTotal)} · 订单 ${summary.settledOrderCount} 笔`
    : "";

  const handleOpenRecordDetail = (record: SettlementRecordUi) => {
    void Taro.navigateTo({
      url: `/pages/worker-income-detail/index?id=${encodeURIComponent(record.orderId)}`
    });
  };

  const handleViewAllHistory = () => {
    void Taro.navigateTo({
      url: `/pages/worker-income-history/index?yearMonth=${encodeURIComponent(yearMonth)}`
    });
  };

  if (role !== "worker") {
    void Taro.showToast({ title: "仅打手可查看收益", icon: "none" });
    void Taro.redirectTo({ url: "/pages/home-user/index" });
    return <View className="incomeWorker" />;
  }

  return (
    <View className="incomeWorker">
      <ScrollView className="incomeWorker__scroll" scrollY enhanced showScrollbar={false}>
        <View className="incomeWorker__body">
          <View className="incomeWorker__heroWrap">
            <View className="incomeWorker__heroGlow" />
            <View className="incomeWorker__heroCard">
              <Text className="incomeWorker__heroLabel">本月预估收益（含进行中）</Text>
              <Text className="incomeWorker__heroIncome">{heroMainText}</Text>
              {heroSubText ? <Text className="incomeWorker__heroSub">{heroSubText}</Text> : null}
              <View className="incomeWorker__hintCard">
                <Text className="incomeWorker__hintTitle">结算说明</Text>
                <Text className="incomeWorker__hintDesc">
                  {summary?.payoutHint ??
                    "分成测算仅供参考；工资由财务统一发放，如有疑问请联系调度或客服。"}
                </Text>
              </View>
            </View>
          </View>

          <View className="incomeWorker__sectionHeader">
            <Text className="incomeWorker__sectionTitle">本月流水（可对账）</Text>
            <Text className="incomeWorker__sectionSub">ORDER-LINKED</Text>
          </View>

          {loading ? (
            <View className="incomeWorker__hintCard incomeWorker__hintCard--flat">
              <Text className="incomeWorker__hintDesc">加载中…</Text>
            </View>
          ) : null}

          <View className="incomeWorker__list">
            {!loading &&
              recordsUi.map((record) => (
                <View
                  key={record.orderId}
                  className={`incomeWorker__record incomeWorker__record--${record.accent}`}
                  onClick={() => handleOpenRecordDetail(record)}
                  aria-label={`查看${record.title}收益明细`}
                >
                  <View className="incomeWorker__recordLeft">
                    <View className="incomeWorker__recordIconWrap">
                      <Text className="incomeWorker__recordIcon">{record.icon}</Text>
                    </View>
                    <View className="incomeWorker__recordMain">
                      <Text className="incomeWorker__recordTitle">{record.title}</Text>
                      <Text className="incomeWorker__recordSub">{record.subTitle}</Text>
                    </View>
                  </View>
                  <View className="incomeWorker__recordRight">
                    <Text
                      className={`incomeWorker__recordAmount incomeWorker__recordAmount--${record.accent}`}
                    >
                      {record.amountText}
                    </Text>
                    <Text
                      className={`incomeWorker__recordState incomeWorker__recordState--${record.accent}`}
                    >
                      {record.stateText}
                    </Text>
                  </View>
                </View>
              ))}
          </View>

          {!loading && recordsUi.length === 0 ? (
            <View className="incomeWorker__hintCard incomeWorker__hintCard--flat">
              <Text className="incomeWorker__hintDesc">本月暂无流水，去接单或查看其它月份</Text>
            </View>
          ) : null}

          <View className="incomeWorker__historyBtnWrap">
            <View className="incomeWorker__historyBtn" onClick={handleViewAllHistory}>
              <Text className="incomeWorker__historyBtnText">
                查看全部收益记录 VIEW ALL HISTORY
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <BottomBar role={role} activeKey="income" />
    </View>
  );
};

export default IncomePage;
