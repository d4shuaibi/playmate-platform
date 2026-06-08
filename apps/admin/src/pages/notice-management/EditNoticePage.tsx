import { ArrowLeftOutlined } from "@ant-design/icons";
import { Button, Card, Form, Input, InputNumber, Switch, Typography, message, Spin } from "antd";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAdminAuthSession } from "../../services/auth/session";
import { requestNoticeDetail, requestUpdateNotice } from "../../services/home-content/api";

type NoticeFormValues = {
  content: string;
  sortOrder?: number;
  enabled?: boolean;
};

export const EditNoticePage = () => {
  const session = getAdminAuthSession();
  const accessToken = session?.accessToken ?? "";
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm<NoticeFormValues>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!accessToken || !id) return;
    void (async () => {
      try {
        const notice = await requestNoticeDetail(accessToken, id);
        form.setFieldsValue({
          content: notice.content,
          sortOrder: notice.sortOrder,
          enabled: notice.enabled
        });
      } catch (error) {
        message.error(error instanceof Error ? error.message : "加载通知失败");
      } finally {
        setLoading(false);
      }
    })();
  }, [accessToken, id, form]);

  const handleBack = () => {
    void navigate("/notice-management");
  };

  const handleSubmit = async (values: NoticeFormValues) => {
    if (!accessToken || !id) return;
    setSubmitting(true);
    try {
      await requestUpdateNotice(accessToken, id, {
        content: values.content,
        sortOrder: values.sortOrder ?? 0,
        enabled: values.enabled ?? true
      });
      message.success("通知更新成功");
      void navigate("/notice-management");
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
          编辑通知
        </Typography.Title>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => void handleSubmit(values)}
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
              保存
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};
