import {
  AlertOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  LineChartOutlined,
  PlusSquareOutlined,
  SearchOutlined,
  SettingOutlined,
  TeamOutlined,
  UserAddOutlined
} from "@ant-design/icons";
import { Button, Card, Tag, Typography } from "antd";
import { useNavigate } from "react-router-dom";

type KpiCard = {
  key: string;
  title: string;
  valueText: string;
  trendText: string;
  trendUp?: boolean;
  badgeText?: string;
  tone: "primary" | "success" | "warning" | "danger";
};

type TrendBar = {
  dateLabel: string;
  heightPercent: number;
  amountText: string;
  isToday?: boolean;
};

type TodoCard = {
  key: string;
  typeLabel: string;
  title: string;
  desc: string;
  actionText: string;
  highlight?: "danger" | "primary" | "warning";
};

// TODO(backend): 接入系统总揽聚合接口（订单状态统计、营收统计、异常统计）
const mockKpiCards: KpiCard[] = [
  {
    key: "pendingDispatch",
    title: "待派单",
    valueText: "128",
    trendText: "+12%",
    trendUp: true,
    badgeText: "LIVE",
    tone: "primary"
  },
  {
    key: "inProgress",
    title: "进行中",
    valueText: "452",
    trendText: "-3%",
    trendUp: false,
    tone: "success"
  },
  {
    key: "abnormal",
    title: "异常/超时",
    valueText: "14",
    trendText: "需要紧急处理",
    badgeText: "ALERT",
    tone: "danger"
  },
  {
    key: "todayRevenue",
    title: "今日成交额",
    valueText: "¥84,290",
    trendText: "+24.5%",
    trendUp: true,
    tone: "warning"
  }
];

// TODO(backend): 接入交易趋势接口（按天返回订单量/营收）
const mockTrendBars: TrendBar[] = [
  { dateLabel: "05/12", heightPercent: 60, amountText: "¥12,400" },
  { dateLabel: "05/13", heightPercent: 45, amountText: "¥10,260" },
  { dateLabel: "05/14", heightPercent: 75, amountText: "¥13,880" },
  { dateLabel: "05/15", heightPercent: 90, amountText: "¥17,420" },
  { dateLabel: "05/16", heightPercent: 55, amountText: "¥11,970" },
  { dateLabel: "05/17", heightPercent: 65, amountText: "¥12,860" },
  { dateLabel: "05/18", heightPercent: 80, amountText: "¥15,630" },
  { dateLabel: "TODAY", heightPercent: 95, amountText: "¥18,520", isToday: true }
];

// TODO(backend): 接入客服工作台待办接口（SLA、入驻审核、投诉争议）
const mockTodoCards: TodoCard[] = [
  {
    key: "slaWarning",
    typeLabel: "SLA 警报",
    title: "订单 #OD-92819 响应超时",
    desc: "打手 15 分钟未确认，请立即处理。",
    actionText: "立即处理",
    highlight: "danger"
  },
  {
    key: "workerReview",
    typeLabel: "入驻审核",
    title: "林克（王者荣耀专家）",
    desc: "申请等级：SSS级打手，等待审核。",
    actionText: "查看资料",
    highlight: "primary"
  },
  {
    key: "complaint",
    typeLabel: "投诉争议",
    title: "打手 #WS-042 被用户投诉",
    desc: "需核查录像并在 2小时45分 内完成仲裁。",
    actionText: "进入仲裁",
    highlight: "warning"
  }
];

const toneClassMap: Record<KpiCard["tone"], string> = {
  primary: "text-blue-600 bg-blue-50",
  success: "text-emerald-600 bg-emerald-50",
  warning: "text-indigo-700 bg-indigo-100",
  danger: "text-red-600 bg-red-50"
};

