import { View, Text, ScrollView, Input, Picker } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useEffect, useMemo, useState } from "react";
import "./index.scss";
import { getRole } from "../../utils/role";
import {
  applyWorkerJoin,
  fetchWorkerAssessmentOptions,
  type WorkerAssessmentOption
} from "../../services";
import { getToken } from "../../utils/session";

type JoinDraft = {
  realName: string;
  age: string;
  phone: string;
  idNo: string;
  assessmentType: string;
};

const WorkerJoinPage = () => {
  const role = getRole();
  const [submitting, setSubmitting] = useState(false);
  const [assessmentOptions, setAssessmentOptions] = useState<WorkerAssessmentOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [draft, setDraft] = useState<JoinDraft>({
    realName: "",
    age: "",
    phone: "",
    idNo: "",
    assessmentType: ""
  });

  useEffect(() => {
    void (async () => {
      try {
        setOptionsLoading(true);
        const items = await fetchWorkerAssessmentOptions();
        const filtered = items.filter((o) => !o.disabled);
        setAssessmentOptions(filtered);
        setDraft((prev) => {
          const keep =
            prev.assessmentType && filtered.some((option) => option.value === prev.assessmentType);
          return {
            ...prev,
            assessmentType: keep ? prev.assessmentType : (filtered[0]?.value ?? "")
          };
        });
      } catch (error: unknown) {
        void Taro.showToast({
          title: error instanceof Error ? error.message : "考核类型加载失败",
          icon: "none"
        });
        setAssessmentOptions([]);
      } finally {
        setOptionsLoading(false);
      }
    })();
  }, []);

  const assessmentIndex = useMemo(() => {
    const idx = assessmentOptions.findIndex((item) => item.value === draft.assessmentType);
    return idx >= 0 ? idx : 0;
  }, [draft.assessmentType, assessmentOptions]);

  const selectedAssessmentLabel = useMemo(() => {
    const selected = assessmentOptions.find((item) => item.value === draft.assessmentType);
    return selected?.label ?? (optionsLoading ? "加载考核类型…" : "请选择考核类型");
  }, [draft.assessmentType, assessmentOptions, optionsLoading]);

  const canSubmit = useMemo(() => {
    if (!draft.realName.trim()) return false;
    if (!draft.age.trim()) return false;
    if (!draft.phone.trim()) return false;
    if (!draft.idNo.trim()) return false;
    if (!draft.assessmentType.trim()) return false;
    if (assessmentOptions.length === 0) return false;
    return true;
  }, [draft, assessmentOptions.length]);

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
    if (!getToken()) {
      void Taro.showToast({ title: "请先登录后再提交申请", icon: "none" });
      return;
    }
    if (submitting) return;

    setSubmitting(true);
    void (async () => {
      try {
        const result = await applyWorkerJoin({
          realName: draft.realName.trim(),
          age: Number(draft.age),
          phone: draft.phone.trim(),
          idNo: draft.idNo.trim(),
          assessmentType: draft.assessmentType.trim()
        });
        void Taro.showToast({ title: "已提交申请", icon: "none" });
        void Taro.navigateTo({
          url: `/pages/worker-join-progress/index?status=${encodeURIComponent(result.status)}&ref=${encodeURIComponent(result.refNo)}`
        });
      } catch (error) {
        void Taro.showToast({
          title: error instanceof Error ? error.message : "提交失败，请稍后重试",
          icon: "none"
        });
      } finally {
        setSubmitting(false);
      }
    })();
  };

  const pickerRange = assessmentOptions.map((item) => item.label);

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
              range={pickerRange.length > 0 ? pickerRange : ["暂无选项"]}
              value={pickerRange.length > 0 ? assessmentIndex : 0}
              disabled={pickerRange.length === 0}
              onChange={(e) => {
                const index = Number(e.detail.value);
                const option = assessmentOptions[index];
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
          className={`workerJoin__submitBtn ${canSubmit && !submitting ? "workerJoin__submitBtn--active" : ""}`}
          onClick={handleSubmit}
          aria-label="提交打手入驻申请"
        >
          <Text className="workerJoin__submitBtnText">{submitting ? "提交中..." : "提交申请"}</Text>
        </View>
      </View>
    </View>
  );
};

export default WorkerJoinPage;
