import { Button, Card, Result } from "antd";
import { Link } from "react-router-dom";

export const NotFoundPage = () => {
  return (
    <Card>
      <Result
        status="404"
        title="404"
        subTitle="页面不存在，请检查访问路径。"
        extra={
          <Button type="primary">
            <Link to="/" aria-label="返回首页" tabIndex={0}>
              返回首页
            </Link>
          </Button>
        }
      />
    </Card>
  );
};
