import { ReloadOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Segmented,
  Select,
  Table,
  Tag,
  Typography,
  message
} from "antd";
import { type ColumnsType } from "antd/es/table";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getAdminAuthSession } from "../../services/auth/session";
import {
  requestAuditWorkerApplication,
  requestDisableWorker,
  requestEnableWorker,
  requestWorkerApplications,
  requestWorkers
} from "../../services/worker/api";
import {
  type Worker,
  type WorkerJoinApplication,
  type WorkerJoinStatus,
  type WorkerStatus
} from "../../services/worker/types";

type TabKey = "applications" | "workers";

const joinStatusLabelMap: Record<WorkerJoinStatus, string> = {
  submitted: "已提交",
  reviewing: "审核中",
  approved: "已通过",
  rejected: "已拒绝"
};

const joinStatusColorMap: Record<WorkerJoinStatus, string> = {
  submitted: "default",
  reviewing: "processing",
  approved: "success",
  rejected: "error"
};

const workerStatusLabelMap: Record<WorkerStatus, string> = {
  active: "正常",
  disabled: "禁用"
};

const workerStatusColorMap: Record<WorkerStatus, string> = {
  active: "success",
  disabled: "error"
};

export const WorkerManagementPage = () => {
  const session = getAdminAuthSession();
  const accessToken = session?.accessToken ?? "";

  const [tab, setTab] = useState<TabKey>("applications");
  const [keyword, setKeyword] = useState("");
  const [applicationStatus, setApplicationStatus] = useState<"all" | WorkerJoinStatus>("all");
  const [workerJoinStatus, setWorkerJoinStatus] = useState<"all" | WorkerJoinStatus>("all");
  const [workerStatus, setWorkerStatus] = useState<"all" | WorkerStatus>("all");

  const [applicationRows, setApplicationRows] = useState<WorkerJoinApplication[]>([]);
  const [workerRows, setWorkerRows] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(false);

  const currentApplicationQuery = useMemo(() => {
    return {
      keyword: keyword.trim(),
      status: applicationStatus === "all" ? undefined : applicationStatus
    };
  }, [keyword, applicationStatus]);

  const currentWorkerQuery = useMemo(() => {
    return {
      keyword: keyword.trim(),
      joinStatus: workerJoinStatus === "all" ? undefined : workerJoinStatus,
      status: workerStatus === "all" ? undefined : workerStatus
    };
  }, [keyword, workerJoinStatus, workerStatus]);

  const loadData = useCallback(() => {
    if (!accessToken) return;
    setLoading(true);
    void (async () => {
      try {
        if (tab === "applications") {
          const data = await requestWorkerApplications(accessToken, currentApplicationQuery);
          setApplicationRows(data.items);
          return;
        }
        const data = await requestWorkers(accessToken, currentWorkerQuery);
        setWorkerRows(data.items);
      } catch (error) {
        message.error(error instanceof Error ? error.message : "加载失败");
      } finally {
        setLoading(false);
      }
    })();
  }, [accessToken, tab, currentApplicationQuery, currentWorkerQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleReset = () => {
    setKeyword("");
    setApplicationStatus("all");
    setWorkerJoinStatus("all");
    setWorkerStatus("all");
    message.success("已重置");
    setTimeout(() => loadData(), 0);
  };

  const handleRefresh = () => {
    loadData();
    message.success("已刷新");
  };

  const handleAudit = async (row: WorkerJoinApplication, action: "approve" | "reject") => {
    if (!accessToken) return;

    if (action === "reject") {
      let reason = "";
      const ok = await new Promise<boolean>((resolve) => {
        Modal.confirm({
          title: "拒绝申请",
          content: (
            <div className="space-y-2">
              <p className="text-sm text-slate-600">请输入拒绝原因（可选）</p>
              <Input
                onChange={(e) => (reason = e.target.value)}
                placeholder="例如：资料不完整/信息不一致"
              />
            </div>
          ),
          okText: "确认拒绝",
          cancelText: "取消",
          onOk: () => resolve(true),
          onCancel: () => resolve(false)
        });
      });
      if (!ok) return;

      setLoading(true);
      try {
        await requestAuditWorkerApplication(accessToken, row.id, {
          action: "reject",
          rejectReason: reason
        });
        message.success("已拒绝");
        loadData();
      } catch (error) {
        message.error(error instanceof Error ? error.message : "操作失败");
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    try {
      await requestAuditWorkerApplication(accessToken, row.id, { action: "approve" });
      message.success("已通过");
      loadData();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "操作失败");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleWorker = async (row: Worker) => {
    if (!accessToken) return;
    const nextAction = row.status === "disabled" ? "enable" : "disable";
    setLoading(true);
    try {
      if (nextAction === "enable") {
        await requestEnableWorker(accessToken, row.id);
        message.success("已启用");
      } else {
        await requestDisableWorker(accessToken, row.id);
        message.success("已禁用");
      }
      loadData();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "操作失败");
    } finally {
      setLoading(false);
    }
  };

  const applicationColumns: ColumnsType<WorkerJoinApplication> = [
    {
      title: "申请单号",
      dataIndex: "refNo",
      key: "refNo",
      width: 190,
      render: (_, row) => (
        <div>
          <p className="text-sm font-semibold">{row.refNo}</p>
          <p className="text-[10px] text-slate-500">{row.createdAt}</p>
        </div>
      )
    },
    {
      title: "申请人",
      dataIndex: "realName",
      key: "realName",
      width: 160,
      render: (_, row) => (
        <div>
          <p className="text-sm font-medium">{row.realName}</p>
          <p className="text-[10px] text-slate-500">{row.phone}</p>
        </div>
      )
    },
    { title: "年龄", dataIndex: "age", key: "age", width: 80 },
    { title: "考核类型", dataIndex: "assessmentType", key: "assessmentType", width: 160 },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: WorkerJoinStatus) => (
        <Tag color={joinStatusColorMap[status]}>{joinStatusLabelMap[status]}</Tag>
      )
    },
    {
      title: "拒绝原因",
      dataIndex: "rejectReason",
      key: "rejectReason",
      render: (v?: string) => (v ? <span className="text-sm text-slate-700">{v}</span> : "-")
    },
    {
      title: "操作",
      key: "actions",
      align: "left",
      width: 180,
      render: (_, row) => (
        <div className="flex flex-wrap items-center justify-start gap-1">
          <Button
            type="text"
            size="small"
            disabled={row.status !== "reviewing"}
            onClick={() => void handleAudit(row, "approve")}
          >
            通过
          </Button>
          <Button
            type="text"
            size="small"
            danger
            disabled={row.status !== "reviewing"}
            onClick={() => void handleAudit(row, "reject")}
          >
            拒绝
          </Button>
        </div>
      )
    }
  ];

  const workerColumns: ColumnsType<Worker> = [
    {
      title: "打手",
      dataIndex: "realName",
      key: "realName",
      width: 180,
      render: (_, row) => (
        <div>
          <p className="text-sm font-semibold">{row.realName}</p>
          <p className="text-[10px] text-slate-500">{row.phone}</p>
        </div>
      )
    },
    { title: "用户ID", dataIndex: "userId", key: "userId", width: 200 },
    {
      title: "入驻状态",
      dataIndex: "joinStatus",
      key: "joinStatus",
      width: 120,
      render: (v: WorkerJoinStatus) => (
        <Tag color={joinStatusColorMap[v]}>{joinStatusLabelMap[v]}</Tag>
      )
    },
    { title: "考核类型", dataIndex: "assessmentType", key: "assessmentType", width: 160 },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (v: WorkerStatus) => (
        <Tag color={workerStatusColorMap[v]}>{workerStatusLabelMap[v]}</Tag>
      )
    },
    { title: "创建时间", dataIndex: "createdAt", key: "createdAt", width: 180 },
    {
      title: "操作",
      key: "actions",
      align: "left",
      width: 140,
      render: (_, row) => (
        <div className="flex flex-wrap items-center justify-start gap-1">
          <Button type="text" size="small" onClick={() => void handleToggleWorker(row)}>
            {row.status === "disabled" ? "启用" : "禁用"}
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
            打手管理
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 !text-slate-500">
            对齐 mini 的入驻申请与打手状态（可审核、可禁用/启用）
          </Typography.Paragraph>
        </div>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Segmented<TabKey>
            value={tab}
            onChange={(v) => setTab(v)}
            options={[
              { label: "入驻申请", value: "applications" },
              { label: "打手列表", value: "workers" }
            ]}
          />
          <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
            刷新
          </Button>
        </div>
      </Card>

      <div className="rounded-xl bg-white p-3">
        <Form className="flex flex-wrap items-end gap-3" layout="inline" onFinish={loadData}>
          <Form.Item className="mb-0 min-w-[260px] flex-1" label="关键词">
            <Input
              allowClear
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder={
                tab === "applications" ? "搜索申请单号/姓名/手机号" : "搜索姓名/手机号/用户ID"
              }
            />
          </Form.Item>

          {tab === "applications" ? (
            <Form.Item className="mb-0 w-[220px]" label="申请状态">
              <Select
                className="w-full"
                value={applicationStatus}
                onChange={(v) => setApplicationStatus(v)}
                options={[
                  { label: "全部", value: "all" },
                  { label: "审核中", value: "reviewing" },
                  { label: "已通过", value: "approved" },
                  { label: "已拒绝", value: "rejected" },
                  { label: "已提交", value: "submitted" }
                ]}
              />
            </Form.Item>
          ) : (
            <>
              <Form.Item className="mb-0 w-[220px]" label="入驻状态">
                <Select
                  className="w-full"
                  value={workerJoinStatus}
                  onChange={(v) => setWorkerJoinStatus(v)}
                  options={[
                    { label: "全部", value: "all" },
                    { label: "审核中", value: "reviewing" },
                    { label: "已通过", value: "approved" },
                    { label: "已拒绝", value: "rejected" },
                    { label: "已提交", value: "submitted" }
                  ]}
                />
              </Form.Item>
              <Form.Item className="mb-0 w-[220px]" label="打手状态">
                <Select
                  className="w-full"
                  value={workerStatus}
                  onChange={(v) => setWorkerStatus(v)}
                  options={[
                    { label: "全部", value: "all" },
                    { label: "正常", value: "active" },
                    { label: "禁用", value: "disabled" }
                  ]}
                />
              </Form.Item>
            </>
          )}

          <Form.Item className="mb-0">
            <div className="flex items-end gap-2">
              <Button type="primary" htmlType="submit">
                查询
              </Button>
              <Button onClick={handleReset}>重置</Button>
            </div>
          </Form.Item>
        </Form>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm" bodyStyle={{ padding: 0 }}>
        {tab === "applications" ? (
          <Table
            rowKey="id"
            loading={loading}
            columns={applicationColumns}
            dataSource={applicationRows}
            pagination={{ pageSize: 10 }}
          />
        ) : (
          <Table
            rowKey="id"
            loading={loading}
            columns={workerColumns}
            dataSource={workerRows}
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>
    </div>
  );
};
