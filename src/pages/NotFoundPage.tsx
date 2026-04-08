import { Link } from "react-router-dom";
import { PageContainer } from "../components/common/PageContainer";

export const NotFoundPage = () => {
  return (
    <PageContainer title="页面不存在" description="请检查访问路径，或返回首页继续浏览。">
      <Link
        to="/"
        className="inline-flex rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
        aria-label="返回首页"
        tabIndex={0}
      >
        返回首页
      </Link>
    </PageContainer>
  );
};
