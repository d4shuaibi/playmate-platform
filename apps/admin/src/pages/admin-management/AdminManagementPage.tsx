import { PlusOutlined } from "@ant-design/icons";
import { Button, Drawer, Form, Input, Select, Space, Table, Tag, Typography, message } from "antd";
import { type ColumnsType } from "antd/es/table";
import { useCallback, useEffect, useState } from "react";
import {
  requestAdminManagerDetail,
  requestAdminManagers,
  requestCreateAdminManager,
  requestToggleAdminManagerStatus,
  requestUpdateAdminManager
} from "../../services/auth/api";
import { sha256Hex } from "../../services/auth/crypto";
import { getAdminAuthSession } from "../../services/auth/session";
import { type AdminManager, type AdminManagerStatus } from "../../services/auth/types";

type DrawerMode = "create" | "edit" | "view";

type AdminManagerFormValues = {
  name: string;
  username: string;
  password: string;
};

type StatusFilter = AdminManagerStatus | "all";

export const AdminManagementPage = () => {
  const [rows, setRows] = useState<AdminManager[]>([]);
  const [loading, setLoading] = useState(false);
  const [nameFilter, setNameFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>("create");
  const [currentRow, setCurrentRow] = useState<AdminManager | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [form] = Form.useForm<AdminManagerFormValues>();
  const session = getAdminAuthSession();
  const accessToken = session?.accessToken ?? "";

  const canEdit = drawerMode !== "view";
  const isCreateMode = drawerMode === "create";
  const currentQuery = {
    name: nameFilter.trim(),
    status: statusFilter === "all" ? undefined : statusFilter
  };

  const loadManagers = useCallback(
    (filters?: { name?: string; status?: AdminManagerStatus }) => {
      if (!accessToken) return;
      setLoading(true);
      void (async () => {
        try {
          const list = await requestAdminManagers(accessToken, filters);
          setRows(list);
        } catch (error) {
          message.error(error instanceof Error ? error.message : "加载管理员列表失败");
        } finally {
          setLoading(false);
        }
      })();
    },
    [accessToken]
  );

  useEffect(() => {
    loadManagers();
  }, [loadManagers]);

  const openCreateDrawer = () => {
    setDrawerMode("create");
    setCurrentRow(null);
    form.setFieldsValue({
      name: "",
      username: "",
      password: ""
    });
    setDrawerOpen(true);
  };

  const openDetailDrawer = (mode: DrawerMode, row: AdminManager) => {
    if (!accessToken) return;
    setDrawerMode(mode);
    setCurrentRow(row);
    setDrawerOpen(true);
    void (async () => {
      try {
        const detail = await requestAdminManagerDetail(accessToken, row.id);
        form.setFieldsValue({
          name: detail.name,
          username: detail.username,
          password: ""
        });
      } catch (error) {
        message.error(error instanceof Error ? error.message : "加载管理员详情失败");
      }
    })();
  };

  const handleSubmit = () => {
    if (!accessToken) return;
    void (async () => {
      try {
        const values = await form.validateFields();
        setSubmitLoading(true);

        if (drawerMode === "create") {
          const passwordHash = await sha256Hex(values.password);
          await requestCreateAdminManager(accessToken, {
            name: values.name.trim(),
            username: values.username.trim(),
            passwordHash
          });
          message.success("管理员创建成功");
        } else if (drawerMode === "edit" && currentRow) {
          const updatePayload: { name?: string; passwordHash?: string } = {
            name: values.name.trim()
          };
          if (values.password.trim()) {
            updatePayload.passwordHash = await sha256Hex(values.password);
          }
          await requestUpdateAdminManager(accessToken, currentRow.id, updatePayload);
          message.success("管理员更新成功");
        }

        setDrawerOpen(false);
        loadManagers(currentQuery);
      } catch (error) {
        if (error instanceof Error && error.message.includes("required")) return;
        message.error(error instanceof Error ? error.message : "提交失败");
      } finally {
        setSubmitLoading(false);
      }
    })();
  };

  const handleToggleStatus = (row: AdminManager) => {
    if (!accessToken) return;
    const nextStatus: AdminManagerStatus = row.status === "active" ? "disabled" : "active";
    void (async () => {
      try {
        await requestToggleAdminManagerStatus(accessToken, row.id, nextStatus);
        message.success(`${row.id} 已${nextStatus === "active" ? "启用" : "禁用"}`);
        loadManagers(currentQuery);
      } catch (error) {
        message.error(error instanceof Error ? error.message : "状态更新失败");
      }
    })();
  };

  const handleSearch = () => {
    loadManagers({
      name: nameFilter.trim(),
      status: statusFilter === "all" ? undefined : statusFilter
    });
  };

  const handleResetSearch = () => {
    setNameFilter("");
    setStatusFilter("all");
    loadManagers();
  };

  const columns: ColumnsType<AdminManager> = [
    {
      title: "管理员 ID",
      dataIndex: "id",
      key: "id"
    },
    {
      title: "管理员名称",
      dataIndex: "name",
      key: "name"
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (status: AdminManagerStatus) => (
        <Tag color={status === "active" ? "success" : "default"}>
          {status === "active" ? "启用" : "禁用"}
        </Tag>
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
      render: (_, row) => (
        <Space size={8}>
          <Button size="small" onClick={() => openDetailDrawer("view", row)}>
            查看
          </Button>
          <Button size="small" onClick={() => openDetailDrawer("edit", row)}>
            编辑
          </Button>
          <Button size="small" onClick={() => handleToggleStatus(row)}>
            {row.status === "active" ? "禁用" : "启用"}
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Typography.Title level={3} className="!mb-1">
            管理员管理
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 !text-slate-500">
            仅老板可见，统一管理管理员账号
          </Typography.Paragraph>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateDrawer}>
          新增
        </Button>
      </div>

      <div className="rounded-xl bg-white p-3">
        <Form className="flex flex-wrap items-end gap-3" layout="inline" onFinish={handleSearch}>
          <Form.Item className="mb-0 min-w-[220px] flex-1" label="管理员名称">
            <Input
              allowClear
              value={nameFilter}
              onChange={(event) => setNameFilter(event.target.value)}
              placeholder="请输入管理员名称"
            />
          </Form.Item>
          <Form.Item className="mb-0 w-[220px]" label="管理员状态">
            <Select
              className="w-full"
              value={statusFilter}
              onChange={(value) => setStatusFilter(value)}
              options={[
                { label: "全部状态", value: "all" },
                { label: "启用", value: "active" },
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
            </div>
          </Form.Item>
        </Form>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={rows}
        pagination={{ pageSize: 10 }}
      />

      <Drawer
        title={
          drawerMode === "create"
            ? "新增管理员"
            : drawerMode === "edit"
              ? "编辑管理员"
              : "查看管理员"
        }
        open={drawerOpen}
        width={480}
        onClose={() => setDrawerOpen(false)}
        extra={
          canEdit ? (
            <Button type="primary" loading={submitLoading} onClick={handleSubmit}>
              {isCreateMode ? "创建" : "保存"}
            </Button>
          ) : null
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="管理员名称"
            name="name"
            rules={[{ required: true, message: "请输入管理员名称" }]}
          >
            <Input disabled={!canEdit} placeholder="请输入管理员名称" />
          </Form.Item>

          <Form.Item
            label="登录名称"
            name="username"
            rules={[{ required: true, message: "请输入登录名称" }]}
          >
            <Input disabled={!isCreateMode || !canEdit} placeholder="请输入登录名称" />
          </Form.Item>

          <Form.Item
            label="登录密码"
            name="password"
            rules={drawerMode === "create" ? [{ required: true, message: "请输入登录密码" }] : []}
            extra={drawerMode === "edit" ? "不填写则保持原密码不变" : undefined}
          >
            <Input.Password disabled={!canEdit} placeholder="请输入登录密码" />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};
