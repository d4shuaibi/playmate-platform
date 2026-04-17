import { useEffect, useState } from "react";
import {
  AppstoreOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  LockOutlined,
  UserOutlined
} from "@ant-design/icons";
import { Button, Checkbox, Form, Input, Typography, message } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { requestAdminChallenge, requestAdminLogin } from "../services/auth/api";
import { buildPasswordProof } from "../services/auth/crypto";
import {
  getAdminAuthSession,
  getAdminDefaultPath,
  setAdminAuthSession
} from "../services/auth/session";

type LoginFormValues = {
  username: string;
  password: string;
  remember?: boolean;
};

export const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const session = getAdminAuthSession();
    if (session && session.expiresAt > Date.now()) {
      void navigate(getAdminDefaultPath(session.profile), { replace: true });
    }
  }, [navigate]);

  const handleLogin = (values: LoginFormValues) => {
    setLoading(true);
    void (async () => {
      try {
        const challenge = await requestAdminChallenge(values.username);
        const proof = await buildPasswordProof(values.password, challenge.nonce);
        const authData = await requestAdminLogin({
          username: values.username,
          challengeId: challenge.challengeId,
          proof
        });

        setAdminAuthSession({
          accessToken: authData.accessToken,
          refreshToken: authData.refreshToken,
          expiresAt: Date.now() + authData.expiresIn * 1000,
          profile: authData.profile,
          remember: Boolean(values.remember)
        });

        message.success(`登录成功，欢迎回来 ${authData.profile.displayName}`);
        void navigate(getAdminDefaultPath(authData.profile), { replace: true });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "登录失败，请稍后再试";
        message.error(errorMessage);
      } finally {
        setLoading(false);
      }
    })();
  };

  return (
    <div className="bg-tech relative flex min-h-screen flex-col items-center justify-center overflow-hidden text-on-surface">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -left-[5%] -top-[10%] h-[50%] w-[40%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[5%] h-[40%] w-[30%] rounded-full bg-indigo-200/40 blur-[100px]" />
        <div className="subtle-grid absolute inset-0 opacity-50" />
      </div>

      <header className="fixed top-0 z-50 mx-auto flex h-16 w-full max-w-screen-2xl items-center justify-between px-8">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
            <AppstoreOutlined />
          </div>
          <span className="text-xl font-semibold tracking-tight text-on-surface">
            Ethereal Admin
          </span>
        </div>
        <div className="hidden items-center gap-6 md:flex">
          <span className="cursor-default text-sm font-medium text-on-surface-variant">
            系统状态
          </span>
          <span className="cursor-default text-sm font-medium text-on-surface-variant">
            技术支持
          </span>
        </div>
      </header>

      <main className="z-10 w-full max-w-md px-6 py-12">
        <section className="glass-panel rounded-[1.5rem] border border-white/60 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.06)] md:p-10">
          <div className="mb-10 text-center">
            <Typography.Title
              level={2}
              className="!mb-2 !text-3xl !font-bold !tracking-tight !text-on-surface"
            >
              欢迎回来
            </Typography.Title>
            <Typography.Paragraph className="!mb-0 !text-sm !tracking-wide !text-on-surface-variant">
              管理您的游戏资产全球交易生态
            </Typography.Paragraph>
          </div>

          <Form<LoginFormValues>
            layout="vertical"
            size="large"
            initialValues={{ remember: true }}
            onFinish={handleLogin}
            requiredMark={false}
            className="space-y-2"
          >
            <Form.Item
              label={
                <span className="ml-1 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  用户名
                </span>
              }
              name="username"
              rules={[{ required: true, message: "请输入用户名" }]}
            >
              <Input
                prefix={<UserOutlined className="text-outline" />}
                placeholder="请输入您的用户名"
                className="rounded-xl !border-outline-variant/40 !bg-white/70 !px-4 !py-2.5 !shadow-none hover:!border-primary focus:!border-primary"
              />
            </Form.Item>

            <Form.Item
              label={
                <span className="ml-1 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  密码
                </span>
              }
              name="password"
              rules={[{ required: true, message: "请输入密码" }]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-outline" />}
                placeholder="请输入您的登录密码"
                iconRender={(visible) =>
                  visible ? <EyeTwoTone /> : <EyeInvisibleOutlined className="text-outline" />
                }
                className="rounded-xl !border-outline-variant/40 !bg-white/70 !px-4 !py-2.5 !shadow-none hover:!border-primary focus:!border-primary"
              />
            </Form.Item>

            <div className="flex items-center justify-between px-1">
              <Form.Item<LoginFormValues> name="remember" valuePropName="checked" noStyle>
                <Checkbox className="text-sm text-on-surface-variant">记住我</Checkbox>
              </Form.Item>
              <Link className="text-sm font-medium text-primary hover:text-blue-500" to="/login">
                忘记密码？
              </Link>
            </div>

            <Form.Item className="!mb-0 !mt-6">
              <Button
                htmlType="submit"
                type="primary"
                loading={loading}
                block
                className="!h-[52px] !rounded-xl !border-none !bg-primary-container !text-base !font-semibold shadow-[0_4px_12px_rgba(0,102,255,0.2)] hover:shadow-[0_8px_20px_rgba(0,102,255,0.3)]"
              >
                立即登录
              </Button>
            </Form.Item>
          </Form>

          <div className="mt-8 border-t border-outline-variant/20 pt-8 text-center">
            <p className="text-sm text-on-surface-variant">
              还没有账号？
              <Link className="ml-1 font-semibold text-primary hover:underline" to="/login">
                申请入驻
              </Link>
            </p>
          </div>
        </section>
      </main>

      <footer className="z-10 mt-auto flex w-full flex-col items-center justify-between border-t border-white/20 bg-white/20 px-6 py-6 backdrop-blur-sm md:flex-row md:px-12">
        <span className="mb-4 text-xs font-medium uppercase tracking-wider text-on-surface-variant md:mb-0">
          © 2024 Aetheris Game Systems. All rights reserved.
        </span>
        <div className="flex gap-5 md:gap-8">
          <Link
            className="text-xs font-medium uppercase tracking-wider text-on-surface-variant hover:text-on-surface"
            to="/login"
          >
            隐私政策
          </Link>
          <Link
            className="text-xs font-medium uppercase tracking-wider text-on-surface-variant hover:text-on-surface"
            to="/login"
          >
            服务条款
          </Link>
          <Link
            className="text-xs font-medium uppercase tracking-wider text-on-surface-variant hover:text-on-surface"
            to="/login"
          >
            Cookie 设置
          </Link>
        </div>
      </footer>
    </div>
  );
};
