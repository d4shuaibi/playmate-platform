import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { Button, Card, Form, Select, Table, Tag, Typography, message, Image } from "antd";
import { type ColumnsType } from "antd/es/table";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminAuthSession } from "../../services/auth/session";
import { requestBanners, requestDeleteBanner } from "../../services/home-content/api";
import { type HomeBanner } from "../../services/home-content/types";

type StatusFilter = "all" | "enabled" | "disabled";

export const BannerManagementPage = () => {
  const session = getAdminAuthSession();
  const accessToken = session?.accessToken ?? "";
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [rows, setRows] = useState<HomeBanner[]>([]);
  const [loading, setLoading] = useState(false);

  const currentQuery = useMemo(() => {
    return {
      enabled: statusFilter === "all" ? undefined : statusFilter === "enabled"
    };
  }, [statusFilter]);

  const loadBanners = useCallback(
    (filters?: { enabled?: boolean }) => {
      if (!accessToken) return;
      setLoading(true);
      void (async () => {
        try {
          const data = await requestBanners(accessToken, filters);
          setRows(data.items);
        } catch (error) {
          message.error(error instanceof Error ? error.message : "加载轮播图失败");
        } finally {
          setLoading(false);
        }
      })();
    },
    [accessToken]
  );

  useEffect(() => {
    loadBanners();
  }, [loadBanners]);

  const handleCreate = () => {
    void navigate("/banner-management/create");
  };

  const handleRefresh = () => {
    loadBanners(currentQuery);
    message.success("已刷新");
  };

  const handleSearch = () => {
    loadBanners(currentQuery);
  };

  const handleResetSearch = () => {
    setStatusFilter("all");
    loadBanners();
  };

  const handleEdit = (row: HomeBanner) => {
    void navigate(`/banner-management/edit/${encodeURIComponent(row.id)}`);
  };

  const handleDelete = (row: HomeBanner) => {
    if (!accessToken) return;
    void (async () => {
      try {
        await requestDeleteBanner(accessToken, row.id);
        message.success(`${row.title} 已删除`);
        loadBanners(currentQuery);
      } catch (error) {
        message.error(error instanceof Error ? error.message : "删除失败");
      }
    })();
  };

  const columns: ColumnsType<HomeBanner> = [
    {
      title: "轮播图",
      dataIndex: "imageUrl",
      key: "imageUrl",
      width: 120,
      render: (imageUrl: string) => (
        <Image
          src={imageUrl}
          width={80}
          height={45}
          style={{ objectFit: "cover", borderRadius: 4 }}
        />
      )
    },
    {
      title: "标题",
      dataIndex: "title",
      key: "title",
      render: (_, row) => (
        <div>
          <p className="text-sm font-semibold">{row.title}</p>
          <p className="text-xs text-slate-500">{row.subtitle}</p>
        </div>
      )
    },
    {
      title: "排序",
      dataIndex: "sortOrder",
      key: "sortOrder",
      width: 80,
      align: "center"
    },
    {
      title: "状态",
      dataIndex: "enabled",
      key: "enabled",
      width: 100,
      render: (enabled: boolean) => (
        <Tag color={enabled ? "success" : "error"}>{enabled ? "启用" : "禁用"}</Tag>
      )
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (createdAt: string) => new Date(createdAt).toLocaleString("zh-CN")
    },
    {
      title: "操作",
      key: "actions",
      width: 150,
      align: "left",
      render: (_, row) => (
        <div className="flex flex-wrap items-center justify-start gap-1">
          <Button type="text" size="small" onClick={() => handleEdit(row)}>
            编辑
          </Button>
          <Button danger type="text" size="small" onClick={() => handleDelete(row)}>
            删除
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
            轮播图管理
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 !text-slate-500">
            管理小程序首页轮播图的展示内容和顺序
          </Typography.Paragraph>
        </div>
        <Button type="primary" icon={<PlusOutlined />} size="large" onClick={handleCreate}>
          新增轮播图
        </Button>
      </div>

      <div className="rounded-xl bg-white p-3">
        <Form className="flex flex-wrap items-end gap-3" layout="inline" onFinish={handleSearch}>
          <Form.Item className="mb-0 w-[220px]" label="状态">
            <Select
              className="w-full"
              value={statusFilter}
              onChange={(value) => setStatusFilter(value)}
              options={[
                { label: "全部", value: "all" },
                { label: "启用", value: "enabled" },
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
