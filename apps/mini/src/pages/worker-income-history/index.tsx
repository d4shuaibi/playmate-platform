import { View, Text, ScrollView } from "@tarojs/components";
import Taro from "@tarojs/taro";
import "./index.scss";
import { BottomBar } from "../../components/bottom-bar/BottomBar";
import { getRole, setRole } from "../../utils/role";

type IncomeOverview = {
  monthEstimateText: string;
  growthText: string;
  settledCountText: string;
  pendingCountText: string;
};

type IncomeRecord = {
  id: string;
  title: string;
  orderNo: string;
  timeText: string;
  amountText: string;
  stateText: string;
  stateTone: "settled" | "pending";
};

// TODO(backend): 接入打手收益统计接口（月预估收益、涨幅、已结算/待结算订单数）
const mockOverview: IncomeOverview = {
  monthEstimateText: "¥12,840.50",
  growthText: "+12.5%",
  settledCountText: "142",
  pendingCountText: "18"
};

// TODO(backend): 接入收益流水列表接口（支持分页、时间筛选、订单号查询）
const mockIncomeRecords: IncomeRecord[] = [
  {
    id: "hist-1",
    title: "王者荣耀 - 排位上分",
    orderNo: "202310248892",
    timeText: "2023-10-24 14:30",
    amountText: "+¥150.00",
    stateText: "已结算",
    stateTone: "settled"
  },
  {
    id: "hist-2",
    title: "英雄联盟 - 冠军陪练",
    orderNo: "202310249001",
    timeText: "2023-10-24 12:15",
    amountText: "+¥280.00",
    stateText: "结算中",
    stateTone: "pending"
  },
  {
    id: "hist-3",
    title: "和平精英 - 赛季冲分",
    orderNo: "202310237712",
    timeText: "2023-10-23 21:05",
    amountText: "+¥45.00",
    stateText: "已结算",
    stateTone: "settled"
  },
  {
    id: "hist-4",
    title: "永劫无间 - 连胜挑战",
    orderNo: "202310235543",
    timeText: "2023-10-23 18:22",
    amountText: "+¥320.00",
    stateText: "已结算",
    stateTone: "settled"
  },
  {
    id: "hist-5",
    title: "原神 - 传说任务代打",
    orderNo: "202310229981",
    timeText: "2023-10-22 10:45",
    amountText: "+¥120.00",
    stateText: "结算中",
    stateTone: "pending"
  }
];

const WorkerIncomeHistoryPage = () => {
  const role = getRole();
  if (role !== "worker") {
    setRole("user");
    void Taro.showToast({ title: "仅打手可查看收益流水", icon: "none" });
    void Taro.redirectTo({ url: "/pages/home-user/index" });
    return <View className="workerIncomeHistory" />;
  }

  const handleOpenRecord = (record: IncomeRecord) => {
    // TODO(backend): 后续可透传更多字段（状态、筛选条件、来源页）给详情页
    void Taro.navigateTo({
      url: `/pages/worker-income-detail/index?id=${encodeURIComponent(record.id)}`
    });
  };

  return (
    <View className="workerIncomeHistory">
      <ScrollView className="workerIncomeHistory__scroll" scrollY enhanced showScrollbar={false}>
        <View className="workerIncomeHistory__hero">
          <View className="workerIncomeHistory__heroGlow" />
          <View className="workerIncomeHistory__heroMain">
            <Text className="workerIncomeHistory__heroLabel">本月预估收益</Text>
            <View className="workerIncomeHistory__heroAmountRow">
              <Text className="workerIncomeHistory__heroAmount">
                {mockOverview.monthEstimateText}
              </Text>
              <Text className="workerIncomeHistory__heroGrowth">{mockOverview.growthText}</Text>
            </View>
          </View>
          <View className="workerIncomeHistory__heroStats">
            <View>
              <Text className="workerIncomeHistory__statLabel">已结算订单数</Text>
              <Text className="workerIncomeHistory__statValue">
                {mockOverview.settledCountText}
              </Text>
            </View>
            <View>
              <Text className="workerIncomeHistory__statLabel">待结算订单</Text>
              <Text className="workerIncomeHistory__statValue">
                {mockOverview.pendingCountText}
              </Text>
            </View>
          </View>
        </View>

        <View className="workerIncomeHistory__sectionHeader">
          <Text className="workerIncomeHistory__sectionTitle">收益流水明细</Text>
          <View className="workerIncomeHistory__filter">
            <Text className="workerIncomeHistory__filterText">本月</Text>
            <Text className="workerIncomeHistory__filterArrow">⌄</Text>
          </View>
        </View>

        <View className="workerIncomeHistory__list">
          {mockIncomeRecords.map((record) => (
            <View
              key={record.id}
              className="workerIncomeHistory__record"
              onClick={() => handleOpenRecord(record)}
              aria-label={`查看订单${record.orderNo}收益`}
            >
              <View className="workerIncomeHistory__recordLeft">
                <View className="workerIncomeHistory__recordIconWrap">
                  <Text className="workerIncomeHistory__recordIcon">🎮</Text>
                </View>
                <View className="workerIncomeHistory__recordMain">
                  <Text className="workerIncomeHistory__recordTitle">{record.title}</Text>
                  <Text className="workerIncomeHistory__recordSub">订单号: {record.orderNo}</Text>
                  <Text className="workerIncomeHistory__recordTime">{record.timeText}</Text>
                </View>
              </View>
              <View className="workerIncomeHistory__recordRight">
                <Text className="workerIncomeHistory__recordAmount">{record.amountText}</Text>
                <Text
                  className={`workerIncomeHistory__state ${
                    record.stateTone === "settled"
                      ? "workerIncomeHistory__state--settled"
                      : "workerIncomeHistory__state--pending"
                  }`}
                >
                  {record.stateText}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <BottomBar role={role} activeKey="income" />
    </View>
  );
};

export default WorkerIncomeHistoryPage;
