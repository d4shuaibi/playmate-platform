import { Link, Outlet } from "react-router-dom";
import { appEnv } from "../../config/env";

export const AppLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link
            to="/"
            className="text-lg font-semibold text-slate-900"
            aria-label="返回首页"
            tabIndex={0}
          >
            {appEnv.appName}
          </Link>
          <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">
            {appEnv.appEnv}
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
};
