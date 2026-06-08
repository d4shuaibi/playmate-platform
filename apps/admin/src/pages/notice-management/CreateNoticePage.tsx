import { ArrowLeftOutlined } from "@ant-design/icons";
import { Button, Card, Form, Input, InputNumber, Switch, Typography, message } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminAuthSession } from "../../services/auth/session";
import { requestCreateNotice } from "../../services/home-content/api";

export const CreateNoticePage = () => {
  const session = getAdminAuthSession();
  const accessToken = session?.accessToken ?? "";
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const handleBack = () => {
    void navigate("/notice-management");
  };

  const handleSubmit = async (values: {
    content: string;
    sortOrder?: number;
    enabled?: boolean;
  }) => {
    if (!accessToken) return;
    setSubmitting(true);
    try {
      await requestCreateNotice(accessToken, {
        content: values.content,
        sortOrder: values.sortOrder ?? 0,
        enabled: values.enabled ?? true
      });
      message.success("通知创建成功");
      void navigate("/notice-management");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "创建失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
          返回列表
        </Button>
        <Typography.Title level={3} className="!mb-0">
          新增通知
        </Typography.Title>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ sortOrder: 0, enabled: true }}
          className="max-w-2xl"
        >
          <Form.Item
            label="通知内容"
            name="content"
            rules={[{ required: true, message: "请输入通知内容" }]}
          >
            <Input.TextArea rows={3} placeholder="请输入通知内容" />
          </Form.Item>

          <Form.Item label="排序（数字越小越靠前）" name="sortOrder">
            <InputNumber min={0} className="w-full" />
          </Form.Item>

          <Form.Item label="是否启用" name="enabled" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting}>
              创建
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};
