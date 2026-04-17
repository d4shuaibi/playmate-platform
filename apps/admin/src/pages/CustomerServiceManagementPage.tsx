import {
  FilterOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  TeamOutlined
} from "@ant-design/icons";
import { Avatar, Button, Card, Input, Select, Tag, Typography, message } from "antd";
import { useMemo, useState } from "react";

type ServiceAgentStatus = "online" | "offline" | "busy";
type ServiceAgentRole = "admin" | "specialist";

type ServiceAgent = {
  id: string;
  name: string;
  role: ServiceAgentRole;
  teamName: string;
  status: ServiceAgentStatus;
  handledOrderCount: number;
  createdAt: string;
  completionRatio: number;
  avatarUrl: string;
};

type ServiceStats = {
  onlineCount: number;
  totalCount: number;
  avgResponseMinute: number;
  satisfactionRate: number;
};

// TODO(backend): 接入客服管理列表接口（支持分页、搜索、状态筛选）
const mockAgents: ServiceAgent[] = [
  {
    id: "CS-9021",
    name: "张思语",
    role: "admin",
    teamName: "核心服务组",
    status: "online",
    handledOrderCount: 1284,
    createdAt: "2023-05-12",
    completionRatio: 85,
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCZJJ2Jra4X1J6psoi01_5wPZXrJKT2coSXad8dWrQcQD6YTjVG6wk0oq9XPeYuG8CeDrJL92wB9zhxbTi0uuygsY3zQhl4UpalJ2SsTppH60OkEy74ADPYqpzDPM5-GHiUdXEzdcE2O_wQkg2G8qeaG0BLdaejMHMQ3dZRvzIjE2_tBgwF81hdIHBzRu_FZ0L0zI-f2WGvpf_u5P28ofo4AmSjDgUraKTIFyyl1hVqlH2Ymj9bGJOVrhKp2ElQt9PaMyMV9H7zEi4"
  },
  {
    id: "CS-9104",
    name: "王晓晨",
    role: "specialist",
    teamName: "投诉处理组",
    status: "offline",
    handledOrderCount: 842,
    createdAt: "2023-08-22",
    completionRatio: 60,
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCkLD7GxJpZCBMTPwdFn41FVBS4y23knC1Ha9c7k3CJY4Th703yu7FvxJtO_T7BSce0MQ59o1LsqOMjNB3vq-wgImXbWuuPDQODbjsMyKEoYrJc6zvD7nj4jdNg6p0CQvcuYdtR07_8J-kvsp8scRS6fbKzJj5-P1W_kNmrpL3WGOS9Ag4pn2rO7TNivN8rPrsJx2AmdSSbK1Tp27hNC3yf908soLDP89qARErgBN8PasnDdQn8lSW56NGDlnf_THQ8yeADFxGWgcI"
  },
  {
    id: "CS-8852",
    name: "刘志强",
    role: "specialist",
    teamName: "核心服务组",
    status: "busy",
    handledOrderCount: 2410,
    createdAt: "2022-11-05",
    completionRatio: 95,
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDDtItDc6L9yYVzVty1jOP-2wWcH5GYyCnfu_g_WUMlhx1nb4F27nREQQ-Wm4oca7Da6XJY1_gi14PYNLRduv95ViNXlLJ8wdx8amspns9mZkGD107olD5x4InIoh6lzChnBwNjgHjletBLstsI8z6x8M1XvotHAfTDFxSLATZDdfNsfAPcS01s6OWA62YVtIUN186yrBEQVlewwF8pAPgsXeAxWmM_VrEWT4tYCpm6mUCgkROcRv4NDiuYB57ckPhx8umNlkA6UHs"
  },
  {
    id: "CS-9322",
    name: "陈美琳",
    role: "specialist",
    teamName: "大客户服务",
    status: "online",
    handledOrderCount: 533,
    createdAt: "2024-01-15",
    completionRatio: 40,
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAOqIsFHQuoDHZVr7djtFtEc11-0CirSoTe2-0YyXnHLIib8FXpyHBkZXrEUL8IfKTGdaUnXgUrGZydj7QlMmNIzBzKWgueQ-WzrOu9R4bsfYUY5GoOdTKY3hg3UyzF5MneX9oJL-uu8HZmoRWoO_cBOgtFiILxHFAISAhXQwdbK9CipGSvbDrj4OBp_Qv_cw_FntVuA8vow1t0VPXbHuZ45IPm_G_l7ogiC5uOOkwFbWtpMxC7w5aE_7-jSAJJJXrWqMxLQt3XiqU"
  },
  {
    id: "CS-9541",
    name: "周杰",
    role: "specialist",
    teamName: "投诉处理组",
    status: "online",
    handledOrderCount: 112,
    createdAt: "2024-03-02",
    completionRatio: 10,
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCmnCu0T3G8zLH9TY-fdP4CTQ-zPudKhdZlwKnYn9S50V3qVL74HMemIKrAe-c-gnfrjcjGvBBUSIxV0X9erNcTvH_f8RtM8cw7wHCstcqP2CBjyRd9I3wVcmqO7du-9IKxNVH9Ea7ZAjJty2NBk3dsad-y_TGXAxKffIkCbPtsLOTNKjog_mkmWar7N-ky18jkPbv_ZqF6o7szyd0e-phTxhSBjXrW6R6wU2DYasrADDP2bNhkYUL4ZM4V6by5SfAq-lNtIGo4vg0"
  }
];

