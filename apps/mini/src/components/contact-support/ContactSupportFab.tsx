import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { Service } from "@nutui/icons-react-taro";
import "./contact-support.scss";

type ContactSupportFabProps = {
  /** 来源页标识，透传给客服页用于展示咨询上下文 */
  from: string;
  role?: string;
  bizId?: string;
};

export const ContactSupportFab = ({ from, role, bizId }: ContactSupportFabProps) => {
  const handleClick = () => {
    const query = new URLSearchParams();
    query.set("from", from);
    if (role) query.set("role", role);
    if (bizId) query.set("id", bizId);
    void Taro.navigateTo({ url: `/pages/customer-service/index?${query.toString()}` });
  };

  return (
    <View className="contactSupportFab" onClick={handleClick} aria-label="联系客服">
      <Service className="contactSupportFab__icon" />
      <Text className="contactSupportFab__text">客服</Text>
    </View>
  );
};
