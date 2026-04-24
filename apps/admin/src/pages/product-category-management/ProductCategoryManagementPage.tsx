import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { Button, Card, Form, Input, Select, Table, Tag, Typography, message } from "antd";
import { type ColumnsType } from "antd/es/table";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminAuthSession } from "../../services/auth/session";
import {
  requestDisableProductCategory,
  requestEnableProductCategory,
  requestProductCategories
} from "../../services/product-category/api";
import { type ProductCategory } from "../../services/product-category/types";

type StatusFilter = "all" | "normal" | "disabled";

export const ProductCategoryManagementPage = () => {
  const session = getAdminAuthSession();
  const accessToken = session?.accessToken ?? "";
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [rows, setRows] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(false);

  const currentQuery = useMemo(() => {
    return {
      keyword: keyword.trim(),
      disabled: statusFilter === "all" ? undefined : statusFilter === "disabled"
    };
  }, [keyword, statusFilter]);

  const loadCategories = useCallback(
    (filters?: { keyword?: string; disabled?: boolean }) => {
      if (!accessToken) return;
      setLoading(true);
      void (async () => {
        try {
          const data = await requestProductCategories(accessToken, filters);
          setRows(data.items);
        } catch (error) {
          message.error(error instanceof Error ? error.message : "加载商品大类失败");
        } finally {
          setLoading(false);
        }
      })();
    },
    [accessToken]
  );

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleCreate = () => {
    void navigate("/product-category-management/create");
  };

  const handleRefresh = () => {
    loadCategories(currentQuery);
    message.success("已刷新");
  };

  const handleSearch = () => {
    loadCategories(currentQuery);
  };

  const handleResetSearch = () => {
    setKeyword("");
    setStatusFilter("all");
    loadCategories();
  };

  const handleView = (row: ProductCategory) => {
    message.info(`查看：${row.name}`);
  };

  const handleEdit = (row: ProductCategory) => {
    void navigate(`/product-category-management/edit/${encodeURIComponent(row.id)}`, {
      state: { name: row.name }
    });
  };

  const handleToggleDisabled = (row: ProductCategory) => {
    if (!accessToken) return;
    void (async () => {
      try {
        if (row.disabled) {
          await requestEnableProductCategory(accessToken, row.id);
          message.success(`${row.name} 已启用`);
        } else {
          await requestDisableProductCategory(accessToken, row.id);
          message.success(`${row.name} 已禁用`);
        }
        loadCategories(currentQuery);
      } catch (error) {
        message.error(error instanceof Error ? error.message : "操作失败");
      }
    })();
  };

  const columns: ColumnsType<ProductCategory> = [
    {
      title: "商品大类名称",
      dataIndex: "name",
      key: "name",
      render: (_, row) => (
        <div>
          <p className="text-sm font-semibold">{row.name}</p>
          <p className="text-[10px] text-slate-500">ID: {row.id}</p>
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
      title: "创建人",
      dataIndex: "createdBy",
      key: "createdBy"
    },
    {
      title: "操作",
      key: "actions",
      align: "left",
      render: (_, row) => (
        <div className="flex flex-wrap items-center justify-start gap-1">
          <Button type="text" size="small" onClick={() => handleView(row)}>
            查看
          </Button>
          <Button type="text" size="small" onClick={() => handleEdit(row)}>
            编辑
          </Button>
          <Button
            danger={!row.disabled}
            type="text"
            size="small"
            onClick={() => handleToggleDisabled(row)}
          >
            {row.disabled ? "启用" : "禁用"}
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
            商品大类管理
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 !text-slate-500">
            统一管理商品大类的启用状态与基础信息
          </Typography.Paragraph>
        </div>
        <Button type="primary" icon={<PlusOutlined />} size="large" onClick={handleCreate}>
          新增商品大类
        </Button>
      </div>

      <div className="rounded-xl bg-white p-3">
        <Form className="flex flex-wrap items-end gap-3" layout="inline" onFinish={handleSearch}>
          <Form.Item className="mb-0 min-w-[260px] flex-1" label="关键词">
            <Input
              allowClear
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="请输入商品大类名称或 ID"
            />
          </Form.Item>
          <Form.Item className="mb-0 w-[220px]" label="状态">
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
              <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
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
