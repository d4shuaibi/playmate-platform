import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { Avatar, Button, Card, Form, Input, Select, Table, Tag, Typography, message } from "antd";
import { type ColumnsType } from "antd/es/table";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminAuthSession } from "../../services/auth/session";
import {
  requestCustomerServiceAgents,
  requestDisableCustomerServiceAgent,
  requestEnableCustomerServiceAgent
} from "../../services/customer-service/api";
import { type CustomerServiceAgent } from "../../services/customer-service/types";

type AccountStatusFilter = "all" | "normal" | "disabled";

export const CustomerServiceManagementPage = () => {
  const session = getAdminAuthSession();
  const accessToken = session?.accessToken ?? "";
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<AccountStatusFilter>("all");
  const [rows, setRows] = useState<CustomerServiceAgent[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const currentQuery = {
    keyword: keyword.trim(),
    disabled: statusFilter === "all" ? undefined : statusFilter === "disabled" ? true : false
  };

  const loadAgents = useCallback(
    (filters?: { keyword?: string; disabled?: boolean }) => {
      if (!accessToken) return;
      setLoading(true);
      void (async () => {
        try {
          const data = await requestCustomerServiceAgents(accessToken, filters);
          setRows(data.items);
        } catch (error) {
          message.error(error instanceof Error ? error.message : "加载客服列表失败");
        } finally {
          setLoading(false);
        }
      })();
    },
    [accessToken]
  );

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  const handleCreateServiceAgent = () => {
    void navigate("/customer-service-management/create");
  };

  const handleRefresh = () => {
    loadAgents(currentQuery);
    message.success("已刷新");
  };

  const handleOpenView = (agent: CustomerServiceAgent) => {
    void navigate(`/customer-service-management/edit/${encodeURIComponent(agent.id)}`, {
      state: { readOnly: true }
    });
  };

  const handleOpenEdit = (agent: CustomerServiceAgent) => {
    void navigate(`/customer-service-management/edit/${encodeURIComponent(agent.id)}`);
  };

  const handleToggleDisabled = (agent: CustomerServiceAgent) => {
    if (!accessToken) return;
    void (async () => {
      try {
        if (agent.disabled) {
          await requestEnableCustomerServiceAgent(accessToken, agent.id);
          message.success(`${agent.nickname} 已恢复为正常`);
        } else {
          await requestDisableCustomerServiceAgent(accessToken, agent.id);
          message.success(`${agent.nickname} 已禁用`);
        }
        loadAgents(currentQuery);
      } catch (error) {
        message.error(error instanceof Error ? error.message : "操作失败");
      }
    })();
  };

  const handleSearch = () => {
    loadAgents(currentQuery);
  };

  const handleResetSearch = () => {
    setKeyword("");
    setStatusFilter("all");
    loadAgents();
  };

  const columns: ColumnsType<CustomerServiceAgent> = [
    {
      title: "客服头像",
      dataIndex: "avatarUrl",
      key: "avatarUrl",
      width: 100,
      render: (_, agent) => <Avatar size={40} src={agent.avatarUrl} />
    },
    {
      title: "客服昵称",
      dataIndex: "nickname",
      key: "name",
      render: (_, agent) => (
        <div>
          <p className="text-sm font-semibold">{agent.nickname}</p>
          <p className="text-[10px] text-slate-500">ID: {agent.id}</p>
        </div>
      )
    },
    {
      title: "状态",
      dataIndex: "disabled",
      key: "disabled",
      render: (disabled: boolean) => (
        <Tag color={disabled ? "error" : "success"}>{disabled ? "禁用" : "正常"}</Tag>
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
      align: "left",
      render: (_, agent) => (
        <div className="flex flex-wrap items-center justify-start gap-1">
          <Button type="text" size="small" onClick={() => handleOpenView(agent)}>
            查看
          </Button>
          <Button type="text" size="small" onClick={() => handleOpenEdit(agent)}>
            编辑
          </Button>
          <Button
            danger={!agent.disabled}
            type="text"
            size="small"
            onClick={() => handleToggleDisabled(agent)}
          >
            {agent.disabled ? "启用" : "禁用"}
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
            管理客服账号与启用状态（老板与管理员可见）
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
          <Form.Item className="mb-0 w-[220px]" label="账号状态">
            <Select
              className="w-full"
              value={statusFilter}
              onChange={(value) => setStatusFilter(value)}
              options={[
                { label: "全部", value: "all" },
                { label: "正常", value: "normal" },
                { label: "禁用", value: "disabled" }
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
