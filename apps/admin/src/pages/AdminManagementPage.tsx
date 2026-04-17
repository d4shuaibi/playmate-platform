import {
  CrownOutlined,
  FilterOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  SafetyOutlined,
  TeamOutlined
} from "@ant-design/icons";
import { Avatar, Button, Card, Input, Select, Tag, Typography, message } from "antd";
import { useMemo, useState } from "react";

type AdminManagerStatus = "active" | "disabled" | "vacation";

type AdminManager = {
  id: string;
  name: string;
  roleLabel: string;
  groupName: string;
  status: AdminManagerStatus;
  managedOrderCount: number;
  createdAt: string;
  completionRatio: number;
  avatarUrl: string;
};

type AdminManagerStats = {
  totalManagers: number;
  activeManagers: number;
  avgDecisionMinute: number;
  escalationRate: number;
};

// TODO(backend): 接入管理员管理列表接口（仅老板可见，支持分页/筛选/搜索）
const mockAdminManagers: AdminManager[] = [
  {
    id: "AM-2001",
    name: "李睿",
    roleLabel: "管理员",
    groupName: "核心运营组",
    status: "active",
    managedOrderCount: 1930,
    createdAt: "2023-02-14",
    completionRatio: 92,
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCBvsZf3WCFUzAQRkXtyc4BkLwV8g6ls14-D5RTp6wiFfeYFSVHtDGkPTHUYZ98g8Ozme0quGA6UOpkVm30VhOMSf5RAZGj9NuRSxs3rcf6hz1eb5hQHyQ8MnXJcJZOOLQmA5-vcOieRZO6ehmlbHRsNQ3kv-IqhyBib4kTlpfLukUpo_0ctm6B00CU8U6MCa1BARpzkfBQfD9aaUXfw-EoOa6hu5kJn_APUpAH1LaOeJuQm6tZcOcey7FjuHvIIu8NsXpFP9ygjE0"
  },
  {
    id: "AM-2012",
    name: "赵倩",
    roleLabel: "管理员",
    groupName: "风控审核运营组",
    status: "active",
    managedOrderCount: 1476,
    createdAt: "2023-06-03",
    completionRatio: 81,
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCZJJ2Jra4X1J6psoi01_5wPZXrJKT2coSXad8dWrQcQD6YTjVG6wk0oq9XPeYuG8CeDrJL92wB9zhxbTi0uuygsY3zQhl4UpalJ2SsTppH60OkEy74ADPYqpzDPM5-GHiUdXEzdcE2O_wQkg2G8qeaG0BLdaejMHMQ3dZRvzIjE2_tBgwF81hdIHBzRu_FZ0L0zI-f2WGvpf_u5P28ofo4AmSjDgUraKTIFyyl1hVqlH2Ymj9bGJOVrhKp2ElQt9PaMyMV9H7zEi4"
  },
  {
    id: "AM-2033",
    name: "吴峰",
    roleLabel: "管理员",
    groupName: "客服协同组",
    status: "vacation",
    managedOrderCount: 886,
    createdAt: "2024-01-12",
    completionRatio: 50,
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDDtItDc6L9yYVzVty1jOP-2wWcH5GYyCnfu_g_WUMlhx1nb4F27nREQQ-Wm4oca7Da6XJY1_gi14PYNLRduv95ViNXlLJ8wdx8amspns9mZkGD107olD5x4InIoh6lzChnBwNjgHjletBLstsI8z6x8M1XvotHAfTDFxSLATZDdfNsfAPcS01s6OWA62YVtIUN186yrBEQVlewwF8pAPgsXeAxWmM_VrEWT4tYCpm6mUCgkROcRv4NDiuYB57ckPhx8umNlkA6UHs"
  },
  {
    id: "AM-2050",
    name: "周敏",
    roleLabel: "管理员",
    groupName: "大客户运营组",
    status: "disabled",
    managedOrderCount: 422,
    createdAt: "2024-02-18",
    completionRatio: 28,
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAOqIsFHQuoDHZVr7djtFtEc11-0CirSoTe2-0YyXnHLIib8FXpyHBkZXrEUL8IfKTGdaUnXgUrGZydj7QlMmNIzBzKWgueQ-WzrOu9R4bsfYUY5GoOdTKY3hg3UyzF5MneX9oJL-uu8HZmoRWoO_cBOgtFiILxHFAISAhXQwdbK9CipGSvbDrj4OBp_Qv_cw_FntVuA8vow1t0VPXbHuZ45IPm_G_l7ogiC5uOOkwFbWtpMxC7w5aE_7-jSAJJJXrWqMxLQt3XiqU"
  }
];

// TODO(backend): 接入管理员统计接口（总管理员数、活跃数、平均决策时长、升级率）
const mockAdminStats: AdminManagerStats = {
  totalManagers: 8,
  activeManagers: 6,
  avgDecisionMinute: 3.2,
  escalationRate: 1.7
};

const statusOptions = [
  { label: "全部", value: "all" },
  { label: "活跃", value: "active" },
  { label: "休假", value: "vacation" },
  { label: "禁用", value: "disabled" }
] as const;

const statusTextMap: Record<AdminManagerStatus, string> = {
  active: "活跃",
  vacation: "休假",
  disabled: "禁用"
};

const statusColorMap: Record<AdminManagerStatus, string> = {
  active: "success",
  vacation: "warning",
  disabled: "default"
};

