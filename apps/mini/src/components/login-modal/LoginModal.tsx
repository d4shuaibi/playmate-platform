import { View, Text, Button } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useEffect, useState } from "react";
import { loginWithPhoneCode } from "../../services/auth";
import "./login-modal.scss";

type LoginModalProps = {
  /** 是否展示弹层 */
  visible: boolean;
  /** 关闭弹层 */
  onClose: () => void;
  /** 登录成功 */
  onLoginSuccess?: () => void;
};

/**
 * 仅通过「手机号快速验证」登录：勾选协议后点「授权手机号登录」，
 * 将 getPhoneNumber 的 code 发往服务端换手机号并登录；新手机号即新建用户。
 * @see https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/getPhoneNumber.html
 */
export const LoginModal = (props: LoginModalProps) => {
  const { visible, onClose, onLoginSuccess } = props;
  const [isAgreementChecked, setIsAgreementChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsAgreementChecked(false);
    }
  }, [visible]);

  if (!visible) {
    return null;
  }

  const handleToggleAgreement = () => {
    setIsAgreementChecked((prev) => !prev);
  };

  const handleOpenAgreement = () => {
    void Taro.navigateTo({ url: "/pages/agreement/index" });
  };

  const handleGetPhoneNumber = async (e: { detail: { code?: string; errMsg?: string } }) => {
    if (!isAgreementChecked) {
      setIsAgreementChecked(true);
    }
    console.log("phone e", e);
    const phoneCode = e.detail?.code;
    if (!phoneCode) {
      void Taro.showToast({ title: "需要授权手机号才能登录", icon: "none" });
      return;
    }

    setIsSubmitting(true);
    try {
      const wxLoginCode = await new Promise<string>((resolve) => {
        Taro.login({
          success: (res) => resolve(String(res.code ?? "")),
          fail: () => resolve("")
        });
      });

      await loginWithPhoneCode(phoneCode, wxLoginCode || undefined);
      void Taro.showToast({ title: "登录成功", icon: "success" });
      onLoginSuccess?.();
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "登录失败";
      void Taro.showToast({ title: message, icon: "none" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="loginModal">
      <View className="loginModal__mask" onClick={onClose} aria-label="关闭登录" />
      <View className="loginModal__panel">
        <View className="loginModal__content">
          <Text className="loginModal__intro">
            欢迎使用澜动电竞小程序。根据法律要求，使用前请仔细阅读
          </Text>
          <View className="loginModal__links">
            <Text className="loginModal__link" onClick={handleOpenAgreement}>
              《用户服务协议与隐私说明》
            </Text>
          </View>
          <Text className="loginModal__tip">
            登录仅支持手机号验证：勾选协议后点击下方按钮授权，新用户将自动注册。
          </Text>

          <View className="loginModal__checkRow" onClick={handleToggleAgreement}>
            <View
              className={`loginModal__checkbox ${isAgreementChecked ? "loginModal__checkbox--on" : ""}`}
            />
            <Text className="loginModal__checkLabel">我已阅读并同意上述协议</Text>
          </View>
        </View>

        <View className="loginModal__actions">
          <Button className="loginModal__btn loginModal__btn--ghost" onClick={onClose}>
            不同意
          </Button>
          <Button
            className="loginModal__btn loginModal__btn--primary"
            openType="getPhoneNumber"
            loading={isSubmitting}
            disabled={isSubmitting}
            onGetPhoneNumber={(e) => void handleGetPhoneNumber(e)}
          >
            授权手机号登录
          </Button>
        </View>
      </View>
    </View>
  );
};
