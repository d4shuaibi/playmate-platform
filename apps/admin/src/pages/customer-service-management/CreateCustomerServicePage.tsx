import { ArrowLeftOutlined, CameraOutlined, QrcodeOutlined } from "@ant-design/icons";
import { Button, Card, Form, Input, Typography, Upload, message } from "antd";
import { useNavigate } from "react-router-dom";

type CreateServiceFormValues = {
  nickname: string;
  wechatId: string;
};

export const CreateCustomerServicePage = () => {
  const [form] = Form.useForm<CreateServiceFormValues>();
  const navigate = useNavigate();

  const handleGoBack = () => {
    void navigate("/customer-service-management");
  };

  const handleSubmit = () => {
    void (async () => {
      try {
        const values = await form.validateFields();
        // TODO(backend): 调用新增客服接口，提交昵称/微信号/头像/二维码
        // TODO(backend): 上传头像与微信二维码，拿到文件 URL 后一起提交创建接口
        message.success(`新增客服成功（Mock）：${values.nickname}`);
        void navigate("/customer-service-management");
      } catch {
        // Antd 表单会展示校验错误，这里无需额外处理
      }
    })();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Typography.Title level={3} className="!mb-1">
            新增客服
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 !text-slate-500">
            创建客服账号并配置基础资料
          </Typography.Paragraph>
        </div>
        <Button icon={<ArrowLeftOutlined />} onClick={handleGoBack}>
          返回客服管理
        </Button>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm" bodyStyle={{ padding: 24 }}>
        <Form form={form} layout="vertical">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]">
            <div className="space-y-6">
              <Form.Item
                label="客服昵称"
                name="nickname"
                rules={[{ required: true, message: "请输入客服昵称" }]}
              >
                <Input placeholder="请输入客服昵称" />
              </Form.Item>

              <Form.Item
                label="微信账号"
                name="wechatId"
                rules={[{ required: true, message: "请输入微信账号" }]}
              >
                <Input placeholder="请输入微信账号" />
              </Form.Item>
            </div>

            <div className="space-y-6">
              <div>
                <Typography.Text className="mb-2 block">头像上传</Typography.Text>
                <Upload
                  listType="picture-card"
                  maxCount={1}
                  beforeUpload={() => {
                    // TODO(backend): 上传客服头像到文件服务
                    return false;
                  }}
                >
                  <div className="flex flex-col items-center gap-2">
                    <CameraOutlined />
                    <span className="text-xs">上传头像</span>
                  </div>
                </Upload>
              </div>

              <div>
                <Typography.Text className="mb-2 block">微信二维码</Typography.Text>
                <Upload
                  listType="picture-card"
                  maxCount={1}
                  beforeUpload={() => {
                    // TODO(backend): 上传微信二维码到文件服务
                    return false;
                  }}
                >
                  <div className="flex flex-col items-center gap-2">
                    <QrcodeOutlined />
                    <span className="text-xs">上传二维码</span>
                  </div>
                </Upload>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button onClick={handleGoBack}>取消</Button>
            <Button type="primary" onClick={handleSubmit}>
              确认新增
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};
