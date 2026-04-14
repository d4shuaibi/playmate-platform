import { View, Text, ScrollView } from "@tarojs/components";
import Taro from "@tarojs/taro";
import "./index.scss";
import { BottomBar } from "../../components/bottom-bar/BottomBar";
// import { getRole, getWorkerPermission } from "../../utils/role";
import { getRole } from "../../utils/role";

type WorkbenchSummary = {
  todayIncomeText: string;
  incomeTrendText: string;
  completedOrdersText: string;
  successRateText: string;
  successRateProgress: number;
};

type StatusAction = {
  key: "rest" | "online";
  label: string;
};

type PendingOrder = {
  id: string;
  title: string;
  difficulty: string;
  requirement: string;
  remainTimeText: string;
  amountText: string;
  actionText: string;
};

type AchievementData = {
  title: string;
  desc: string;
  rankText: string;
  efficiencyText: string;
};

// TODO(backend): 接入打手工作台汇总接口（今日收益/完成订单/成功率/趋势）
const mockSummary: WorkbenchSummary = {
  todayIncomeText: "¥1,280",
  incomeTrendText: "+12.5% 较昨日",
  completedOrdersText: "24",
  successRateText: "99.2%",
  successRateProgress: 99.2
};

// TODO(backend): 接入打手在线状态接口（休整/在线/忙碌等）
const mockStatusActions: StatusAction[] = [
  { key: "rest", label: "休整" },
  { key: "online", label: "在线" }
];

// TODO(backend): 接入待处理订单列表接口（标题/难度/剩余时长/金额/操作）
const mockPendingOrders: PendingOrder[] = [
  {
    id: "worker-order-1",
    title: "艾尔登法环：黄金树幽影",
    difficulty: "困难",
    requirement: "需求：速通 DLC 最终 BOSS 及其前置任务",
    remainTimeText: "剩余 02:45:00",
    amountText: "¥450.00",
    actionText: "开始执行"
  },
  {
    id: "worker-order-2",
    title: "英雄联盟：段位晋级",
    difficulty: "常规",
    requirement: "需求：翡翠 I 晋级 璀璨钻石 IV（不限制位置）",
    remainTimeText: "剩余 08:20:00",
    amountText: "¥280.00",
    actionText: "开始执行"
  }
];

// TODO(backend): 接入打手成就/排名接口（排名、效率、描述）
const mockAchievement: AchievementData = {
  title: "指挥官成就：精英打手",
  desc: "您本周的订单完成速度已超过 94% 的指挥官。继续保持以获取更多高佣金订单分派。",
  rankText: "94th",
  efficiencyText: "Top 5%"
};

