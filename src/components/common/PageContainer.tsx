import type { ReactNode } from "react";

type PageContainerProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

export const PageContainer = ({ title, description, children }: PageContainerProps) => {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
};
