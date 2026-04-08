import { View, Text } from "@tarojs/components";
import "./index.scss";
import { BottomBar } from "../../components/bottom-bar/BottomBar";
import "../../components/bottom-bar/bottom-bar.scss";
import { getRole } from "../../utils/role";

const CategoryPage = () => {
  const role = getRole();

  return (
    <View className="pageShell">
      <View className="pageCard">
        <Text className="pageTitle">分类</Text>
        <Text className="pageDesc">用户端分类页占位（按游戏/服务类型筛选）。</Text>
      </View>
      <BottomBar role={role} activeKey="category" />
    </View>
  );
};

export default CategoryPage;