const WorkerHomePage = () => {
  const role = getRole();
  // const hasWorkerPermission = getWorkerPermission();

  // if (!hasWorkerPermission) {
  //   setRole("user");
  //   void Taro.showToast({ title: "你暂无打手端权限", icon: "none" });
  //   void Taro.redirectTo({ url: "/pages/home-user/index" });
  //   return <View className="workerHome" />;
  // }
  const handleGoUserHome = () => {
    void Taro.navigateTo({ url: "/pages/home-user/index" });
  };

  const handleStatusActionClick = (statusKey: StatusAction["key"]) => {
    // TODO(backend): 调用打手状态更新接口
    void Taro.showToast({
      title: statusKey === "online" ? "已切换在线（Mock）" : "已切换休整（Mock）",
      icon: "none"
    });
  };

  const handleGoAllOrders = () => {
    void Taro.navigateTo({ url: "/pages/orders/index" });
  };

  const handleStartOrder = (orderId: string) => {
    // TODO(backend): 接入开始执行订单接口
    void Taro.showToast({ title: `开始处理订单 ${orderId}（Mock）`, icon: "none" });
  };

  const handleOpenAchievement = () => {
    // TODO(backend): 接入打手成就详情页
    void Taro.showToast({ title: "成就详情开发中（Mock）", icon: "none" });
  };

  return (
    <View className="workerCommand">
      <View className="workerCommand__topBar">
        <View className="workerCommand__brandWrap">
          <Text className="workerCommand__brandIcon">⌘</Text>
          <Text className="workerCommand__brandText">欢迎回来，准备好下一次任务了吗？</Text>
        </View>
        <View className="workerCommand__onlineBadge">
          <View className="workerCommand__onlineDot" />
          <Text className="workerCommand__onlineText">在线</Text>
        </View>
      </View>

      <ScrollView scrollY className="workerCommand__scroll">
        <View className="workerCommand__content">
          <View className="workerCommand__heroHeader workerCommand__statsCard">
            <View>
              <Text className="workerCommand__heroTitle">调整状态</Text>
            </View>
            <View className="workerCommand__statusActions">
              {mockStatusActions.map((status) => (
                <View
                  key={status.key}
                  className={`workerCommand__statusBtn ${status.key === "online" ? "workerCommand__statusBtn--online" : ""}`}
                  onClick={() => handleStatusActionClick(status.key)}
                  aria-label={`切换状态为${status.label}`}
                >
                  <Text className="workerCommand__statusBtnText">{status.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className="workerCommand__statsGrid">
            <View className="workerCommand__statsCard workerCommand__statsCard--income">
              <Text className="workerCommand__statsLabel">今日收益</Text>
              <View className="workerCommand__incomeRow">
                <Text className="workerCommand__incomeCurrency">¥</Text>
                <Text className="workerCommand__incomeValue">
                  {mockSummary.todayIncomeText.replace("¥", "")}
                </Text>
              </View>
              <Text className="workerCommand__statsTrend">{mockSummary.incomeTrendText}</Text>
            </View>

            <View className="workerCommand__statsCard workerCommand__statsCardFinish">
              <Text className="workerCommand__statsLabel">完成订单数</Text>
              <Text className="workerCommand__statsValue">{mockSummary.completedOrdersText}</Text>
            </View>

            <View className="workerCommand__statsCard">
              <View className="workerCommand__statsCardFinish">
                <Text className="workerCommand__statsLabel">成功率</Text>
                <Text className="workerCommand__statsValue">{mockSummary.successRateText}</Text>
              </View>
              <View className="workerCommand__progressTrack">
                <View
                  className="workerCommand__progressFill"
                  style={{ width: `${mockSummary.successRateProgress}%` }}
                />
              </View>
            </View>
          </View>

          <View className="workerCommand__sectionHeader">
            <View className="workerCommand__sectionLeft">
              <Text className="workerCommand__sectionTitle">待处理订单</Text>
              <Text className="workerCommand__sectionCount">{mockPendingOrders.length} Active</Text>
            </View>
            <View
              className="workerCommand__sectionLink"
              onClick={handleGoAllOrders}
              aria-label="查看全部订单"
            >
              <Text className="workerCommand__sectionLinkText">全部订单</Text>
              <Text className="workerCommand__sectionLinkArrow">›</Text>
            </View>
          </View>

          <View className="workerCommand__orderList">
            {mockPendingOrders.map((order) => (
              <View key={order.id} className="workerCommand__orderCard">
                <View className="workerCommand__orderMain">
                  <View className="workerCommand__orderTitleRow">
                    <Text className="workerCommand__orderTitle">{order.title}</Text>
                    <Text className="workerCommand__orderDifficulty">{order.difficulty}</Text>
                  </View>
                  <Text className="workerCommand__orderDesc">{order.requirement}</Text>
                  <View className="workerCommand__orderMeta">
                    <Text className="workerCommand__orderMetaItem">⏱ {order.remainTimeText}</Text>
                    <Text className="workerCommand__orderMetaItem workerCommand__orderMetaItem--amount">
                      ￥ {order.amountText.replace("¥", "")}
                    </Text>
                  </View>
                </View>
                <View
                  className="workerCommand__orderAction"
                  onClick={() => handleStartOrder(order.id)}
                  aria-label={`执行${order.title}`}
                >
                  <Text className="workerCommand__orderActionText">{order.actionText}</Text>
                </View>
              </View>
            ))}
          </View>

          <View
            className="workerCommand__achievement"
            onClick={handleOpenAchievement}
            aria-label="查看打手成就"
          >
            <View className="workerCommand__achievementMain">
              <Text className="workerCommand__achievementTitle">{mockAchievement.title}</Text>
              <Text className="workerCommand__achievementDesc">{mockAchievement.desc}</Text>
              <View className="workerCommand__achievementMeta">
                <View className="workerCommand__achievementMetaItem">
                  <Text className="workerCommand__achievementMetaValue">
                    {mockAchievement.rankText}
                  </Text>
                  <Text className="workerCommand__achievementMetaLabel">排名</Text>
                </View>
                <View className="workerCommand__achievementDivider" />
                <View className="workerCommand__achievementMetaItem">
                  <Text className="workerCommand__achievementMetaValue">
                    {mockAchievement.efficiencyText}
                  </Text>
                  <Text className="workerCommand__achievementMetaLabel">效率</Text>
                </View>
              </View>
            </View>
            <Text className="workerCommand__achievementIcon">🏆</Text>
          </View>
        </View>
      </ScrollView>

      <BottomBar role={role} activeKey="home" />

      <View
        className="workerCommand__roleSwitch"
        onClick={handleGoUserHome}
        aria-label="切换到用户端"
      >
        <Text className="workerCommand__roleSwitchText">用户端</Text>
      </View>
    </View>
  );
};

export default WorkerHomePage;
