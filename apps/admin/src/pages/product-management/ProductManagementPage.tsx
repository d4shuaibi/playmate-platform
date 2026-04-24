import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { Avatar, Button, Card, Form, Input, Select, Table, Tag, Typography, message } from "antd";
import { type ColumnsType } from "antd/es/table";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminAuthSession } from "../../services/auth/session";
import { requestProductCategories } from "../../services/product-category/api";
import { type ProductCategory } from "../../services/product-category/types";
import {
  requestDisableProduct,
  requestEnableProduct,
  requestProducts
} from "../../services/product/api";
import { type Product, type ProductStatus } from "../../services/product/types";

type StatusFilter = "all" | ProductStatus;

export const ProductManagementPage = () => {
  const session = getAdminAuthSession();
  const accessToken = session?.accessToken ?? "";
  const navigate = useNavigate();
  const [nameKeyword, setNameKeyword] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [rows, setRows] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const currentQuery = useMemo(() => {
    return {
      name: nameKeyword.trim(),
      categoryId: categoryId === "all" ? undefined : categoryId,
      status: statusFilter === "all" ? undefined : statusFilter
    };
  }, [categoryId, nameKeyword, statusFilter]);

  const loadCategories = useCallback(() => {
    if (!accessToken) return;
    void (async () => {
      try {
        const data = await requestProductCategories(accessToken);
        setCategories(data.items);
      } catch (error) {
        message.error(error instanceof Error ? error.message : "加载商品大类失败");
      }
    })();
  }, [accessToken]);

  const loadProducts = useCallback(
    (filters?: { name?: string; categoryId?: string; status?: ProductStatus }) => {
      if (!accessToken) return;
      setLoading(true);
      void (async () => {
        try {
          const data = await requestProducts(accessToken, filters);
          setRows(data.items);
        } catch (error) {
          message.error(error instanceof Error ? error.message : "加载商品列表失败");
        } finally {
          setLoading(false);
        }
      })();
    },
    [accessToken]
  );

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, [loadCategories, loadProducts]);

  const handleCreate = () => {
    void navigate("/product-management/create");
  };

  const handleRefresh = () => {
    loadProducts(currentQuery);
    message.success("已刷新");
  };

  const handleSearch = () => {
    loadProducts(currentQuery);
  };

  const handleResetSearch = () => {
    setNameKeyword("");
    setCategoryId("all");
    setStatusFilter("all");
    loadProducts();
  };

  const handleView = (row: Product) => {
    void navigate(`/product-management/edit/${encodeURIComponent(row.id)}`, {
      state: { readOnly: true }
    });
  };

  const handleEdit = (row: Product) => {
    void navigate(`/product-management/edit/${encodeURIComponent(row.id)}`);
  };

  const handleToggleStatus = (row: Product) => {
    if (!accessToken) return;
    void (async () => {
      try {
        if (row.status === "disabled") {
          await requestEnableProduct(accessToken, row.id);
          message.success(`${row.name} 已启用`);
        } else {
          await requestDisableProduct(accessToken, row.id);
          message.success(`${row.name} 已禁用`);
        }
        loadProducts(currentQuery);
      } catch (error) {
        message.error(error instanceof Error ? error.message : "操作失败");
      }
    })();
  };

  const columns: ColumnsType<Product> = [
    {
      title: "商品名称",
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
      title: "商品图片",
      dataIndex: "imageUrl",
      key: "imageUrl",
      width: 110,
      render: (_, row) => <Avatar shape="square" size={52} src={row.imageUrl} />
    },
    {
      title: "所属大类",
      dataIndex: "categoryName",
      key: "categoryName",
      render: (_, row) => (
        <div>
          <p className="text-sm font-medium">{row.categoryName}</p>
          <p className="text-[10px] text-slate-500">{row.categoryId}</p>
        </div>
      )
    },
    {
      title: "价格",
      dataIndex: "price",
      key: "price",
      render: (price: number) => `¥${price.toFixed(2)}`
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (status: ProductStatus) => (
        <Tag color={status === "enabled" ? "success" : "default"}>
          {status === "enabled" ? "已上架" : "已下架"}
        </Tag>
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
            查看详情
          </Button>
          <Button type="text" size="small" onClick={() => handleEdit(row)}>
            修改
          </Button>
          <Button
            danger={row.status === "enabled"}
            type="text"
            size="small"
            onClick={() => handleToggleStatus(row)}
          >
            {row.status === "enabled" ? "禁用" : "启用"}
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
            商品管理
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 !text-slate-500">
            管理商品的上架状态与基础信息
          </Typography.Paragraph>
        </div>
        <Button type="primary" icon={<PlusOutlined />} size="large" onClick={handleCreate}>
          新增商品
        </Button>
      </div>

      <div className="rounded-xl bg-white p-3">
        <Form className="flex flex-wrap items-end gap-3" layout="inline" onFinish={handleSearch}>
          <Form.Item className="mb-0 min-w-[260px] flex-1" label="商品名称">
            <Input
              allowClear
              value={nameKeyword}
              onChange={(event) => setNameKeyword(event.target.value)}
              placeholder="请输入商品名称"
            />
          </Form.Item>
          <Form.Item className="mb-0 w-[260px]" label="所属大类">
            <Select
              className="w-full"
              value={categoryId}
              onChange={(value) => setCategoryId(value)}
              options={[
                { label: "全部大类", value: "all" },
                ...categories.map((item) => ({ label: item.name, value: item.id }))
              ]}
            />
          </Form.Item>
          <Form.Item className="mb-0 w-[220px]" label="状态">
            <Select
              className="w-full"
              value={statusFilter}
              onChange={(value) => setStatusFilter(value)}
              options={[
                { label: "全部状态", value: "all" },
                { label: "已上架", value: "enabled" },
                { label: "已下架", value: "disabled" }
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
