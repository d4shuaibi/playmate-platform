import { ArrowLeftOutlined, CameraOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Switch,
  Typography,
  Upload,
  message,
  Spin
} from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAdminAuthSession } from "../../services/auth/session";
import { requestBannerDetail, requestUpdateBanner } from "../../services/home-content/api";
import { requestUploadFile } from "../../services/customer-service/api";
import {
  buildDoneUploadFileFromUrl,
  getOriginFileFromList,
  normalizeUploadFiles,
  resolveUploadUrlFromFileList
} from "../product-management/ProductFormUtils";

type BannerFormValues = {
  title: string;
  subtitle: string;
  imageFiles: UploadFile[];
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
          imageFiles: banner.imageUrl
            ? [buildDoneUploadFileFromUrl({ uid: banner.id, url: banner.imageUrl })]
            : [],
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
      let imageUrl = resolveUploadUrlFromFileList(values.imageFiles);
      const originFile = getOriginFileFromList(values.imageFiles);
      if (originFile) {
        const uploaded = await requestUploadFile(accessToken, originFile);
        imageUrl = uploaded.url;
      }
      if (!imageUrl) {
        message.error("请上传轮播图图片");
        return;
      }
      await requestUpdateBanner(accessToken, id, {
        title: values.title,
        subtitle: values.subtitle,
        imageUrl,
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
            label="轮播图图片"
            name="imageFiles"
            valuePropName="fileList"
            getValueFromEvent={normalizeUploadFiles}
            rules={[
              {
                validator: (_, fileList: UploadFile[]) => {
                  const hasUrl = Boolean(resolveUploadUrlFromFileList(fileList));
                  const hasFile = Boolean(getOriginFileFromList(fileList));
                  if (hasUrl || hasFile) return Promise.resolve();
                  return Promise.reject(new Error("请上传轮播图图片"));
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
                <span className="text-xs">上传图片</span>
              </div>
            </Upload>
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
