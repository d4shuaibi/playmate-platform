import { ReloadOutlined } from "@ant-design/icons";
import { Button, Card, Form, Input, Select, Table, Tag, Typography, message } from "antd";
import { type ColumnsType } from "antd/es/table";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminAuthSession } from "../../services/auth/session";
import { requestOrders } from "../../services/order/api";
import { type Order, type OrderStatus } from "../../services/order/types";

type StatusFilter = "all" | OrderStatus;

const statusLabelMap: Record<OrderStatus, string> = {
  pendingPay: "待付款",
  pendingTake: "待接单",
  serving: "服务中",
  pendingDone: "待结单",
  done: "已完成",
  cancelled: "已取消"
};

const statusColorMap: Record<OrderStatus, string> = {
  pendingPay: "processing",
  pendingTake: "default",
  serving: "success",
  pendingDone: "warning",
  done: "success",
  cancelled: "default"
};

export const OrderManagementPage = () => {
  const session = getAdminAuthSession();
  const accessToken = session?.accessToken ?? "";
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [rows, setRows] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const currentQuery = useMemo(() => {
    return {
      keyword: keyword.trim(),
      status: statusFilter === "all" ? undefined : statusFilter
    };
  }, [keyword, statusFilter]);

  const loadOrders = useCallback(
    (filters?: { keyword?: string; status?: OrderStatus }) => {
      if (!accessToken) return;
      setLoading(true);
      void (async () => {
        try {
          const data = await requestOrders(accessToken, filters);
          setRows(data.items);
        } catch (error) {
          message.error(error instanceof Error ? error.message : "加载订单列表失败");
        } finally {
          setLoading(false);
        }
      })();
    },
    [accessToken]
  );

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleRefresh = () => {
    loadOrders(currentQuery);
    message.success("已刷新");
  };

  const handleSearch = () => {
    loadOrders(currentQuery);
  };

  const handleResetSearch = () => {
    setKeyword("");
    setStatusFilter("all");
    loadOrders();
  };

  const handleViewDetail = (row: Order) => {
    void navigate(`/order-management/detail/${encodeURIComponent(row.id)}`);
  };

  const columns: ColumnsType<Order> = [
    {
      title: "订单号",
      dataIndex: "orderNo",
      key: "orderNo",
      width: 170,
      render: (_, row) => (
        <div>
          <p className="text-sm font-semibold">{row.orderNo}</p>
          <p className="text-[10px] text-slate-500">{row.packageTag}</p>
        </div>
      )
    },
    {
      title: "服务内容",
      dataIndex: "serviceTitle",
      key: "serviceTitle",
      render: (_, row) => (
        <div>
          <p className="text-sm font-medium">{row.serviceTitle}</p>
          <p className="text-[10px] text-slate-500">{row.quantityText}</p>
        </div>
      )
    },
    {
      title: "金额",
      dataIndex: "amount",
      key: "amount",
      width: 120,
      render: (amount: number) => `¥${amount.toFixed(2)}`
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: OrderStatus) => (
        <Tag color={statusColorMap[status]}>{statusLabelMap[status]}</Tag>
      )
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 160
    },
    {
      title: "创建人",
      dataIndex: "createdBy",
      key: "createdBy",
      width: 120
    },
    {
      title: "操作",
      key: "actions",
      align: "left",
      width: 120,
      render: (_, row) => (
        <div className="flex flex-wrap items-center justify-start gap-1">
          <Button type="text" size="small" onClick={() => handleViewDetail(row)}>
            查看详情
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
            订单管理
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 !text-slate-500">
            根据订单状态追踪服务进度与交付结果
          </Typography.Paragraph>
        </div>
      </div>

      <div className="rounded-xl bg-white p-3">
        <Form className="flex flex-wrap items-end gap-3" layout="inline" onFinish={handleSearch}>
          <Form.Item className="mb-0 min-w-[260px] flex-1" label="关键词">
            <Input
              allowClear
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="搜索订单号/服务内容/状态"
            />
          </Form.Item>
          <Form.Item className="mb-0 w-[220px]" label="订单状态">
            <Select
              className="w-full"
              value={statusFilter}
              onChange={(value) => setStatusFilter(value)}
              options={[
                { label: "全部", value: "all" },
                { label: "待付款", value: "pendingPay" },
                { label: "待接单", value: "pendingTake" },
                { label: "服务中", value: "serving" },
                { label: "待结单", value: "pendingDone" },
                { label: "已完成", value: "done" },
                { label: "已取消", value: "cancelled" }
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
