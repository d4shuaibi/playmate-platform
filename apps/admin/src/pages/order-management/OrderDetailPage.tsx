import { ArrowLeftOutlined } from "@ant-design/icons";
import { Button, Card, Descriptions, Image, Spin, Tag, Typography, message } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAdminAuthSession } from "../../services/auth/session";
import { requestOrderDetail } from "../../services/order/api";
import { type Order, type OrderStatus } from "../../services/order/types";

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

export const OrderDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const session = getAdminAuthSession();
  const accessToken = session?.accessToken ?? "";
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<Order | null>(null);

  const handleGoBack = () => {
    void navigate("/order-management");
  };

  const loadDetail = useCallback(() => {
    if (!id?.trim()) {
      message.error("无效的订单 ID");
      void navigate("/order-management");
      return;
    }
    if (!accessToken) return;
    setLoading(true);
    void (async () => {
      try {
        const data = await requestOrderDetail(accessToken, id.trim());
        setDetail(data);
      } catch (error) {
        message.error(error instanceof Error ? error.message : "加载订单详情失败");
        void navigate("/order-management");
      } finally {
        setLoading(false);
      }
    })();
  }, [accessToken, id, navigate]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const progressText = useMemo(() => {
    if (!detail) return "";
    return detail.progress.map((step) => `${step.done ? "✓" : "○"} ${step.label}`).join("  ");
  }, [detail]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Typography.Title level={3} className="!mb-1">
            订单详情
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 !text-slate-500">
            查看订单进度、交付内容与支付信息
          </Typography.Paragraph>
        </div>
        <Button icon={<ArrowLeftOutlined />} onClick={handleGoBack}>
          返回订单管理
        </Button>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm" bodyStyle={{ padding: 24 }}>
        <Spin spinning={loading}>
          {detail ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <Typography.Title level={4} className="!mb-1">
                    {detail.serviceTitle}
                  </Typography.Title>
                  <Typography.Text className="text-slate-500">{detail.orderNo}</Typography.Text>
                </div>
                <Tag color={statusColorMap[detail.status]}>{statusLabelMap[detail.status]}</Tag>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
                <div>
                  <Image
                    src={detail.coverImage}
                    alt={detail.serviceTitle}
                    className="rounded-xl"
                    width={220}
                    height={160}
                    style={{ objectFit: "cover" }}
                  />
                </div>
                <div className="space-y-3">
                  <Descriptions bordered size="middle" column={1}>
                    <Descriptions.Item label="套餐">{detail.packageTag}</Descriptions.Item>
                    <Descriptions.Item label="数量">{detail.quantityText}</Descriptions.Item>
                    <Descriptions.Item label="订单金额">{`¥${detail.amount.toFixed(2)}`}</Descriptions.Item>
                    <Descriptions.Item label="实付金额">{`¥${detail.paidAmount.toFixed(2)}`}</Descriptions.Item>
                    <Descriptions.Item label="支付方式">{detail.payMethod}</Descriptions.Item>
                    <Descriptions.Item label="下单时间">{detail.createdAt}</Descriptions.Item>
                    <Descriptions.Item label="创建人">{detail.createdBy}</Descriptions.Item>
                    <Descriptions.Item label="进度">{progressText || "-"}</Descriptions.Item>
                  </Descriptions>
                </div>
              </div>

              <Card className="rounded-2xl border-0 bg-slate-50" bodyStyle={{ padding: 16 }}>
                <Typography.Text className="mb-2 block font-medium">预期结果交付</Typography.Text>
                <div className="space-y-2">
                  {detail.deliveries.length > 0 ? (
                    detail.deliveries.map((item) => (
                      <div key={item.id} className="flex items-start gap-2">
                        <span className={item.done ? "text-emerald-600" : "text-slate-400"}>
                          {item.done ? "✓" : "○"}
                        </span>
                        <span className="text-sm text-slate-700">{item.text}</span>
                      </div>
                    ))
                  ) : (
                    <Typography.Text className="text-slate-500">暂无交付项</Typography.Text>
                  )}
                </div>
              </Card>
            </div>
          ) : null}
        </Spin>
      </Card>
    </div>
  );
};