// TODO(backend): 接入客服统计指标接口（在线数、响应时长、满意度）
const mockStats: ServiceStats = {
  onlineCount: 18,
  totalCount: 24,
  avgResponseMinute: 1.8,
  satisfactionRate: 98.4
};

const statusLabelMap: Record<ServiceAgentStatus, string> = {
  online: "在线",
  offline: "离线",
  busy: "忙碌"
};

const roleLabelMap: Record<ServiceAgentRole, string> = {
  admin: "管理员",
  specialist: "客服专员"
};

const statusTagColorMap: Record<ServiceAgentStatus, string> = {
  online: "success",
  offline: "default",
  busy: "warning"
};

export const CustomerServiceManagementPage = () => {
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ServiceAgentStatus>("all");

  const filteredAgents = useMemo(() => {
    return mockAgents.filter((agent) => {
      const hitKeyword =
        keyword.trim().length === 0 ||
        agent.name.includes(keyword.trim()) ||
        agent.id.toLowerCase().includes(keyword.trim().toLowerCase()) ||
        agent.teamName.includes(keyword.trim());
      const hitStatus = statusFilter === "all" || agent.status === statusFilter;
      return hitKeyword && hitStatus;
    });
  }, [keyword, statusFilter]);

  const handleCreateServiceAgent = () => {
    // TODO(backend): 打开新增客服弹窗，提交至创建客服接口
    message.info("新增客服功能开发中");
  };

  const handleRefresh = () => {
    // TODO(backend): 重新请求客服列表接口
    message.success("已刷新（Mock）");
  };

  const handleAgentAction = (
    agent: ServiceAgent,
    action: "view" | "edit" | "permission" | "disable"
  ) => {
    // TODO(backend): 根据 action 跳转/调用对应接口（详情、编辑、权限配置、禁用）
    message.info(`${agent.name} - ${action}（Mock）`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Typography.Title level={3} className="!mb-1">
            客服管理
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 !text-slate-500">
            管理并监控所有在线客服人员的状态与效率（老板与管理员可见）
          </Typography.Paragraph>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={handleCreateServiceAgent}
        >
          新增客服
        </Button>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm" bodyStyle={{ padding: 20 }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <Input
              allowClear
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="!max-w-sm !rounded-xl"
              prefix={<SearchOutlined className="text-slate-400" />}
              placeholder="搜索客服姓名、ID或小组..."
            />
            <div className="flex items-center gap-2">
              <Typography.Text className="!text-xs !font-semibold !uppercase !tracking-wider !text-slate-500">
                状态:
              </Typography.Text>
              <Select
                value={statusFilter}
                onChange={(value) => setStatusFilter(value)}
                className="!w-36"
                options={[
                  { label: "全部", value: "all" },
                  { label: "在线", value: "online" },
                  { label: "离线", value: "offline" },
                  { label: "忙碌", value: "busy" }
                ]}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button icon={<FilterOutlined />} />
            <Button icon={<ReloadOutlined />} onClick={handleRefresh} />
          </div>
        </div>
      </Card>

      <Card className="rounded-2xl border-0 shadow-sm" bodyStyle={{ padding: 0 }}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1020px] text-left">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  客服姓名
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  角色
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  所属小组
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
                  状态
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  处理订单
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  创建时间
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAgents.map((agent) => (
                <tr
                  key={agent.id}
                  className="border-t border-slate-100 transition-colors hover:bg-slate-50/70"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar size={32} src={agent.avatarUrl} />
                      <div>
                        <p className="text-sm font-semibold">{agent.name}</p>
                        <p className="text-[10px] text-slate-500">ID: {agent.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Tag color={agent.role === "admin" ? "blue" : "default"}>
                      {roleLabelMap[agent.role]}
                    </Tag>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{agent.teamName}</td>
                  <td className="px-6 py-4 text-center">
                    <Tag color={statusTagColorMap[agent.status]}>
                      {statusLabelMap[agent.status]}
                    </Tag>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium">
                        {agent.handledOrderCount.toLocaleString()}
                      </p>
                      <div className="mt-1.5 h-1.5 w-24 rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-blue-500"
                          style={{ width: `${agent.completionRatio}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{agent.createdAt}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="text"
                        size="small"
                        onClick={() => handleAgentAction(agent, "view")}
                      >
                        查看
                      </Button>
                      <Button
                        type="text"
                        size="small"
                        onClick={() => handleAgentAction(agent, "edit")}
                      >
                        编辑
                      </Button>
                      <Button
                        type="text"
                        size="small"
                        onClick={() => handleAgentAction(agent, "permission")}
                      >
                        权限
                      </Button>
                      <Button
                        danger
                        type="text"
                        size="small"
                        onClick={() => handleAgentAction(agent, "disable")}
                      >
                        禁用
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-6 py-4">
          <Typography.Text className="!text-xs !text-slate-500">
            显示 1 到 {filteredAgents.length} 项，共 24 项客服人员
          </Typography.Text>
          <div className="flex items-center gap-1">
            <Button size="small" disabled>
              上一页
            </Button>
            <Button size="small" type="primary">
              1
            </Button>
            <Button size="small">2</Button>
            <Button size="small">3</Button>
            <Button size="small">下一页</Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="rounded-2xl border-0 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <TeamOutlined />
            </div>
            <Tag color="success">+12%</Tag>
          </div>
          <Typography.Text className="!text-xs !font-bold !uppercase !tracking-wider !text-slate-500">
            总在线客服
          </Typography.Text>
          <Typography.Title level={3} className="!mb-0 !mt-1">
            {mockStats.onlineCount}
            <span className="ml-1 text-xs font-normal text-slate-500">
              / {mockStats.totalCount}
            </span>
          </Typography.Title>
        </Card>
        <Card className="rounded-2xl border-0 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <ReloadOutlined />
            </div>
            <Tag color="success">-4.2s</Tag>
          </div>
          <Typography.Text className="!text-xs !font-bold !uppercase !tracking-wider !text-slate-500">
            平均响应时间
          </Typography.Text>
          <Typography.Title level={3} className="!mb-0 !mt-1">
            {mockStats.avgResponseMinute}
            <span className="ml-1 text-xs font-normal text-slate-500">min</span>
          </Typography.Title>
        </Card>
        <Card className="rounded-2xl border-0 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <TeamOutlined />
            </div>
            <Tag color="success">+0.8%</Tag>
          </div>
          <Typography.Text className="!text-xs !font-bold !uppercase !tracking-wider !text-slate-500">
            客户满意度
          </Typography.Text>
          <Typography.Title level={3} className="!mb-0 !mt-1">
            {mockStats.satisfactionRate}
            <span className="ml-1 text-xs font-normal text-slate-500">%</span>
          </Typography.Title>
        </Card>
      </div>
    </div>
  );
};
