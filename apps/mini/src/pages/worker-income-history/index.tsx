import { View, Text, ScrollView } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { useEffect, useMemo, useState } from "react";
import "./index.scss";
import { BottomBar } from "../../components/bottom-bar/BottomBar";
import { getRole } from "../../utils/role";
import {
  fetchWorkerIncomeLedger,
  fetchWorkerIncomeSummary,
  type WorkerIncomeLedgerItem,
  type WorkerIncomeSummary
} from "../../services/worker-income";

const todayYearMonth = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const shiftYearMonth = (ym: string, deltaMonth: number): string => {
  const [yStr, mStr] = ym.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  const d = new Date(y, m - 1 + deltaMonth, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const formatMoney = (n: number): string =>
  `¥${n.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const growthText = (pct: number | null): string => {
  if (pct === null || Number.isNaN(pct)) return "—";
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct}%`;
};

const WorkerIncomeHistoryPage = () => {
  const role = getRole();
  const router = useRouter();
  const ymFromRoute = router.params?.yearMonth ? String(router.params.yearMonth) : "";

  const [yearMonth, setYearMonth] = useState(() => ymFromRoute || todayYearMonth());
  const [summary, setSummary] = useState<WorkerIncomeSummary | null>(null);
  const [items, setItems] = useState<WorkerIncomeLedgerItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const maxYm = useMemo(() => todayYearMonth(), []);

  const pageSize = 15;

  useEffect(() => {
    if (role !== "worker") return;
    let cancelled = false;
    void (async () => {
      try {
        setLoading(true);
        const [sum, ledger] = await Promise.all([
          fetchWorkerIncomeSummary(yearMonth),
          fetchWorkerIncomeLedger({ yearMonth, page: 1, pageSize })
        ]);
        if (cancelled) return;
        setSummary(sum);
        setItems(ledger.items);
        setTotal(ledger.total);
      } catch (error: unknown) {
        void Taro.showToast({
          title: error instanceof Error ? error.message : "加载失败",
          icon: "none"
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [role, yearMonth, pageSize]);

  const handlePrevMonth = () => {
    setYearMonth((prev) => shiftYearMonth(prev, -1));
  };

  const handleNextMonth = () => {
    setYearMonth((prev) => {
      const n = shiftYearMonth(prev, 1);
      return n > maxYm ? prev : n;
    });
  };

  const handleLoadMore = async () => {
    if (loading || loadingMore || items.length === 0 || items.length >= total) return;
    const nextPage = Math.floor(items.length / pageSize) + 1;
    try {
      setLoadingMore(true);
      const res = await fetchWorkerIncomeLedger({ yearMonth, page: nextPage, pageSize });
      setItems((prev) => [...prev, ...res.items]);
      setTotal(res.total);
    } catch (error: unknown) {
      void Taro.showToast({
        title: error instanceof Error ? error.message : "加载更多失败",
        icon: "none"
      });
    } finally {
      setLoadingMore(false);
    }
  };

  const handleOpenRecord = (record: WorkerIncomeLedgerItem) => {
    void Taro.navigateTo({
      url: `/pages/worker-income-detail/index?id=${encodeURIComponent(record.orderId)}`
    });
  };

  const timeLineText = (record: WorkerIncomeLedgerItem): string =>
    record.completedAtDisplay ??
    (record.assignedAtDisplay
      ? `接单 ${record.assignedAtDisplay}`
      : `下单 ${record.createdAtDisplay}`);

  if (role !== "worker") {
    void Taro.showToast({ title: "仅打手可查看收益流水", icon: "none" });
    void Taro.redirectTo({ url: "/pages/home-user/index" });
    return <View className="workerIncomeHistory" />;
  }

  const nextDisabled = yearMonth >= maxYm;

  return (
    <View className="workerIncomeHistory">
      <ScrollView
        className="workerIncomeHistory__scroll"
        scrollY
        enhanced
        lowerThreshold={120}
        onScrollToLower={() => void handleLoadMore()}
        showScrollbar={false}
      >
        <View className="workerIncomeHistory__hero">
          <View className="workerIncomeHistory__heroGlow" />
          <View className="workerIncomeHistory__heroMain">
            <Text className="workerIncomeHistory__heroLabel">本月预估收益（含进行中）</Text>
            <View className="workerIncomeHistory__heroAmountRow">
              <Text className="workerIncomeHistory__heroAmount">
                {loading && !summary ? "…" : formatMoney(summary?.monthEstimateTotal ?? 0)}
              </Text>
              <Text className="workerIncomeHistory__heroGrowth">
                {summary ? growthText(summary.growthPercent) : "—"}
              </Text>
            </View>
            <Text className="workerIncomeHistory__heroSub">
              已结算 {formatMoney(summary?.settledTotal ?? 0)}
            </Text>
          </View>
          <View className="workerIncomeHistory__heroStats">
            <View>
              <Text className="workerIncomeHistory__statLabel">已结算订单数</Text>
              <Text className="workerIncomeHistory__statValue">
                {summary ? String(summary.settledOrderCount) : "—"}
              </Text>
            </View>
            <View>
              <Text className="workerIncomeHistory__statLabel">待结单 / 服务中</Text>
              <Text className="workerIncomeHistory__statValue">
                {summary
                  ? `${summary.pendingSettlementOrderCount} / ${summary.inServiceOrderCount}`
                  : "—"}
              </Text>
            </View>
          </View>
        </View>

        <View className="workerIncomeHistory__sectionHeader">
          <Text className="workerIncomeHistory__sectionTitle">收益流水明细</Text>
          <View className="workerIncomeHistory__monthSwitch">
            <View
              className="workerIncomeHistory__monthBtn"
              onClick={handlePrevMonth}
              aria-label="上一月"
            >
              <Text className="workerIncomeHistory__monthBtnText">‹</Text>
            </View>
            <Text className="workerIncomeHistory__monthText">{yearMonth}</Text>
            <View
              className={`workerIncomeHistory__monthBtn ${nextDisabled ? "workerIncomeHistory__monthBtn--disabled" : ""}`}
              onClick={() => {
                if (nextDisabled) return;
                handleNextMonth();
              }}
              aria-label="下一月"
            >
              <Text className="workerIncomeHistory__monthBtnText">›</Text>
            </View>
          </View>
        </View>

        {loading ? (
          <View className="workerIncomeHistory__loading">
            <Text className="workerIncomeHistory__loadingText">加载中…</Text>
          </View>
        ) : null}

        <View className="workerIncomeHistory__list">
          {!loading &&
            items.map((record) => {
              const settled = record.settlementStatus === "settled";
              return (
                <View
                  key={record.orderId}
                  className="workerIncomeHistory__record"
                  onClick={() => handleOpenRecord(record)}
                  aria-label={`查看订单${record.orderNo}收益`}
                >
                  <View className="workerIncomeHistory__recordLeft">
                    <View className="workerIncomeHistory__recordIconWrap">
                      <Text className="workerIncomeHistory__recordIcon">🎮</Text>
                    </View>
                    <View className="workerIncomeHistory__recordMain">
                      <Text className="workerIncomeHistory__recordTitle">
                        {record.serviceTitle}
                      </Text>
                      <Text className="workerIncomeHistory__recordSub">
                        订单号 {record.orderNo}
                      </Text>
                      <Text className="workerIncomeHistory__recordTime">
                        {timeLineText(record)}
                      </Text>
                    </View>
                  </View>
                  <View className="workerIncomeHistory__recordRight">
                    <Text className="workerIncomeHistory__recordAmount">
                      +{formatMoney(record.workerIncomeAmount)}
                    </Text>
                    <Text
                      className={`workerIncomeHistory__state ${
                        settled
                          ? "workerIncomeHistory__state--settled"
                          : "workerIncomeHistory__state--pending"
                      }`}
                    >
                      {record.settlementStatusLabel}
                    </Text>
                  </View>
                </View>
              );
            })}
        </View>

        {!loading && items.length === 0 ? (
          <View className="workerIncomeHistory__loading">
            <Text className="workerIncomeHistory__loadingText">该月暂无流水</Text>
          </View>
        ) : null}

        {!loading && loadingMore ? (
          <View className="workerIncomeHistory__loading">
            <Text className="workerIncomeHistory__loadingText">加载更多…</Text>
          </View>
        ) : null}

        {!loading && items.length > 0 && items.length >= total ? (
          <View className="workerIncomeHistory__endHint">
            <Text className="workerIncomeHistory__endHintText">已加载全部 {total} 条</Text>
          </View>
        ) : null}
      </ScrollView>

      <BottomBar role={role} activeKey="income" />
    </View>
  );
};

export default WorkerIncomeHistoryPage;
