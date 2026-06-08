import { ArrowLeftOutlined } from "@ant-design/icons";
import { Button, Card, Form, Input, InputNumber, Switch, Typography, message, Spin } from "antd";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAdminAuthSession } from "../../services/auth/session";
import { requestBannerDetail, requestUpdateBanner } from "../../services/home-content/api";

type BannerFormValues = {
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl?: string;
  sortOrder?: number;
  enabled?: boolean;
};

export const EditBannerPage = () => {
  const session = getAdminAuthSession();
  const accessToken = session?.accessToken ?? "";
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm<BannerFormValues>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!accessToken || !id) return;
    void (async () => {
      try {
        const banner = await requestBannerDetail(accessToken, id);
        form.setFieldsValue({
          title: banner.title,
          subtitle: banner.subtitle,
          imageUrl: banner.imageUrl,
          linkUrl: banner.linkUrl,
          sortOrder: banner.sortOrder,
          enabled: banner.enabled
        });
      } catch (error) {
        message.error(error instanceof Error ? error.message : "加载轮播图失败");
      } finally {
        setLoading(false);
      }
    })();
  }, [accessToken, id, form]);

  const handleBack = () => {
    void navigate("/banner-management");
  };

  const handleSubmit = async (values: BannerFormValues) => {
    if (!accessToken || !id) return;
    setSubmitting(true);
    try {
      await requestUpdateBanner(accessToken, id, {
        title: values.title,
        subtitle: values.subtitle,
        imageUrl: values.imageUrl,
        linkUrl: values.linkUrl || null,
        sortOrder: values.sortOrder ?? 0,
        enabled: values.enabled ?? true
      });
      message.success("轮播图更新成功");
      void navigate("/banner-management");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "更新失败");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
          返回列表
        </Button>
        <Typography.Title level={3} className="!mb-0">
          编辑轮播图
        </Typography.Title>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => void handleSubmit(values)}
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
              保存
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};
