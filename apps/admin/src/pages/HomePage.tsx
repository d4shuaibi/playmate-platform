import { Card, Descriptions, Typography } from "antd";
import { appEnv } from "../config/env";
import { DEFAULT_API_TIMEOUT_MS } from "@playmate/shared";
import { getAdminAuthSession } from "../services/auth/session";

export const HomePage = () => {
  const session = getAdminAuthSession();

  return (
    <Card>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        管理端基线已就绪
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        该页面为管理系统首页占位，可在此基础上扩展菜单、权限与业务模块。
      </Typography.Paragraph>

      <Descriptions bordered size="middle" column={1}>
        <Descriptions.Item label="应用名">{appEnv.appName}</Descriptions.Item>
        <Descriptions.Item label="环境">{appEnv.appEnv}</Descriptions.Item>
        <Descriptions.Item label="API 基础地址">{appEnv.apiBaseUrl}</Descriptions.Item>
        <Descriptions.Item label="默认 API 超时（ms）">{DEFAULT_API_TIMEOUT_MS}</Descriptions.Item>
        <Descriptions.Item label="当前账号">
          {session?.profile.displayName ?? "-"}
        </Descriptions.Item>
        <Descriptions.Item label="当前角色">
          {session
            ? session.profile.role === "owner"
              ? "老板"
              : session.profile.role === "admin"
                ? "管理员"
                : "客服"
            : "-"}
        </Descriptions.Item>
        <Descriptions.Item label="权限点">
          {session?.profile.permissions.join(", ") ?? "-"}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
};
