import { ArrowLeftOutlined, CameraOutlined, QrcodeOutlined } from "@ant-design/icons";
import { Button, Card, Form, Input, Spin, Typography, Upload, message } from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getAdminAuthSession } from "../../services/auth/session";
import {
  requestCustomerServiceAgent,
  requestUpdateCustomerServiceAgent,
  requestUploadFile
} from "../../services/customer-service/api";
import {
  buildDoneUploadFileFromUrl,
  getOriginFileFromList,
  resolveUploadUrlFromFileList
} from "./agent-form-utils";

type EditServiceFormValues = {
  nickname: string;
  wechatId: string;
  avatarFiles: UploadFile[];
  wechatQrFiles: UploadFile[];
};

type LocationState = {
  readOnly?: boolean;
};

export const EditCustomerServicePage = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const readOnly = Boolean((location.state as LocationState | null)?.readOnly);
  const [form] = Form.useForm<EditServiceFormValues>();
  const navigate = useNavigate();
  const session = getAdminAuthSession();
  const accessToken = session?.accessToken ?? "";
  const [pageLoading, setPageLoading] = useState(true);

  const normalizeUploadFiles = (event: { fileList: UploadFile[] } | UploadFile[]) => {
    if (Array.isArray(event)) {
      return event;
    }
    return event?.fileList ?? [];
  };

  const handleGoBack = () => {
    void navigate("/customer-service-management");
  };

  const loadDetail = useCallback(() => {
    if (!id?.trim()) {
      message.error("无效的客服 ID");
      void navigate("/customer-service-management");
      return;
    }
    if (!accessToken) {
      message.error("登录已失效，请重新登录");
      void navigate("/login");
      return;
    }
    setPageLoading(true);
    void (async () => {
      try {
        const agent = await requestCustomerServiceAgent(accessToken, id.trim());
        form.setFieldsValue({
          nickname: agent.nickname,
          wechatId: agent.wechatId,
          avatarFiles: [
            buildDoneUploadFileFromUrl({ uid: "avatar", url: agent.avatarUrl, name: "avatar" })
          ],
          wechatQrFiles: [
            buildDoneUploadFileFromUrl({ uid: "qr", url: agent.wechatQrUrl, name: "wechat-qr" })
          ]
        });
      } catch (error) {
        message.error(error instanceof Error ? error.message : "加载客服详情失败");
        void navigate("/customer-service-management");
      } finally {
        setPageLoading(false);
      }
    })();
  }, [accessToken, form, id, navigate]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const handleSubmit = () => {
    if (readOnly) return;
    if (!id?.trim()) return;
    void (async () => {
      try {
        if (!accessToken) {
          message.error("登录已失效，请重新登录");
          void navigate("/login");
          return;
        }

        const values = await form.validateFields();

        let avatarUrl = resolveUploadUrlFromFileList(values.avatarFiles);
        const avatarNewFile = getOriginFileFromList(values.avatarFiles);
        if (!avatarUrl && avatarNewFile) {
          const uploaded = await requestUploadFile(accessToken, avatarNewFile);
          avatarUrl = uploaded.url;
        }
        if (!avatarUrl) {
          message.error("请上传头像");
          return;
        }

        let wechatQrUrl = resolveUploadUrlFromFileList(values.wechatQrFiles);
        const qrNewFile = getOriginFileFromList(values.wechatQrFiles);
        if (!wechatQrUrl && qrNewFile) {
          const uploaded = await requestUploadFile(accessToken, qrNewFile);
          wechatQrUrl = uploaded.url;
        }
        if (!wechatQrUrl) {
          message.error("请上传微信二维码");
          return;
        }

        await requestUpdateCustomerServiceAgent(accessToken, id.trim(), {
          nickname: values.nickname.trim(),
          wechatId: values.wechatId.trim(),
          avatarUrl,
          wechatQrUrl
        });

        message.success("保存成功");
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
            {readOnly ? "查看客服" : "编辑客服"}
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 !text-slate-500">
            {readOnly ? "查看客服资料" : "修改客服资料并保存"}
          </Typography.Paragraph>
        </div>
        <Button icon={<ArrowLeftOutlined />} onClick={handleGoBack}>
          返回客服管理
        </Button>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm" bodyStyle={{ padding: 24 }}>
        <Spin spinning={pageLoading}>
          <Form form={form} layout="vertical" disabled={readOnly}>
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
                  rules={[
                    {
                      validator: (_, fileList: UploadFile[]) => {
                        const hasUrl = Boolean(resolveUploadUrlFromFileList(fileList));
                        const hasFile = Boolean(getOriginFileFromList(fileList));
                        if (hasUrl || hasFile) return Promise.resolve();
                        return Promise.reject(new Error("请上传头像"));
                      }
                    }
                  ]}
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
                  rules={[
                    {
                      validator: (_, fileList: UploadFile[]) => {
                        const hasUrl = Boolean(resolveUploadUrlFromFileList(fileList));
                        const hasFile = Boolean(getOriginFileFromList(fileList));
                        if (hasUrl || hasFile) return Promise.resolve();
                        return Promise.reject(new Error("请上传微信二维码"));
                      }
                    }
                  ]}
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

            {!readOnly ? (
              <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
                <Button onClick={handleGoBack}>取消</Button>
                <Button type="primary" onClick={handleSubmit}>
                  保存
                </Button>
              </div>
            ) : null}
          </Form>
        </Spin>
      </Card>
    </div>
  );
};
