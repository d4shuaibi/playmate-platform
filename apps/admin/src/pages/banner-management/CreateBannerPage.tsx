import { ArrowLeftOutlined } from "@ant-design/icons";
import { Button, Card, Form, Input, InputNumber, Switch, Typography, message } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminAuthSession } from "../../services/auth/session";
import { requestCreateBanner } from "../../services/home-content/api";

export const CreateBannerPage = () => {
  const session = getAdminAuthSession();
  const accessToken = session?.accessToken ?? "";
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const handleBack = () => {
    void navigate("/banner-management");
  };

  const handleSubmit = async (values: {
    title: string;
    subtitle: string;
    imageUrl: string;
    linkUrl?: string;
    sortOrder?: number;
    enabled?: boolean;
  }) => {
    if (!accessToken) return;
    setSubmitting(true);
    try {
      await requestCreateBanner(accessToken, {
        title: values.title,
        subtitle: values.subtitle,
        imageUrl: values.imageUrl,
        linkUrl: values.linkUrl || null,
        sortOrder: values.sortOrder ?? 0,
        enabled: values.enabled ?? true
      });
      message.success("轮播图创建成功");
      void navigate("/banner-management");
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
          新增轮播图
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
          <Form.Item label="标题" name="title" rules={[{ required: true, message: "请输入标题" }]}>
            <Input placeholder="请输入轮播图标题" />
          </Form.Item>

          <Form.Item
            label="副标题"
            name="subtitle"
            rules={[{ required: true, message: "请输入副标题" }]}
          >
            <Input placeholder="请输入副标题" />
          </Form.Item>

          <Form.Item
            label="图片地址"
            name="imageUrl"
            rules={[{ required: true, message: "请输入图片地址" }]}
          >
            <Input placeholder="请输入图片URL" />
          </Form.Item>

          <Form.Item label="链接地址（可选）" name="linkUrl">
            <Input placeholder="点击轮播图跳转的链接（可选）" />
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
