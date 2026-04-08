import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import "./index.scss";
import { BottomBar } from "../../components/bottom-bar/BottomBar";
import "../../components/bottom-bar/bottom-bar.scss";
import { getRole, setRole, setToken } from "../../utils/role";
import { request } from "../../services/http";

const UserHomePage = () => {
  const role = getRole();
  const handleGoWorkerHome = () => {
    void Taro.navigateTo({ url: "/pages/home-worker/index" });
  };

  return (
    <View className="userHome">
      <View className="userHome__header">
        <View className="userHome__brandRow">
          <View className="userHome__brandLeft">
            <View className="userHome__avatar" />
            <Text className="userHome__brandName">夜曲电竞</Text>
          </View>
          <View className="userHome__brandRight">
            <View className="userHome__iconBtn" aria-label="通知">
              <Text className="userHome__iconText">🔔</Text>
            </View>
          </View>
        </View>

        <View className="userHome__search">
          <Text className="userHome__searchIcon">🔍</Text>
          <Text className="userHome__searchPlaceholder">搜索精英代练服务...</Text>
        </View>

        <View className="userHome__banner">
          <View className="userHome__bannerOverlay">
            <Text className="userHome__bannerTag">限时优惠</Text>
            <Text className="userHome__bannerTitle">夏季赛</Text>
            <Text className="userHome__bannerSubTitle">冠军冲刺代练</Text>
          </View>
          <View className="userHome__bannerRight">
            <Text className="userHome__bannerRightTitle">GAMING</Text>
            <Text className="userHome__bannerRightSub">SAFE WORK</Text>
          </View>
        </View>

        <View className="userHome__promoInput">
          <Text className="userHome__promoIcon">🎮</Text>
          <Text className="userHome__promoText"> </Text>
        </View>

        <View className="userHome__quickGrid">
          <View className="userHome__quickCard userHome__quickCard--left">
            <Text className="userHome__quickTitle">好评榜</Text>
            <Text className="userHome__quickDesc">最高评分</Text>
          </View>
          <View className="userHome__quickCard userHome__quickCard--right">
            <Text className="userHome__quickTitle">热销榜</Text>
            <Text className="userHome__quickDesc">火爆稳定</Text>
          </View>
        </View>
      </View>

      <View className="userHome__sectionHeader">
        <Text className="userHome__sectionTitle">精英服务</Text>
        <Text className="userHome__sectionAction">查看全部</Text>
      </View>

      <View className="userHome__tabs">
        <View className="userHome__tab userHome__tab--active">
          <Text className="userHome__tabText userHome__tabText--active">全部游戏</Text>
        </View>
        <View className="userHome__tab">
          <Text className="userHome__tabText">王者荣耀</Text>
        </View>
        <View className="userHome__tab">
          <Text className="userHome__tabText">英雄联盟</Text>
        </View>
        <View className="userHome__tab">
          <Text className="userHome__tabText">原神</Text>
        </View>
      </View>

      <View className="userHome__cardGrid">
        <View
          className="userHome__serviceCard"
          onClick={async () => {
            try {
              const loginResult = await Taro.login();
              const apiResult = await request<{ token: string; role: "user" | "worker" }>(
                "/auth/mini/login",
                {
                  method: "POST",
                  body: { code: loginResult.code }
                }
              );
              setToken(apiResult.data.token);
              setRole(apiResult.data.role);

              if (apiResult.data.role === "worker") {
                void Taro.showToast({ title: "已识别为打手，跳转工作台", icon: "none" });
                void Taro.redirectTo({ url: "/pages/home-worker/index" });
                return;
              }

              void Taro.showToast({ title: "下单成功（原型）", icon: "none" });
            } catch (error) {
              console.log("登录失败", error);
              void Taro.showToast({ title: "登录失败，请重试", icon: "none" });
            }
          }}
          aria-label="点击下单（触发登录）"
        >
          <View className="userHome__serviceCover userHome__serviceCover--a">
            <Text className="userHome__coverChip userHome__coverChip--hot">热门</Text>
          </View>
          <Text className="userHome__serviceName">王者荣耀: 排位上分</Text>
          <Text className="userHome__serviceSub">专业多单保障团队</Text>
          <View className="userHome__serviceBottom">
            <Text className="userHome__servicePrice">¥168.00</Text>
          </View>
        </View>

        <View className="userHome__serviceCard">
          <View className="userHome__serviceCover userHome__serviceCover--b">
            <Text className="userHome__coverChip userHome__coverChip--new">新</Text>
          </View>
          <Text className="userHome__serviceName">LOL: 双排指导</Text>
          <Text className="userHome__serviceSub">大师级教练带你学</Text>
          <View className="userHome__serviceBottom">
            <Text className="userHome__servicePrice">¥315.00</Text>
          </View>
        </View>

        <View className="userHome__serviceCard">
          <View className="userHome__serviceCover userHome__serviceCover--c">
            <Text className="userHome__coverChip userHome__coverChip--brand">金铲铲</Text>
          </View>
          <Text className="userHome__serviceName">金铲铲: 快速升级</Text>
          <Text className="userHome__serviceSub">高效冲榜冲段专家</Text>
          <View className="userHome__serviceBottom">
            <Text className="userHome__servicePrice">¥98.00</Text>
          </View>
        </View>

        <View className="userHome__serviceCard">
          <View className="userHome__serviceCover userHome__serviceCover--d">
            <Text className="userHome__coverChip userHome__coverChip--brand">和平精英</Text>
          </View>
          <Text className="userHome__serviceName">和平精英: 王者上分</Text>
          <Text className="userHome__serviceSub">冠军枪法带你冲榜</Text>
          <View className="userHome__serviceBottom">
            <Text className="userHome__servicePrice">¥128.00</Text>
          </View>
        </View>
      </View>

      <View className="userHome__bottomBar">
        <BottomBar role={role} activeKey="home" />
      </View>

      <View className="userHome__roleSwitch" onClick={handleGoWorkerHome} aria-label="切换到打手端">
        <Text className="userHome__roleSwitchText">打手端</Text>
      </View>
    </View>
  );
};

export default UserHomePage;
