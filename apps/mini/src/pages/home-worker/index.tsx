import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import "./index.scss";

const WorkerHomePage = () => {
  const handleGoUserHome = () => {
    void Taro.navigateTo({ url: "/pages/home-user/index" });
  };

  const handleGoOrders = () => {};
  const handleGoIncome = () => {};
  const handleGoMe = () => {};

  return (
    <View className="workerHome">
      <View className="workerHome__header">
        <View className="workerHome__topRow">
          <View className="workerHome__avatar" />
          <Text className="workerHome__brand">NOCTURNE</Text>
          <View className="workerHome__topRight">
            <View className="workerHome__iconBtn" aria-label="搜索">
              <Text className="workerHome__iconText">🔍</Text>
            </View>
            <View className="workerHome__iconBtn" aria-label="通知">
              <Text className="workerHome__iconText">🔔</Text>
            </View>
          </View>
        </View>

        <View className="workerHome__earningsRow">
          <View className="workerHome__earningsLeft">
            <Text className="workerHome__earningsLabel">TODAY'S EARNINGS</Text>
            <Text className="workerHome__earningsValue">¥2,840.00</Text>
          </View>
          <View className="workerHome__effCard">
            <Text className="workerHome__effLabel">EFFICIENCY</Text>
            <Text className="workerHome__effValue">A+ Level</Text>
          </View>
        </View>

        <View className="workerHome__actions">
          <View className="workerHome__actionCard workerHome__actionCard--online">
            <Text className="workerHome__actionIcon">📡</Text>
            <Text className="workerHome__actionText workerHome__actionText--online">在线</Text>
          </View>
          <View className="workerHome__actionCard workerHome__actionCard--cup">
            <Text className="workerHome__actionIcon">🏆</Text>
            <Text className="workerHome__actionText">忙碌</Text>
          </View>
          <View className="workerHome__actionCard workerHome__actionCard--power">
            <Text className="workerHome__actionIcon">⏻</Text>
            <Text className="workerHome__actionText">离线</Text>
          </View>
        </View>

        <View className="workerHome__statsGrid">
          <View className="workerHome__statCard">
            <Text className="workerHome__statLabel">今日接单</Text>
            <View className="workerHome__statRow">
              <Text className="workerHome__statValue">18</Text>
              <Text className="workerHome__statUnit">Orders</Text>
            </View>
          </View>
          <View className="workerHome__statCard">
            <Text className="workerHome__statLabel">平均完成时间</Text>
            <View className="workerHome__statRow">
              <Text className="workerHome__statValue">32</Text>
              <Text className="workerHome__statUnit">Min</Text>
            </View>
          </View>
        </View>

        <View className="workerHome__banner">
          <View className="workerHome__bannerChip">
            <Text className="workerHome__bannerChipText">ACTIVE</Text>
          </View>
          <Text className="workerHome__bannerTitle">周末激励计划</Text>
          <Text className="workerHome__bannerDesc">完成指定任务领取 ¥500 奖金</Text>
        </View>
      </View>

      <View className="workerHome__sectionHeader">
        <Text className="workerHome__sectionTitle">待办任务 3</Text>
        <Text className="workerHome__sectionAction">VIEW ALL</Text>
      </View>

      <View className="workerHome__taskList">
        <View className="workerHome__taskItem workerHome__taskItem--primary">
          <View className="workerHome__taskIconBox workerHome__taskIconBox--warn">
            <Text className="workerHome__taskIcon">🔒</Text>
          </View>
          <View className="workerHome__taskMain">
            <Text className="workerHome__taskTitle">接单提醒（高优先级）</Text>
            <Text className="workerHome__taskSub">订单号：DX-9281-2201 · 正在等待响应</Text>
          </View>
          <View className="workerHome__taskRight">
            <Text className="workerHome__taskTime">3M AGO</Text>
            <Text className="workerHome__taskChevron">›</Text>
          </View>
        </View>

        <View className="workerHome__taskItem">
          <View className="workerHome__taskIconBox">
            <Text className="workerHome__taskIcon">🛡️</Text>
          </View>
          <View className="workerHome__taskMain">
            <Text className="workerHome__taskTitle">安全验证</Text>
            <Text className="workerHome__taskSub">请完成人脸识别保障账户安全</Text>
          </View>
          <View className="workerHome__taskGo">GO</View>
        </View>

        <View className="workerHome__taskItem">
          <View className="workerHome__taskIconBox">
            <Text className="workerHome__taskIcon">📅</Text>
          </View>
          <View className="workerHome__taskMain">
            <Text className="workerHome__taskTitle">设置明日排班</Text>
            <Text className="workerHome__taskSub">预设接单时间可获得额外流量加成</Text>
          </View>
          <Text className="workerHome__taskChevron">›</Text>
        </View>
      </View>

      <View className="workerHome__fab" aria-label="新增">
        <Text className="workerHome__fabText">＋</Text>
      </View>

      <View className="workerHome__bottomBar">
        <View className="workerHome__bottomItem workerHome__bottomItem--active">
          <Text className="workerHome__bottomIcon">▦</Text>
          <Text className="workerHome__bottomText workerHome__bottomText--active">工作台</Text>
        </View>
        <View className="workerHome__bottomItem" onClick={handleGoOrders}>
          <Text className="workerHome__bottomIcon">▤</Text>
          <Text className="workerHome__bottomText">订单</Text>
        </View>
        <View className="workerHome__bottomItem" onClick={handleGoIncome}>
          <Text className="workerHome__bottomIcon">▣</Text>
          <Text className="workerHome__bottomText">收益</Text>
        </View>
        <View className="workerHome__bottomItem" onClick={handleGoMe}>
          <Text className="workerHome__bottomIcon">👤</Text>
          <Text className="workerHome__bottomText">我的</Text>
        </View>
      </View>

      <View className="workerHome__roleSwitch" onClick={handleGoUserHome} aria-label="切换到用户端">
        <Text className="workerHome__roleSwitchText">用户端</Text>
      </View>
    </View>
  );
};

export default WorkerHomePage;
