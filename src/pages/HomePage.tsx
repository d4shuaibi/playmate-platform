import { PageContainer } from "../components/common/PageContainer";
import { appEnv } from "../config/env";

export const HomePage = () => {
  return (
    <PageContainer
      title="项目初始化完成"
      description="当前页面为基线首页，可在此基础上扩展业务模块与路由。"
    >
      <div className="grid gap-3 text-sm text-slate-700">
        <p className="rounded bg-slate-50 px-3 py-2">
          <span className="font-medium">应用名：</span>
          {appEnv.appName}
        </p>
        <p className="rounded bg-slate-50 px-3 py-2">
          <span className="font-medium">环境：</span>
          {appEnv.appEnv}
        </p>
        <p className="rounded bg-slate-50 px-3 py-2">
          <span className="font-medium">API 基础地址：</span>
          {appEnv.apiBaseUrl}
        </p>
      </div>
    </PageContainer>
  );
};
