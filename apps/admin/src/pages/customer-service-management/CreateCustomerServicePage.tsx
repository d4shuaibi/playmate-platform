import { ArrowLeftOutlined, CameraOutlined, QrcodeOutlined } from "@ant-design/icons";
import { Button, Card, Form, Input, Typography, Upload, message } from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import { useNavigate } from "react-router-dom";
import { getAdminAuthSession } from "../../services/auth/session";
import {
  requestCreateCustomerServiceAgent,
  requestUploadFile
} from "../../services/customer-service/api";

type CreateServiceFormValues = {
  nickname: string;
  wechatId: string;
  avatarFiles: UploadFile[];
  wechatQrFiles: UploadFile[];
};

export const CreateCustomerServicePage = () => {
  const [form] = Form.useForm<CreateServiceFormValues>();
  const navigate = useNavigate();
  const session = getAdminAuthSession();
  const accessToken = session?.accessToken ?? "";

  const normalizeUploadFiles = (event: { fileList: UploadFile[] } | UploadFile[]) => {
    if (Array.isArray(event)) {
      return event;
    }

    return event?.fileList ?? [];
  };

  const handleGoBack = () => {
    void navigate("/customer-service-management");
  };

  const handleSubmit = () => {
    void (async () => {
      try {
        if (!accessToken) {
          message.error("登录已失效，请重新登录");
          void navigate("/login");
          return;
        }

        const values = await form.validateFields();

        const avatarFile = values.avatarFiles?.[0]?.originFileObj;
        const qrFile = values.wechatQrFiles?.[0]?.originFileObj;
        if (!(avatarFile instanceof File)) {
          message.error("头像文件无效，请重新选择");
          return;
        }
        if (!(qrFile instanceof File)) {
          message.error("二维码文件无效，请重新选择");
          return;
        }

        const [avatarUploaded, qrUploaded] = await Promise.all([
          requestUploadFile(accessToken, avatarFile),
          requestUploadFile(accessToken, qrFile)
        ]);

        await requestCreateCustomerServiceAgent(accessToken, {
          nickname: values.nickname.trim(),
          wechatId: values.wechatId.trim(),
          avatarUrl: avatarUploaded.url,
          wechatQrUrl: qrUploaded.url
        });

        message.success("新增客服成功");
        void navigate("/customer-service-management");
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "提交失败";
        if (errorMessage.includes("required")) return;
        message.error(errorMessage);
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
              <Form.Item
                label="头像上传"
                name="avatarFiles"
                valuePropName="fileList"
                getValueFromEvent={normalizeUploadFiles}
                rules={[{ required: true, message: "请上传头像" }]}
              >
                <Upload
                  listType="picture-card"
                  maxCount={1}
                  beforeUpload={() => {
                    return false;
                  }}
                >
                  <div className="flex flex-col items-center gap-2">
                    <CameraOutlined />
                    <span className="text-xs">上传头像</span>
                  </div>
                </Upload>
              </Form.Item>

              <Form.Item
                label="微信二维码"
                name="wechatQrFiles"
                valuePropName="fileList"
                getValueFromEvent={normalizeUploadFiles}
                rules={[{ required: true, message: "请上传微信二维码" }]}
              >
                <Upload
                  listType="picture-card"
                  maxCount={1}
                  beforeUpload={() => {
                    return false;
                  }}
                >
                  <div className="flex flex-col items-center gap-2">
                    <QrcodeOutlined />
                    <span className="text-xs">上传二维码</span>
                  </div>
                </Upload>
              </Form.Item>
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
