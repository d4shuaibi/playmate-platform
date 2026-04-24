import { ArrowLeftOutlined } from "@ant-design/icons";
import { Button, Card, Form, Input, Typography, message } from "antd";
import { useNavigate } from "react-router-dom";
import { getAdminAuthSession } from "../../services/auth/session";
import { requestCreateProductCategory } from "../../services/product-category/api";

type CreateProductCategoryFormValues = {
  name: string;
};

export const CreateProductCategoryPage = () => {
  const [form] = Form.useForm<CreateProductCategoryFormValues>();
  const navigate = useNavigate();
  const session = getAdminAuthSession();
  const accessToken = session?.accessToken ?? "";

  const handleGoBack = () => {
    void navigate("/product-category-management");
  };

  const handleSubmit = () => {
    if (!accessToken) {
      message.error("登录已失效，请重新登录");
      void navigate("/login");
      return;
    }

    void (async () => {
      try {
        const values = await form.validateFields();
        await requestCreateProductCategory(accessToken, { name: values.name.trim() });
        message.success("商品大类创建成功");
        void navigate("/product-category-management");
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "创建失败";
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
            新增商品大类
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 !text-slate-500">
            创建商品大类并配置基础信息
          </Typography.Paragraph>
        </div>
        <Button icon={<ArrowLeftOutlined />} onClick={handleGoBack}>
          返回商品大类管理
        </Button>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm" bodyStyle={{ padding: 24 }}>
        <Form form={form} layout="vertical">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]">
            <div className="space-y-6">
              <Form.Item
                label="商品大类名称"
                name="name"
                rules={[{ required: true, message: "请输入商品大类名称" }]}
              >
                <Input placeholder="请输入商品大类名称" />
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
