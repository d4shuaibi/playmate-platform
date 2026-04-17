import { View, Text, ScrollView } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { useMemo } from "react";
import "./index.scss";

type JoinProgressStatus = "submitted" | "reviewing" | "approved" | "rejected";

type JoinProgressStep = {
  key: string;
  title: string;
  subtitle: string;
  timestampText?: string;
  state: "done" | "active" | "todo" | "failed";
  hintText?: string;
};

type JoinProgressDetail = {
  // TODO(backend): 后端返回申请单 ID/编号
  refNo: string;
  // TODO(backend): 后端返回当前审核状态（submitted/reviewing/approved/rejected）
  status: JoinProgressStatus;
  // TODO(backend): 后端返回页面文案（例如审核时长/原因/下一步引导）
  heroTitle: string;
  heroDesc: string;
  steps: JoinProgressStep[];
};

const buildMockDetail = (status: JoinProgressStatus, refNo: string): JoinProgressDetail => {
  const base: JoinProgressDetail = {
    refNo,
    status,
    heroTitle: "入驻进度",
    heroDesc: "审核由网页端处理中，请耐心等待",
    steps: []
  };

  const stepSubmitted: JoinProgressStep = {
    key: "submitted",
    title: "资料已提交",
    subtitle: "Application Submitted",
    timestampText: "TIMESTAMP: 2026-04-13 14:32:10",
    state: "done"
  };

  const stepReviewing: JoinProgressStep = {
    key: "reviewing",
    title: "正在审核",
    subtitle: "Under Review - Active State",
    state: status === "reviewing" ? "active" : status === "submitted" ? "todo" : "done",
    hintText:
      status === "reviewing" ? "平台正在核验你的身份与游戏能力数据，请保持手机畅通。" : undefined
  };

  const stepFinal: JoinProgressStep = {
    key: "final",
    title: "审核结果",
    subtitle: "Final Result",
    state: status === "approved" ? "done" : status === "rejected" ? "failed" : "todo",
    hintText:
      status === "approved"
        ? "恭喜通过审核，你已获得打手端权限。"
        : status === "rejected"
          ? "很遗憾未通过审核，请核对资料后重新提交。"
          : undefined
  };

  const heroDesc =
    status === "approved"
      ? "审核已通过，你可以切换到打手端开始接单"
      : status === "rejected"
        ? "审核未通过，请根据提示修改后重新申请"
        : base.heroDesc;

  return {
    ...base,
    heroDesc,
    steps: [stepSubmitted, stepReviewing, stepFinal]
  };
};

