import { Outlet } from "react-router-dom";
import { Layout, Typography } from "antd";
import { appEnv } from "../../config/env";

const { Header, Content } = Layout;

export const AppLayout = () => {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        <Typography.Title level={4} style={{ margin: 0, color: "#fff" }}>
          {appEnv.appName}
        </Typography.Title>
        <Typography.Text style={{ color: "rgba(255,255,255,0.85)" }}>
          {appEnv.appEnv}
        </Typography.Text>
      </Header>
      <Content style={{ padding: 24 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <Outlet />
        </div>
      </Content>
    </Layout>
  );
};
