import { View, Text, ScrollView } from "@tarojs/components";
import "./index.scss";

/**
 * 协议说明页：文案为夜曲电竞小程序占位说明，上线前可由法务替换为正式版本。
 */
const AgreementPage = () => {
  return (
    <ScrollView className="agreementPage" scrollY enhanced showScrollbar={false}>
      <Text className="agreementPage__title">用户服务协议与隐私说明</Text>
      <Text className="agreementPage__paragraph">
        我们深知个人信息对您的重要性，将严格遵守法律法规，遵循隐私保护原则，为您提供更安全、可靠的服务。
      </Text>
      <Text className="agreementPage__paragraph">
        本说明适用于夜曲电竞小程序向您提供的陪玩/代练信息展示与下单相关服务。在您使用本小程序前，请仔细阅读各条款；涉及敏感个人信息处理时，我们将在具体场景再次征得您的同意。
      </Text>
      <Text className="agreementPage__subtitle">1. 账号注册与登录</Text>
      <Text className="agreementPage__paragraph">
        为履行网络实名制相关要求，在您注册或登录时，我们可能需要收集您的手机号码、微信 OpenID
        等信息，用于创建账号、保障交易安全与客服联络。
      </Text>
      <Text className="agreementPage__subtitle">2. 信息的使用与存储</Text>
      <Text className="agreementPage__paragraph">
        我们仅在实现产品功能所必需的范围内使用您的信息，并采取合理可行的安全措施保护数据安全。除非法律法规另有规定或获得您的授权，我们不会向无关第三方提供您的个人信息。
      </Text>
      <Text className="agreementPage__subtitle">3. 联系我们</Text>
      <Text className="agreementPage__paragraph">
        若您对本说明有疑问或需行使相关权利，可通过小程序内客服入口或平台公布的联系方式与我们联系。
      </Text>
      <View className="agreementPage__footerSpace" />
    </ScrollView>
  );
};

export default AgreementPage;
