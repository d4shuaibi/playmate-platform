import { View, Text, ScrollView, Swiper, SwiperItem, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useMemo, useState } from "react";
import "./index.scss";

type ServiceAgent = {
  id: string;
  name: string;
  title: string;
  status: "online" | "busy" | "offline";
  statusText: string;
  avatarUrl: string;
  qrCodeUrl: string;
  accent: "primary" | "secondary";
};

// TODO(backend): 接入客服列表接口（顾问信息、在线状态、二维码地址、擅长方向）
const mockServiceAgents: ServiceAgent[] = [
  {
    id: "agent-kael",
    name: "Kael",
    title: "专属顾问",
    status: "online",
    statusText: "在线",
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAOgB0U9BgB1em6EAXYV1Wb2VBskCTXY-bJEpr0SmJ0A6i1Uh8b6rpvD1hio7LWF4yZOxfSnN9r2JNXpgZ9HrAz1is0uwZRm28ioZpUq9x0OiGGYidJ0rvRLBlURUxRX1nuMO5v185lM3QGigz5D4MTL67gsaEj451KKwafivXQSDHueK9uHJukY6BijPvMkhuNqWXk-ks_KK4SpEygoK10XMAV-WFrnW2sj4v5FJbFd9Gix2CKcIA-1-Zs64IbNYWgIHpUWu06KA0",
    qrCodeUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBeHJVC74Y0FRzftS9onLe-LvjT2RZaYth160tDsVAtaUI_Zu9HxiCymeKJP8faS5-t4G8X2hQM-PyGkmncBCOqaBEiB0SX8BJ_k_ikSNbJ6J7rJUt1TPel4SSIvtVhCYdHB7ZtjZAybckAH74PnOD07e52vyttdAxzkos9HIvFmth6VlE1ezgfhcusHv3alEGb7P13vnCuMxUgp1atpJzaeZctb0o3XCsdRhAFHTeYAimMGpUCeTf9GoajOvM4T2zQ1baJzHOPueA",
    accent: "primary"
  },
  {
    id: "agent-valkyrie",
    name: "Valkyrie",
    title: "战术教练",
    status: "busy",
    statusText: "忙碌中",
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCKBCTrK4PAQsUELh4Ijx2mpvr4aCYtvHyQKxqyUsJ49C-wvEH80Wpa9fuUbfYJ_Kp5CwIt4DQrizdfY-AsHJmnuW8nfMVPM7KVHQGp3fVsWFSD39P9qEIcx9f5rzlaCohKfRslzzgl6kVSOK62S5ff0EV37YDRjGyyEyo7fGgEiK5wgh61baty-Ie0_TkNRTlErapTSoqnDfiUL6nTB7CsFkifzkVimNCiA-_-8tP3aeXjn4A-fgRmGsz--MHkjJdZFmZiixIjaM8",
    qrCodeUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDGX2yU3uMbbO63xHBA10ZxP1_Eh3jFnxew2a2DqWNXWc5pElhe5vXDgZU2qen8vAOEgrJgFDdSYbvRHh3ovG794-8xgX-GupUcmVBfsAFiwiC0E3C_680OC9exiAauh3kAntxrLw9rKv3Vakuj2vpS2YRQHeYBATCIY6v1XjS94_8v1H0qbU9tLWHRBzseKWuOYU2rGlxPN-PJfaszjX3cjG599zFJNWbz9ik86uK9RMGdxnl1ecsNo7GuYJAeTMhS26rlXOzXIKs",
    accent: "secondary"
  }
];

const CustomerServicePage = () => {
  const [activeAgentIndex, setActiveAgentIndex] = useState(0);

  const activeAgent = useMemo(
    () => mockServiceAgents[activeAgentIndex] ?? mockServiceAgents[0],
    [activeAgentIndex]
  );

  const handleSaveQrCode = () => {
    // TODO(backend): 接入二维码下载/保存到相册（含权限申请）
    void Taro.showToast({ title: `已保存 ${activeAgent.name} 二维码（Mock）`, icon: "none" });
  };

  return (
    <View className="customerService">
      <ScrollView className="customerService__scroll" scrollY enhanced showScrollbar={false}>
        <View className="customerService__glow" />
        <View className="customerService__header">
          <Text className="customerService__headline">扫码添加</Text>
          <Text className="customerService__subHeadline">专属客服</Text>
        </View>

        <Swiper
          className="customerService__swiper"
          current={activeAgentIndex}
          circular
          onChange={(event) => setActiveAgentIndex(event.detail.current)}
        >
          {mockServiceAgents.map((agent) => {
            const isPrimary = agent.accent === "primary";
            return (
              <SwiperItem key={agent.id}>
                <View className="customerService__slide">
                  <View className="customerService__card">
                    <View
                      className={`customerService__cardAccent ${isPrimary ? "customerService__cardAccent--primary" : "customerService__cardAccent--secondary"}`}
                    />
                    <View className="customerService__avatarWrap">
                      <Image
                        className="customerService__avatar"
                        src={agent.avatarUrl}
                        mode="aspectFill"
                      />
                    </View>
                    <View className="customerService__nameRow">
                      <Text className="customerService__agentTitle">{agent.title}：</Text>
                      <Text
                        className={`customerService__agentName ${isPrimary ? "customerService__agentName--primary" : "customerService__agentName--secondary"}`}
                      >
                        {agent.name}
                      </Text>
                    </View>
                    <View className="customerService__statusRow">
                      <View
                        className={`customerService__statusDot ${
                          agent.status === "online"
                            ? "customerService__statusDot--online"
                            : agent.status === "busy"
                              ? "customerService__statusDot--busy"
                              : "customerService__statusDot--offline"
                        }`}
                      />
                      <Text className="customerService__statusText">{agent.statusText}</Text>
                    </View>

                    <View className="customerService__qrFrame">
                      <View
                        className={`customerService__corner customerService__corner--tl ${
                          isPrimary
                            ? "customerService__corner--primary"
                            : "customerService__corner--secondary"
                        }`}
                      />
                      <View
                        className={`customerService__corner customerService__corner--tr ${
                          isPrimary
                            ? "customerService__corner--primary"
                            : "customerService__corner--secondary"
                        }`}
                      />
                      <View
                        className={`customerService__corner customerService__corner--bl ${
                          isPrimary
                            ? "customerService__corner--secondary"
                            : "customerService__corner--primary"
                        }`}
                      />
                      <View
                        className={`customerService__corner customerService__corner--br ${
                          isPrimary
                            ? "customerService__corner--secondary"
                            : "customerService__corner--primary"
                        }`}
                      />
                      <View className="customerService__qrInner">
                        <Image
                          className="customerService__qrImage"
                          src={agent.qrCodeUrl}
                          mode="aspectFill"
                        />
                      </View>
                    </View>
                  </View>
                </View>
              </SwiperItem>
            );
          })}
        </Swiper>

        <View className="customerService__dotRow">
          {mockServiceAgents.map((agent, index) => (
            <View
              key={agent.id}
              className={`customerService__dot ${index === activeAgentIndex ? "customerService__dot--active" : ""}`}
            />
          ))}
        </View>
      </ScrollView>

      <View className="customerService__footer">
        <View
          className="customerService__primaryBtn"
          onClick={handleSaveQrCode}
          aria-label="保存二维码"
        >
          <Text className="customerService__primaryBtnText">保存二维码</Text>
        </View>
      </View>
    </View>
  );
};

export default CustomerServicePage;
