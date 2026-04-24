import { ArrowLeftOutlined, CameraOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  Spin,
  Typography,
  Upload,
  message
} from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getAdminAuthSession } from "../../services/auth/session";
import { requestProductCategories } from "../../services/product-category/api";
import { type ProductCategory } from "../../services/product-category/types";
import { requestProductDetail, requestUpdateProduct } from "../../services/product/api";
import { requestUploadFile } from "../../services/customer-service/api";
import {
  buildDoneUploadFileFromUrl,
  getOriginFileFromList,
  normalizeUploadFiles,
  formatNoticesText,
  parseNoticesText,
  splitLines,
  joinLines,
  resolveUploadUrlFromFileList
} from "./ProductFormUtils";

type EditProductFormValues = {
  name: string;
  categoryId: string;
  price: number;
  originPrice?: number;
  stockText?: string;
  titleAccent?: string;
  imageFiles: UploadFile[];
  heroImageFiles: UploadFile[];
  badgesText?: string;
  descriptionText?: string;
  noticesText?: string;
};

type LocationState = {
  readOnly?: boolean;
};

export const EditProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const readOnly = Boolean((location.state as LocationState | null)?.readOnly);
  const [form] = Form.useForm<EditProductFormValues>();
  const navigate = useNavigate();
  const session = getAdminAuthSession();
  const accessToken = session?.accessToken ?? "";
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  const categoryOptions = useMemo(() => {
    return categories
      .filter((item) => !item.disabled)
      .map((item) => ({ label: item.name, value: item.id }));
  }, [categories]);

  const handleGoBack = () => {
    void navigate("/product-management");
  };

  const loadCategories = useCallback(() => {
    if (!accessToken) return;
    void (async () => {
      try {
        const data = await requestProductCategories(accessToken);
        setCategories(data.items);
      } catch (error) {
        message.error(error instanceof Error ? error.message : "加载商品大类失败");
      }
    })();
  }, [accessToken]);

  const loadDetail = useCallback(() => {
    if (!id?.trim()) {
      message.error("无效的商品 ID");
      void navigate("/product-management");
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
        const product = await requestProductDetail(accessToken, id.trim());
        form.setFieldsValue({
          name: product.name,
          categoryId: product.categoryId,
          price: product.price,
          originPrice: product.originPrice ?? undefined,
          stockText: product.stockText,
          titleAccent: product.titleAccent,
          badgesText: joinLines(product.badges),
          descriptionText: joinLines(product.descriptionLines),
          noticesText: formatNoticesText(product.notices),
          imageFiles: [
            buildDoneUploadFileFromUrl({ uid: "image", url: product.imageUrl, name: "image" })
          ],
          heroImageFiles: (product.heroImages ?? []).map((url, index) =>
            buildDoneUploadFileFromUrl({ uid: `hero-${index}`, url, name: `hero-${index}` })
          )
        });
      } catch (error) {
        message.error(error instanceof Error ? error.message : "加载商品详情失败");
        void navigate("/product-management");
      } finally {
        setPageLoading(false);
      }
    })();
  }, [accessToken, form, id, navigate]);

  useEffect(() => {
    loadCategories();
    loadDetail();
  }, [loadCategories, loadDetail]);

  const handleSubmit = () => {
    if (readOnly) return;
    if (!id?.trim()) return;
    if (!accessToken) {
      message.error("登录已失效，请重新登录");
      void navigate("/login");
      return;
    }

    void (async () => {
      try {
        const values = await form.validateFields();
        setSubmitLoading(true);

        const category = categories.find((item) => item.id === values.categoryId);
        if (!category) {
          message.error("所属大类无效，请重新选择");
          return;
        }

        let imageUrl = resolveUploadUrlFromFileList(values.imageFiles);
        const originFile = getOriginFileFromList(values.imageFiles);
        if (!imageUrl && originFile) {
          const uploaded = await requestUploadFile(accessToken, originFile);
          imageUrl = uploaded.url;
        }
        if (!imageUrl) {
          message.error("请上传商品图片");
          return;
        }

        const heroOrigins = (values.heroImageFiles ?? [])
          .map((item) => item.originFileObj)
          .filter((item): item is File => item instanceof File);
        const heroExistingUrls = (values.heroImageFiles ?? [])
          .map((item) => item.url)
          .filter((item): item is string => typeof item === "string" && item.length > 0);
        const heroUploaded = await Promise.all(
          heroOrigins.map((file) => requestUploadFile(accessToken, file))
        );
        const heroImages = [...heroExistingUrls, ...heroUploaded.map((item) => item.url)].filter(
          (item) => item.length > 0
        );
        if (heroImages.length === 0) {
          message.error("请至少上传 1 张轮播图");
          return;
        }

        const badges = splitLines(values.badgesText ?? "");
        const descriptionLines = splitLines(values.descriptionText ?? "");
        const notices = parseNoticesText(values.noticesText ?? "");

        await requestUpdateProduct(accessToken, id.trim(), {
          name: values.name.trim(),
          imageUrl,
          heroImages,
          titleAccent: values.titleAccent?.trim() ?? "",
          categoryId: category.id,
          categoryName: category.name,
          price: values.price,
          originPrice: values.originPrice ?? null,
          stockText: values.stockText?.trim() ?? "",
          badges,
          descriptionLines,
          notices
        });

        message.success("保存成功");
        void navigate("/product-management");
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "提交失败";
        if (errorMessage.includes("required")) return;
        message.error(errorMessage);
      } finally {
        setSubmitLoading(false);
      }
    })();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Typography.Title level={3} className="!mb-1">
            {readOnly ? "查看商品" : "编辑商品"}
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 !text-slate-500">
            {readOnly ? "查看商品基础信息" : "修改商品信息并保存"}
          </Typography.Paragraph>
        </div>
        <Button icon={<ArrowLeftOutlined />} onClick={handleGoBack}>
          返回商品管理
        </Button>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm" bodyStyle={{ padding: 24 }}>
        <Spin spinning={pageLoading}>
          <Form form={form} layout="vertical" disabled={readOnly}>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]">
              <div className="space-y-6">
                <Form.Item
                  label="商品名称"
                  name="name"
                  rules={[{ required: true, message: "请输入商品名称" }]}
                >
                  <Input placeholder="请输入商品名称" />
                </Form.Item>

                <Form.Item
                  label="所属大类"
                  name="categoryId"
                  rules={[{ required: true, message: "请选择所属大类" }]}
                >
                  <Select placeholder="请选择所属大类" options={categoryOptions} />
                </Form.Item>

                <Form.Item
                  label="价格"
                  name="price"
                  rules={[{ required: true, message: "请输入价格" }]}
                >
                  <InputNumber min={0} precision={2} className="!w-full" placeholder="请输入价格" />
                </Form.Item>

                <Form.Item label="原价（可选）" name="originPrice">
                  <InputNumber min={0} precision={2} className="!w-full" placeholder="请输入原价" />
                </Form.Item>

                <Form.Item label="库存/活动文案（可选）" name="stockText">
                  <Input placeholder="例如：LIMITED STOCK" />
                </Form.Item>

                <Form.Item label="标题强调文案（可选）" name="titleAccent">
                  <Input placeholder="例如：赠送转盘" />
                </Form.Item>

                <Form.Item
                  label="商品图片"
                  name="imageFiles"
                  valuePropName="fileList"
                  getValueFromEvent={normalizeUploadFiles}
                  rules={[
                    {
                      validator: (_, fileList: UploadFile[]) => {
                        const hasUrl = Boolean(resolveUploadUrlFromFileList(fileList));
                        const hasFile = Boolean(getOriginFileFromList(fileList));
                        if (hasUrl || hasFile) return Promise.resolve();
                        return Promise.reject(new Error("请上传商品图片"));
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

                <Form.Item
                  label="轮播图（至少 1 张）"
                  name="heroImageFiles"
                  valuePropName="fileList"
                  getValueFromEvent={normalizeUploadFiles}
                  rules={[
                    {
                      validator: (_, fileList: UploadFile[]) => {
                        if ((fileList ?? []).length > 0) return Promise.resolve();
                        return Promise.reject(new Error("请至少上传 1 张轮播图"));
                      }
                    }
                  ]}
                >
                  <Upload
                    listType="picture-card"
                    multiple
                    maxCount={6}
                    beforeUpload={() => {
                      return false;
                    }}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <CameraOutlined />
                      <span className="text-xs">上传轮播</span>
                    </div>
                  </Upload>
                </Form.Item>

                <Form.Item label="标签 badges（每行一个，可选）" name="badgesText">
                  <Input.TextArea rows={4} placeholder={"例如：\n极速接单\n极速响应\n服务至上"} />
                </Form.Item>

                <Form.Item label="商品说明（每行一个，可选）" name="descriptionText">
                  <Input.TextArea rows={4} placeholder={"例如：\n必须打绝密...\n可单护可双护..."} />
                </Form.Item>

                <Form.Item label="下单须知（每行：level:text，可选）" name="noticesText">
                  <Input.TextArea
                    rows={4}
                    placeholder={
                      "例如：\nerror:未成年禁止下单\nerror:拒绝卡保底行为\ninfo:服务过程中请勿顶号"
                    }
                  />
                </Form.Item>
              </div>
            </div>

            {!readOnly ? (
              <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
                <Button onClick={handleGoBack}>取消</Button>
                <Button type="primary" loading={submitLoading} onClick={handleSubmit}>
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
