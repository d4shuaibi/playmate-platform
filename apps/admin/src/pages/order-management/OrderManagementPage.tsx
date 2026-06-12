import { ReloadOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Table,
  Tag,
  Typography,
  message
} from "antd";
import { type ColumnsType } from "antd/es/table";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminAuthSession } from "../../services/auth/session";
import { requestAssignOrder, requestOrders, requestUnassignOrder } from "../../services/order/api";
import { type Order, type OrderStatus } from "../../services/order/types";
import { requestWorkers } from "../../services/worker/api";
import { type Worker } from "../../services/worker/types";

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
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [assignTarget, setAssignTarget] = useState<Order | null>(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>("");
  const [assigning, setAssigning] = useState(false);

  const workerNameByUserId = useMemo(() => {
    const map = new Map<string, string>();
    for (const w of workers) map.set(w.userId, w.realName);
    return map;
  }, [workers]);

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

  const loadWorkers = useCallback(() => {
    if (!accessToken) return;
    void (async () => {
      try {
        const data = await requestWorkers(accessToken, {
          joinStatus: "approved",
          status: "active",
          pageSize: 100
        });
        setWorkers(data.items);
      } catch (error) {
        message.error(error instanceof Error ? error.message : "加载打手列表失败");
      }
    })();
  }, [accessToken]);

  useEffect(() => {
    loadOrders();
    loadWorkers();
  }, [loadOrders, loadWorkers]);

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

  const handleOpenAssign = (row: Order) => {
    setAssignTarget(row);
    setSelectedWorkerId(row.assignedWorkerId || "");
  };

  const handleCloseAssign = () => {
    setAssignTarget(null);
    setSelectedWorkerId("");
  };

  const handleConfirmAssign = () => {
    if (!assignTarget || !selectedWorkerId) {
      message.warning("请选择要指派的打手");
      return;
    }
    setAssigning(true);
    void (async () => {
      try {
        await requestAssignOrder(accessToken, assignTarget.id, selectedWorkerId);
        message.success("指派成功");
        handleCloseAssign();
        loadOrders(currentQuery);
      } catch (error) {
        message.error(error instanceof Error ? error.message : "指派失败");
      } finally {
        setAssigning(false);
      }
    })();
  };

  const handleUnassign = (row: Order) => {
    void (async () => {
      try {
        await requestUnassignOrder(accessToken, row.id);
        message.success("已撤销指派");
        loadOrders(currentQuery);
      } catch (error) {
        message.error(error instanceof Error ? error.message : "撤销指派失败");
      }
    })();
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
      render: (status: OrderStatus, row) => (
        <div className="flex flex-col items-start gap-1">
          <Tag color={statusColorMap[status]}>{statusLabelMap[status]}</Tag>
          {row.refundStatus === "pending" ? (
            <Tag color="warning">退款待处理</Tag>
          ) : row.refundStatus === "approved" ? (
            <Tag color="error">已退款</Tag>
          ) : null}
        </div>
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
      key: "createdBy",
      width: 160,
      render: (_, row) =>
        row.creatorName ? `${row.creatorName}（${row.createdBy}）` : row.createdBy
    },
    {
      title: "指派打手",
      key: "assignedWorker",
      width: 120,
      render: (_, row) => {
        const assignedId = row.assignedWorkerId?.trim();
        if (!assignedId) return <span className="text-xs text-slate-400">未指派</span>;
        const name = workerNameByUserId.get(assignedId);
        return <Tag color="blue">{name ?? assignedId}</Tag>;
      }
    },
    {
      title: "操作",
      key: "actions",
      align: "left",
      width: 200,
      render: (_, row) => {
        const assigned = Boolean(row.assignedWorkerId?.trim());
        const canAssign = row.status === "pendingTake" && row.refundStatus !== "pending";
        return (
          <div className="flex flex-wrap items-center justify-start gap-1">
            <Button type="text" size="small" onClick={() => handleViewDetail(row)}>
              查看详情
            </Button>
            {canAssign ? (
              <Button type="text" size="small" onClick={() => handleOpenAssign(row)}>
                {assigned ? "改派" : "指派"}
              </Button>
            ) : null}
            {canAssign && assigned ? (
              <Popconfirm
                title="确认撤销指派？"
                okText="撤销"
                cancelText="取消"
                onConfirm={() => handleUnassign(row)}
              >
                <Button type="text" size="small" danger>
                  撤销
                </Button>
              </Popconfirm>
            ) : null}
          </div>
        );
      }
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

      <Modal
        title={assignTarget?.assignedWorkerId?.trim() ? "改派订单" : "指派订单"}
        open={assignTarget != null}
        onOk={handleConfirmAssign}
        onCancel={handleCloseAssign}
        okText="确认指派"
        cancelText="取消"
        confirmLoading={assigning}
        okButtonProps={{ disabled: !selectedWorkerId }}
      >
        <div className="space-y-3">
          <p className="!mb-0 text-sm text-slate-500">
            订单：{assignTarget?.serviceTitle}（{assignTarget?.orderNo}）
          </p>
          <Select
            showSearch
            className="w-full"
            placeholder="选择打手"
            value={selectedWorkerId || undefined}
            onChange={(value) => setSelectedWorkerId(value)}
            optionFilterProp="label"
            options={workers.map((w) => ({
              label: `${w.realName}（${w.phone}）`,
              value: w.userId
            }))}
            notFoundContent="暂无可用打手"
          />
        </div>
      </Modal>
    </div>
  );
};
