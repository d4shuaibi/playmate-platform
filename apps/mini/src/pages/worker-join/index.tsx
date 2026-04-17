import { View, Text, ScrollView, Input, Picker } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useMemo, useState } from "react";
import "./index.scss";
import { getRole } from "../../utils/role";

type AssessmentOption = {
  value: string;
  label: string;
};

type JoinDraft = {
  realName: string;
  age: string;
  phone: string;
  idNo: string;
  assessmentType: string;
};

// TODO(backend): 后端返回考核类型枚举（value/label/是否可用/说明）
const mockAssessmentOptions: AssessmentOption[] = [
  { value: "moba", label: "MOBA 技术考核 (王者/LOL)" },
  { value: "fps", label: "FPS 竞技考核 (和平/永劫)" },
  { value: "strategy", label: "战术策略考核" },
  { value: "all-around", label: "全能打手综合考核" }
];

const WorkerJoinPage = () => {
  const role = getRole();
  const [draft, setDraft] = useState<JoinDraft>({
    realName: "",
    age: "",
    phone: "",
    idNo: "",
    assessmentType: ""
  });

  const assessmentIndex = useMemo(() => {
    const idx = mockAssessmentOptions.findIndex((item) => item.value === draft.assessmentType);
    return idx >= 0 ? idx : 0;
  }, [draft.assessmentType]);

  const selectedAssessmentLabel = useMemo(() => {
    const selected = mockAssessmentOptions.find((item) => item.value === draft.assessmentType);
    return selected?.label ?? "请选择考核类型";
  }, [draft.assessmentType]);

  const canSubmit = useMemo(() => {
    if (!draft.realName.trim()) return false;
    if (!draft.age.trim()) return false;
    if (!draft.phone.trim()) return false;
    if (!draft.idNo.trim()) return false;
    if (!draft.assessmentType.trim()) return false;
    return true;
  }, [draft]);

  const handleGoBack = () => {
    const pages = Taro.getCurrentPages();
    if (pages.length > 1) {
      void Taro.navigateBack();
      return;
    }
    void Taro.redirectTo({ url: "/pages/me/index" });
  };

  const handleSubmit = () => {
    if (!canSubmit) {
      void Taro.showToast({ title: "请完善入驻资料", icon: "none" });
      return;
    }
    // TODO(backend): 提交打手入驻申请接口（实名信息、考核类型、手机号、身份证等）
    // TODO(backend): 返回审核状态（待审核/已通过/已拒绝）及提示文案
    // TODO(backend): 若通过，后端应下发 workerPermission/role，并引导切换到打手端
    void Taro.showToast({ title: "已提交申请（Mock）", icon: "none" });
    // TODO(backend): 接入提交接口后，用返回的 refNo/status 跳转到进度页
    setTimeout(() => {
      void Taro.navigateTo({
        url: "/pages/worker-join-progress/index?status=reviewing&ref=2026-X-0892"
      });
    }, 350);
  };

  return (
    <View className="workerJoin">
      <View className="workerJoin__topBar">
        <View className="workerJoin__topLeft">
          <View className="workerJoin__iconBtn" onClick={handleGoBack} aria-label="返回上一页">
            <Text className="workerJoin__iconText">←</Text>
          </View>
          <Text className="workerJoin__topTitle">打手入驻</Text>
        </View>
        <View className="workerJoin__topRight">
          <Text className="workerJoin__roleHint">{role === "worker" ? "WORKER" : "USER"}</Text>
        </View>
      </View>

      <ScrollView className="workerJoin__scroll" scrollY enhanced showScrollbar={false}>
        <View className="workerJoin__hero">
          <View className="workerJoin__heroAccent" />
          <Text className="workerJoin__heroTitle">入驻资料填写</Text>
          <Text className="workerJoin__heroDesc">
            请确保提交信息的真实性，我们将于 24 小时内完成审核。
          </Text>
        </View>

        <View className="workerJoin__form">
          <View className="workerJoin__field">
            <Text className="workerJoin__label">真实姓名</Text>
            <Input
              className="workerJoin__input"
              value={draft.realName}
              onInput={(e) =>
                setDraft((prev) => ({ ...prev, realName: String(e.detail.value ?? "") }))
              }
              placeholder="请输入姓名"
              placeholderClass="workerJoin__placeholder"
              aria-label="输入真实姓名"
            />
          </View>

          <View className="workerJoin__field">
            <Text className="workerJoin__label">年龄</Text>
            <Input
              className="workerJoin__input"
              type="number"
              value={draft.age}
              onInput={(e) => setDraft((prev) => ({ ...prev, age: String(e.detail.value ?? "") }))}
              placeholder="请输入您的真实年龄"
              placeholderClass="workerJoin__placeholder"
              aria-label="输入年龄"
            />
          </View>

          <View className="workerJoin__field">
            <Text className="workerJoin__label">手机号码</Text>
            <View className="workerJoin__phoneRow">
              <Text className="workerJoin__phonePrefix">+86</Text>
              <Input
                className="workerJoin__input workerJoin__input--phone"
                type="text"
                value={draft.phone}
                onInput={(e) =>
                  setDraft((prev) => ({ ...prev, phone: String(e.detail.value ?? "") }))
                }
                placeholder="请输入手机号"
                placeholderClass="workerJoin__placeholder"
                aria-label="输入手机号码"
              />
            </View>
          </View>

          <View className="workerJoin__field">
            <Text className="workerJoin__label">身份证号</Text>
            <Input
              className="workerJoin__input"
              value={draft.idNo}
              onInput={(e) => setDraft((prev) => ({ ...prev, idNo: String(e.detail.value ?? "") }))}
              placeholder="请输入18位身份证号码"
              placeholderClass="workerJoin__placeholder"
              aria-label="输入身份证号"
            />
          </View>

          <View className="workerJoin__field">
            <Text className="workerJoin__label">考核类型</Text>
            <Picker
              mode="selector"
              range={mockAssessmentOptions.map((item) => item.label)}
              value={assessmentIndex}
              onChange={(e) => {
                const index = Number(e.detail.value);
                const option = mockAssessmentOptions[index];
                setDraft((prev) => ({ ...prev, assessmentType: option?.value ?? "" }));
              }}
            >
              <View className="workerJoin__select">
                <Text
                  className={`workerJoin__selectText ${
                    draft.assessmentType ? "workerJoin__selectText--active" : ""
                  }`}
                >
                  {selectedAssessmentLabel}
                </Text>
                <Text className="workerJoin__selectArrow">⌄</Text>
              </View>
            </Picker>
          </View>

          <Text className="workerJoin__agreementHint">
            点击提交即表示您同意《打手服务协议》及《隐私条款》，我们将严格保护您的个人隐私安全。
          </Text>
        </View>
      </ScrollView>

      <View className="workerJoin__footer">
        <View
          className={`workerJoin__submitBtn ${canSubmit ? "workerJoin__submitBtn--active" : ""}`}
          onClick={handleSubmit}
          aria-label="提交打手入驻申请"
        >
          <Text className="workerJoin__submitBtnText">提交申请</Text>
        </View>
      </View>
    </View>
  );
};

export default WorkerJoinPage;