export const SystemOverviewPage = () => {
  const navigate = useNavigate();

  const handleQuickAction = (target: "product" | "orders" | "worker" | "setting") => {
    // TODO(backend): 对接真实业务路由/权限埋点（点击快捷入口统计）
    if (target === "product") {
      void navigate("/home");
      return;
    }
    if (target === "orders") {
      void navigate("/home");
      return;
    }
    if (target === "worker") {
      void navigate("/home");
      return;
    }
    void navigate("/home");
  };

  const handleTodoAction = (todoKey: string) => {
    // TODO(backend): 根据待办类型跳转对应详情页（订单详情/审核详情/仲裁详情）
    void navigate(`/home?todo=${encodeURIComponent(todoKey)}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Typography.Title level={3} className="!mb-1">
            系统总揽
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 !text-slate-500">
            全局监控订单、营收、异常与运营待办（管理员专属）
          </Typography.Paragraph>
        </div>
        <Tag color="gold" className="!m-0 !rounded-full !px-3 !py-1">
          ADMIN ONLY
        </Tag>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {mockKpiCards.map((card) => (
          <Card
            key={card.key}
            className="rounded-2xl border-0 shadow-sm transition-transform hover:-translate-y-0.5"
            bodyStyle={{ padding: 20 }}
          >
            <div className="mb-4 flex items-start justify-between">
              <div className={`rounded-xl p-2 ${toneClassMap[card.tone]}`}>
                {card.key === "pendingDispatch" ? <ClockCircleOutlined /> : null}
                {card.key === "inProgress" ? <LineChartOutlined /> : null}
                {card.key === "abnormal" ? <ExclamationCircleOutlined /> : null}
                {card.key === "todayRevenue" ? <CheckCircleOutlined /> : null}
              </div>
              {card.badgeText ? (
                <Tag color={card.tone === "danger" ? "error" : "blue"}>{card.badgeText}</Tag>
              ) : null}
            </div>
            <Typography.Text className="!text-slate-500">{card.title}</Typography.Text>
            <div className="mt-1 flex items-end gap-2">
              <Typography.Title level={3} className="!mb-0 !text-[26px] !leading-none">
                {card.valueText}
              </Typography.Title>
              <Typography.Text
                className={`!text-xs ${card.trendUp ? "!text-emerald-600" : "!text-red-500"}`}
              >
                {card.trendText}
              </Typography.Text>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="rounded-2xl border-0 shadow-sm xl:col-span-2" bodyStyle={{ padding: 24 }}>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
            <div>
              <Typography.Title level={4} className="!mb-1">
                交易趋势
              </Typography.Title>
              <Typography.Text className="!text-slate-500">
                每日订单量与营收数据监控
              </Typography.Text>
            </div>
            <div className="flex items-center gap-2">
              <Button size="small">近7天</Button>
              <Button type="primary" size="small">
                近30天
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
              <div className="border-t border-dashed border-slate-200" />
              <div className="border-t border-dashed border-slate-200" />
              <div className="border-t border-dashed border-slate-200" />
              <div className="border-t border-dashed border-slate-200" />
            </div>
            <div className="relative flex h-64 items-end gap-2">
              {mockTrendBars.map((bar) => (
                <div key={bar.dateLabel} className="group flex-1">
                  <div
                    className={`w-full rounded-t-md transition-colors ${
                      bar.isToday ? "bg-blue-500" : "bg-blue-200 hover:bg-blue-300"
                    }`}
                    style={{ height: `${bar.heightPercent}%` }}
                    title={bar.amountText}
                  />
                  <div className="mt-2 text-center text-[10px] font-semibold text-slate-500">
                    {bar.dateLabel}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm" bodyStyle={{ padding: 20 }}>
          <div className="mb-4 flex items-center justify-between">
            <Typography.Title level={4} className="!mb-0">
              我的待办
            </Typography.Title>
            <Tag color="error">5</Tag>
          </div>
          <div className="space-y-3">
            {mockTodoCards.map((item) => (
              <div key={item.key} className="rounded-xl bg-slate-50 p-3">
                <div className="mb-1 flex items-center gap-2">
                  {item.highlight === "danger" ? <AlertOutlined className="text-red-500" /> : null}
                  {item.highlight === "primary" ? (
                    <UserAddOutlined className="text-blue-600" />
                  ) : null}
                  {item.highlight === "warning" ? (
                    <ExclamationCircleOutlined className="text-amber-500" />
                  ) : null}
                  <Typography.Text className="!text-xs !font-semibold !text-slate-500">
                    {item.typeLabel}
                  </Typography.Text>
                </div>
                <Typography.Text className="!font-medium">{item.title}</Typography.Text>
                <Typography.Paragraph className="!mb-2 !mt-1 !text-xs !text-slate-500">
                  {item.desc}
                </Typography.Paragraph>
                <Button size="small" onClick={() => handleTodoAction(item.key)}>
                  {item.actionText}
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm" bodyStyle={{ padding: 20 }}>
        <Typography.Title level={5} className="!mb-3 !uppercase !tracking-wider !text-slate-500">
          快捷入口
        </Typography.Title>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Button
            className="!h-24 !rounded-2xl"
            icon={<PlusSquareOutlined />}
            onClick={() => handleQuickAction("product")}
          >
            创建商品
          </Button>
          <Button
            className="!h-24 !rounded-2xl"
            icon={<SearchOutlined />}
            onClick={() => handleQuickAction("orders")}
          >
            查询订单
          </Button>
          <Button
            className="!h-24 !rounded-2xl"
            icon={<TeamOutlined />}
            onClick={() => handleQuickAction("worker")}
          >
            审核打手
          </Button>
          <Button
            className="!h-24 !rounded-2xl"
            icon={<SettingOutlined />}
            onClick={() => handleQuickAction("setting")}
          >
            系统设置
          </Button>
        </div>
      </Card>
    </div>
  );
};
