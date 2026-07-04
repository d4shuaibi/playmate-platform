import { ArrowLeftOutlined, IdcardOutlined } from "@ant-design/icons";
import { Button, Card, Form, Input, Spin, Typography, Upload, message } from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAdminAuthSession } from "../../services/auth/session";
import { getValidAdminAccessToken } from "../../services/auth/token";
import { requestUploadFile } from "../../services/customer-service/api";
import { requestUpdateWorker, requestWorker } from "../../services/worker/api";
import {
  buildDoneUploadFileFromUrl,
  getOriginFileFromList,
  resolveUploadUrlFromFileList
} from "./worker-form-utils";

type EditWorkerFormValues = {
  idNo: string;
  address: string;
  idCardFrontFiles: UploadFile[];
  idCardBackFiles: UploadFile[];
};

export const EditWorkerPage = () => {
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm<EditWorkerFormValues>();
  const navigate = useNavigate();
  const session = getAdminAuthSession();
  const accessToken = session?.accessToken ?? "";
  const [pageLoading, setPageLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const normalizeUploadFiles = (event: { fileList: UploadFile[] } | UploadFile[]) => {
    if (Array.isArray(event)) {
      return event;
    }
    return event?.fileList ?? [];
  };

  const handleGoBack = () => {
    void navigate("/worker-management");
  };

  const loadDetail = useCallback(() => {
    if (!id?.trim()) {
      message.error("无效的打手 ID");
      void navigate("/worker-management");
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
        const worker = await requestWorker(accessToken, id.trim());
        form.setFieldsValue({
          idNo: worker.idNo ?? "",
          address: worker.address ?? "",
          idCardFrontFiles: worker.idCardFrontUrl
            ? [
                buildDoneUploadFileFromUrl({
                  uid: "id-card-front",
                  url: worker.idCardFrontUrl,
                  name: "id-card-front"
                })
              ]
            : [],
          idCardBackFiles: worker.idCardBackUrl
            ? [
                buildDoneUploadFileFromUrl({
                  uid: "id-card-back",
                  url: worker.idCardBackUrl,
                  name: "id-card-back"
                })
              ]
            : []
        });
      } catch (error) {
        message.error(error instanceof Error ? error.message : "加载打手详情失败");
        void navigate("/worker-management");
      } finally {
        setPageLoading(false);
      }
    })();
  }, [accessToken, form, id, navigate]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const handleSubmit = () => {
    if (!id?.trim()) return;
    void (async () => {
      try {
        const values = await form.validateFields();
        let accessToken: string;
        try {
          accessToken = await getValidAdminAccessToken();
        } catch {
          message.error("登录已失效，请重新登录");
          void navigate("/login");
          return;
        }

        setSubmitting(true);

        let idCardFrontUrl = resolveUploadUrlFromFileList(values.idCardFrontFiles);
        const frontNewFile = getOriginFileFromList(values.idCardFrontFiles);
        if (!idCardFrontUrl && frontNewFile) {
          const uploaded = await requestUploadFile(accessToken, frontNewFile);
          idCardFrontUrl = uploaded.url;
        }

        let idCardBackUrl = resolveUploadUrlFromFileList(values.idCardBackFiles);
        const backNewFile = getOriginFileFromList(values.idCardBackFiles);
        if (!idCardBackUrl && backNewFile) {
          const uploaded = await requestUploadFile(accessToken, backNewFile);
          idCardBackUrl = uploaded.url;
        }

        await requestUpdateWorker(accessToken, id.trim(), {
          idNo: values.idNo.trim(),
          address: values.address.trim(),
          idCardFrontUrl: idCardFrontUrl ?? "",
          idCardBackUrl: idCardBackUrl ?? ""
        });

        message.success("保存成功");
        void navigate("/worker-management");
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "提交失败";
        if (errorMessage.includes("required")) return;
        message.error(errorMessage);
      } finally {
        setSubmitting(false);
      }
    })();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Typography.Title level={3} className="!mb-1">
            修改打手资料
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 !text-slate-500">
            维护身份证信息与现居住地信息，便于留底与联系
          </Typography.Paragraph>
        </div>
        <Button icon={<ArrowLeftOutlined />} onClick={handleGoBack}>
          返回打手管理
        </Button>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm" bodyStyle={{ padding: 24 }}>
        <Spin spinning={pageLoading}>
          <Form form={form} layout="vertical">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]">
              <div className="space-y-6">
                <Form.Item label="身份证号" name="idNo">
                  <Input placeholder="请输入身份证号码" />
                </Form.Item>

                <Form.Item label="现居住地信息" name="address">
                  <Input.TextArea rows={3} placeholder="请输入详细现居住地址" />
                </Form.Item>
              </div>

              <div className="space-y-6">
                <Form.Item
                  label="身份证正面"
                  name="idCardFrontFiles"
                  valuePropName="fileList"
                  getValueFromEvent={normalizeUploadFiles}
                >
                  <Upload
                    listType="picture-card"
                    maxCount={1}
                    beforeUpload={() => {
                      return false;
                    }}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <IdcardOutlined />
                      <span className="text-xs">上传正面</span>
                    </div>
                  </Upload>
                </Form.Item>

                <Form.Item
                  label="身份证反面"
                  name="idCardBackFiles"
                  valuePropName="fileList"
                  getValueFromEvent={normalizeUploadFiles}
                >
                  <Upload
                    listType="picture-card"
                    maxCount={1}
                    beforeUpload={() => {
                      return false;
                    }}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <IdcardOutlined />
                      <span className="text-xs">上传反面</span>
                    </div>
                  </Upload>
                </Form.Item>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
              <Button onClick={handleGoBack}>取消</Button>
              <Button type="primary" loading={submitting} onClick={handleSubmit}>
                保存
              </Button>
            </div>
          </Form>
        </Spin>
      </Card>
    </div>
  );
};
