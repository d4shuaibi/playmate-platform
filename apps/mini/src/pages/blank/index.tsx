import { View, Text } from "@tarojs/components";
import { useRouter } from "@tarojs/taro";
import "./index.scss";

const BlankPage = () => {
  const router = useRouter();
  const title = decodeURIComponent(router.params?.title ?? "页面建设中");

  return (
    <View className="blankPage">
      <View className="blankPage__card">
        <Text className="blankPage__title">{title}</Text>
        <Text className="blankPage__desc">
          该页面暂未完成，先使用空白页占位，保证底部切换正常。
        </Text>
      </View>
    </View>
  );
};

export default BlankPage;