export const AdminManagementPage = () => {
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof statusOptions)[number]["value"]>("all");

  const filteredManagers = useMemo(() => {
    return mockAdminManagers.filter((manager) => {
      const hitKeyword =
        keyword.trim().length === 0 ||
        manager.name.includes(keyword.trim()) ||
        manager.id.toLowerCase().includes(keyword.trim().toLowerCase()) ||
        manager.groupName.includes(keyword.trim());
      const hitStatus = statusFilter === "all" || manager.status === statusFilter;
      return hitKeyword && hitStatus;
    });
  }, [keyword, statusFilter]);

  const handleCreateAdmin = () => {
    // TODO(backend): 打开新增管理员弹窗，调用创建管理员接口
    message.info("新增管理员功能开发中");
  };

  const handleRefresh = () => {
    // TODO(backend): 重新请求管理员列表与统计接口
    message.success("已刷新（Mock）");
  };

  const handleManagerAction = (
    manager: AdminManager,
    action: "view" | "edit" | "permission" | "disable"
  ) => {
    // TODO(backend): 根据 action 跳转详情/编辑/权限配置/禁用接口
    message.info(`${manager.name} - ${action}（Mock）`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Typography.Title level={3} className="!mb-1">
            管理员管理
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 !text-slate-500">
            仅老板可见，用于创建并管理管理员账号权限
          </Typography.Paragraph>
        </div>
        <Button type="primary" icon={<PlusOutlined />} size="large" onClick={handleCreateAdmin}>
          新增管理员
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
              placeholder="搜索管理员姓名、ID或小组..."
            />
            <div className="flex items-center gap-2">
              <Typography.Text className="!text-xs !font-semibold !uppercase !tracking-wider !text-slate-500">
                状态:
              </Typography.Text>
              <Select
                value={statusFilter}
                onChange={(value) => setStatusFilter(value)}
                className="!w-36"
                options={statusOptions.map((item) => ({ label: item.label, value: item.value }))}
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
          <table className="w-full min-w-[1000px] text-left">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  管理员姓名
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
                  管理订单
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
              {filteredManagers.map((manager) => (
                <tr
                  key={manager.id}
                  className="border-t border-slate-100 transition-colors hover:bg-slate-50/70"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar size={32} src={manager.avatarUrl} />
                      <div>
                        <p className="text-sm font-semibold">{manager.name}</p>
                        <p className="text-[10px] text-slate-500">ID: {manager.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Tag color="blue">{manager.roleLabel}</Tag>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{manager.groupName}</td>
                  <td className="px-6 py-4 text-center">
                    <Tag color={statusColorMap[manager.status]}>
                      {statusTextMap[manager.status]}
                    </Tag>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium">
                        {manager.managedOrderCount.toLocaleString()}
                      </p>
                      <div className="mt-1.5 h-1.5 w-24 rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-blue-500"
                          style={{ width: `${manager.completionRatio}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{manager.createdAt}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="text"
                        size="small"
                        onClick={() => handleManagerAction(manager, "view")}
                      >
                        查看
                      </Button>
                      <Button
                        type="text"
                        size="small"
                        onClick={() => handleManagerAction(manager, "edit")}
                      >
                        编辑
                      </Button>
                      <Button
                        type="text"
                        size="small"
                        onClick={() => handleManagerAction(manager, "permission")}
                      >
                        权限
                      </Button>
                      <Button
                        danger
                        type="text"
                        size="small"
                        onClick={() => handleManagerAction(manager, "disable")}
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
            显示 1 到 {filteredManagers.length} 项，共 8 项管理员
          </Typography.Text>
          <div className="flex items-center gap-1">
            <Button size="small" disabled>
              上一页
            </Button>
            <Button size="small" type="primary">
              1
            </Button>
            <Button size="small">2</Button>
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
            <Tag color="success">+1</Tag>
          </div>
          <Typography.Text className="!text-xs !font-bold !uppercase !tracking-wider !text-slate-500">
            管理员总数
          </Typography.Text>
          <Typography.Title level={3} className="!mb-0 !mt-1">
            {mockAdminStats.totalManagers}
          </Typography.Title>
        </Card>
        <Card className="rounded-2xl border-0 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <SafetyOutlined />
            </div>
            <Tag color="success">{mockAdminStats.activeManagers} 活跃</Tag>
          </div>
          <Typography.Text className="!text-xs !font-bold !uppercase !tracking-wider !text-slate-500">
            平均决策时长
          </Typography.Text>
          <Typography.Title level={3} className="!mb-0 !mt-1">
            {mockAdminStats.avgDecisionMinute}
            <span className="ml-1 text-xs font-normal text-slate-500">min</span>
          </Typography.Title>
        </Card>
        <Card className="rounded-2xl border-0 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <CrownOutlined />
            </div>
            <Tag color="warning">监控中</Tag>
          </div>
          <Typography.Text className="!text-xs !font-bold !uppercase !tracking-wider !text-slate-500">
            升级处理率
          </Typography.Text>
          <Typography.Title level={3} className="!mb-0 !mt-1">
            {mockAdminStats.escalationRate}
            <span className="ml-1 text-xs font-normal text-slate-500">%</span>
          </Typography.Title>
        </Card>
      </div>
    </div>
  );
};