const WorkerJoinProgressPage = () => {
  const router = useRouter();
  const status = (router.params.status as JoinProgressStatus | undefined) ?? "reviewing";
  const refNo = router.params.ref ?? "2026-X-0892";

  const detail = useMemo(() => buildMockDetail(status, refNo), [status, refNo]);

  const handleGoBack = () => {
    const pages = Taro.getCurrentPages();
    if (pages.length > 1) {
      void Taro.navigateBack();
      return;
    }
    void Taro.redirectTo({ url: "/pages/me/index" });
  };

  const handlePrimaryAction = () => {
    if (detail.status === "approved") {
      // TODO(backend): 以服务端为准下发权限/角色；这里仅做 mock 引导
      void Taro.showToast({ title: "请在“我的”切换到打手端（Mock）", icon: "none" });
      return;
    }
    if (detail.status === "rejected") {
      // TODO(backend): 支持重新编辑已提交资料（预填），或创建新的申请单
      void Taro.redirectTo({ url: "/pages/worker-join/index" });
      return;
    }
    void Taro.showToast({ title: "审核处理中（Mock）", icon: "none" });
  };

  const primaryText =
    detail.status === "approved"
      ? "切换到打手端"
      : detail.status === "rejected"
        ? "重新提交资料"
        : "我知道了";

  return (
    <View className="workerJoinProgress">
      <View className="workerJoinProgress__topBar">
        <View className="workerJoinProgress__topLeft">
          <View
            className="workerJoinProgress__iconBtn"
            onClick={handleGoBack}
            aria-label="返回上一页"
          >
            <Text className="workerJoinProgress__iconText">←</Text>
          </View>
          <Text className="workerJoinProgress__topTitle">入驻进度</Text>
        </View>
        <View className="workerJoinProgress__topRight">
          <Text className="workerJoinProgress__topGhost"> </Text>
        </View>
      </View>

      <ScrollView className="workerJoinProgress__scroll" scrollY enhanced showScrollbar={false}>
        <View className="workerJoinProgress__heroCard">
          <View className="workerJoinProgress__heroIconGhost">
            <Text className="workerJoinProgress__heroIconText">⎈</Text>
          </View>
          <View className="workerJoinProgress__heroAccent" />
          <Text className="workerJoinProgress__heroTitle">{detail.heroTitle}</Text>
          <Text className="workerJoinProgress__heroDesc">{detail.heroDesc}</Text>
        </View>

        <View className="workerJoinProgress__timelineCard">
          <View className="workerJoinProgress__timelineHeader">
            <Text className="workerJoinProgress__timelineLabel">Status Timeline</Text>
            <View className="workerJoinProgress__refChip">
              <Text className="workerJoinProgress__refChipText">REF: {detail.refNo}</Text>
            </View>
          </View>

          <View className="workerJoinProgress__timeline">
            <View className="workerJoinProgress__timelineLine" />

            {detail.steps.map((step, idx) => (
              <View
                key={step.key}
                className={`workerJoinProgress__step ${idx === detail.steps.length - 1 ? "" : "workerJoinProgress__step--spaced"}`}
              >
                {step.state === "active" ? (
                  <View className="workerJoinProgress__stepActiveLine" />
                ) : null}
                <View
                  className={`workerJoinProgress__stepIcon ${
                    step.state === "done"
                      ? "workerJoinProgress__stepIcon--done"
                      : step.state === "active"
                        ? "workerJoinProgress__stepIcon--active"
                        : step.state === "failed"
                          ? "workerJoinProgress__stepIcon--failed"
                          : "workerJoinProgress__stepIcon--todo"
                  }`}
                  aria-label={`${step.title}状态`}
                >
                  <Text className="workerJoinProgress__stepIconText">
                    {step.state === "done"
                      ? "✓"
                      : step.state === "active"
                        ? "↻"
                        : step.state === "failed"
                          ? "!"
                          : "○"}
                  </Text>
                </View>

                <View className="workerJoinProgress__stepMain">
                  <Text
                    className={`workerJoinProgress__stepTitle ${
                      step.state === "active"
                        ? "workerJoinProgress__stepTitle--active"
                        : step.state === "todo"
                          ? "workerJoinProgress__stepTitle--todo"
                          : step.state === "failed"
                            ? "workerJoinProgress__stepTitle--failed"
                            : ""
                    }`}
                  >
                    {step.title}
                  </Text>
                  <Text className="workerJoinProgress__stepSub">{step.subtitle}</Text>

                  {step.timestampText ? (
                    <View className="workerJoinProgress__timestampChip">
                      <Text className="workerJoinProgress__timestampText">
                        {step.timestampText}
                      </Text>
                    </View>
                  ) : null}

                  {step.hintText ? (
                    <View className="workerJoinProgress__hintBox">
                      <Text className="workerJoinProgress__hintText">{step.hintText}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            ))}
          </View>

          <View className="workerJoinProgress__bgGlow" />
        </View>
      </ScrollView>

      <View className="workerJoinProgress__footer">
        <View
          className="workerJoinProgress__primaryBtn"
          onClick={handlePrimaryAction}
          aria-label={primaryText}
        >
          <Text className="workerJoinProgress__primaryBtnText">{primaryText}</Text>
        </View>
      </View>
    </View>
  );
};

export default WorkerJoinProgressPage;
