import { View, Text, ScrollView } from "@tarojs/components";
import Taro from "@tarojs/taro";
import "./index.scss";
import { BottomBar } from "../../components/bottom-bar/BottomBar";
import { getRole, setRole } from "../../utils/role";

type IncomeSummary = {
  monthIncomeText: string;
  payoutHint: string;
};

type SettlementRecord = {
  id: string;
  title: string;
  subTitle: string;
  amountText: string;
  stateText: string;
  accent: "secondary" | "primary" | "neutral";
  icon: string;
};

// TODO(backend): 接入打手收益汇总接口（月收益、结算说明）
const mockIncomeSummary: IncomeSummary = {
  monthIncomeText: "¥12,450.00",
  payoutHint: "工资由财务通过微信或银行卡转账统一发放。结算过程中如有疑问请及时联系调度组。"
};

// TODO(backend): 接入打手收益明细列表接口（支持分页、筛选、时间范围）
const mockSettlementRecords: SettlementRecord[] = [
  {
    id: "rec-1",
    title: "Red Card Extraction",
    subTitle: "红卡提取成功 · 15:42",
    amountText: "+ ¥150.00",
    stateText: "已记入",
    accent: "secondary",
    icon: "🏷️"
  },
  {
    id: "rec-2",
    title: "300k Loot Bundle",
    subTitle: "满载而归 · 12:10",
    amountText: "+ ¥50.00",
    stateText: "已记入",
    accent: "primary",
    icon: "📦"
  },
  {
    id: "rec-3",
    title: "Ace Rank Up Bonus",
    subTitle: "段位提升奖励 · 昨天",
    amountText: "+ ¥200.00",
    stateText: "待结算",
    accent: "secondary",
    icon: "🏆"
  },
  {
    id: "rec-4",
    title: "Elite Escort Service",
    subTitle: "高级护送任务 · 昨天",
    amountText: "+ ¥120.00",
    stateText: "已记入",
    accent: "neutral",
    icon: "🛡️"
  }
];

const IncomePage = () => {
  const role = getRole();
  // TODO(backend): 申请成为打手流程完成后，恢复 workerPermission 校验
  if (role !== "worker") {
    setRole("user");
    void Taro.showToast({ title: "仅打手可查看收益", icon: "none" });
    void Taro.redirectTo({ url: "/pages/home-user/index" });
    return <View className="incomeWorker" />;
  }

  const handleOpenRecordDetail = (record: SettlementRecord) => {
    // TODO(backend): 跳转收益明细详情页
    void Taro.showToast({ title: `查看明细：${record.title}`, icon: "none" });
  };

  const handleViewAllHistory = () => {
    // TODO(backend): 跳转全部收益记录页
    void Taro.showToast({ title: "收益历史开发中", icon: "none" });
  };

  return (
    <View className="incomeWorker">
      <ScrollView className="incomeWorker__scroll" scrollY enhanced showScrollbar={false}>
        <View className="incomeWorker__body">
          <View className="incomeWorker__heroWrap">
            <View className="incomeWorker__heroGlow" />
            <View className="incomeWorker__heroCard">
              <Text className="incomeWorker__heroLabel">本月收益</Text>
              <Text className="incomeWorker__heroIncome">{mockIncomeSummary.monthIncomeText}</Text>
              <View className="incomeWorker__hintCard">
                <Text className="incomeWorker__hintTitle">发放说明</Text>
                <Text className="incomeWorker__hintDesc">{mockIncomeSummary.payoutHint}</Text>
              </View>
            </View>
          </View>

          <View className="incomeWorker__sectionHeader">
            <Text className="incomeWorker__sectionTitle">近期结算明细</Text>
            <Text className="incomeWorker__sectionSub">RECENT TASKS</Text>
          </View>

          <View className="incomeWorker__list">
            {mockSettlementRecords.map((record) => (
              <View
                key={record.id}
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

          <View className="incomeWorker__historyBtnWrap">
            <View className="incomeWorker__historyBtn" onClick={handleViewAllHistory}>
              <Text className="incomeWorker__historyBtnText">
                查看所有收益记录 VIEW ALL HISTORY
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
