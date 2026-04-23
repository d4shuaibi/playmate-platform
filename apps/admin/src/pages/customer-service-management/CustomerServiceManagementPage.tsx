import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { Avatar, Button, Card, Form, Input, Select, Table, Tag, Typography, message } from "antd";
import { type ColumnsType } from "antd/es/table";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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

const statusLabelMap: Record<ServiceAgentStatus, string> = {
  online: "在线",
  offline: "离线",
  busy: "忙碌"
};

const statusTagColorMap: Record<ServiceAgentStatus, string> = {
  online: "success",
  offline: "default",
  busy: "warning"
};

export const CustomerServiceManagementPage = () => {
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ServiceAgentStatus>("all");
  const [rows, setRows] = useState<ServiceAgent[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const currentQuery = {
    keyword: keyword.trim(),
    status: statusFilter === "all" ? undefined : statusFilter
  };

  const loadAgents = useCallback((filters?: { keyword?: string; status?: ServiceAgentStatus }) => {
    setLoading(true);
    // TODO(backend): 用 keyword/status 参数请求客服管理列表接口
    const nextRows = mockAgents.filter((agent) => {
      const normalizedKeyword = filters?.keyword?.trim().toLowerCase() ?? "";
      const hitKeyword =
        normalizedKeyword.length === 0 ||
        agent.name.toLowerCase().includes(normalizedKeyword) ||
        agent.id.toLowerCase().includes(normalizedKeyword) ||
        agent.teamName.toLowerCase().includes(normalizedKeyword);
      const hitStatus = !filters?.status || agent.status === filters.status;
      return hitKeyword && hitStatus;
    });
    setRows(nextRows);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  const handleCreateServiceAgent = () => {
    void navigate("/customer-service-management/create");
  };

  const handleRefresh = () => {
    // TODO(backend): 重新请求客服列表接口（保留当前筛选参数）
    loadAgents(currentQuery);
    message.success("已刷新（Mock）");
  };

  const handleAgentAction = (
    agent: ServiceAgent,
    action: "view" | "edit" | "permission" | "disable"
  ) => {
    // TODO(backend): 根据 action 跳转/调用对应接口（详情、编辑、权限配置、禁用）
    message.info(`${agent.name} - ${action}（Mock）`);
  };

  const handleSearch = () => {
    loadAgents(currentQuery);
  };

  const handleResetSearch = () => {
    setKeyword("");
    setStatusFilter("all");
    loadAgents();
  };

  const columns: ColumnsType<ServiceAgent> = [
    {
      title: "客服头像",
      dataIndex: "avatarUrl",
      key: "avatarUrl",
      width: 100,
      render: (_, agent) => <Avatar size={40} src={agent.avatarUrl} />
    },
    {
      title: "客服昵称",
      dataIndex: "name",
      key: "name",
      render: (_, agent) => (
        <div>
          <p className="text-sm font-semibold">{agent.name}</p>
          <p className="text-[10px] text-slate-500">ID: {agent.id}</p>
        </div>
      )
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (status: ServiceAgentStatus) => (
        <Tag color={statusTagColorMap[status]}>{statusLabelMap[status]}</Tag>
      )
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt"
    },
    {
      title: "操作",
      key: "actions",
      render: (_, agent) => (
        <div className="flex items-center justify-end gap-1">
          <Button type="text" size="small" onClick={() => handleAgentAction(agent, "view")}>
            查看
          </Button>
          <Button type="text" size="small" onClick={() => handleAgentAction(agent, "edit")}>
            编辑
          </Button>
          <Button type="text" size="small" onClick={() => handleAgentAction(agent, "permission")}>
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
      )
    }
  ];

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

      <div className="rounded-xl bg-white p-3">
        <Form className="flex flex-wrap items-end gap-3" layout="inline" onFinish={handleSearch}>
          <Form.Item className="mb-0 min-w-[260px] flex-1" label="客服关键词">
            <Input
              allowClear
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="请输入客服昵称或 ID"
            />
          </Form.Item>
          <Form.Item className="mb-0 w-[220px]" label="客服状态">
            <Select
              className="w-full"
              value={statusFilter}
              onChange={(value) => setStatusFilter(value)}
              options={[
                { label: "全部状态", value: "all" },
                { label: "在线", value: "online" },
                { label: "离线", value: "offline" },
                { label: "忙碌", value: "busy" }
              ]}
            />
          </Form.Item>
          <Form.Item className="mb-0">
            <div className="flex items-end gap-2">
              <Button type="primary" htmlType="submit">
                查询
              </Button>
              <Button onClick={handleResetSearch}>重置</Button>
              <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
                刷新
              </Button>
            </div>
          </Form.Item>
        </Form>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm" bodyStyle={{ padding: 0 }}>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={rows}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};
