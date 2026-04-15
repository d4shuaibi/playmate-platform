import { View, Text, ScrollView, Image } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import "./index.scss";
import { BottomBar } from "../../components/bottom-bar/BottomBar";
import { getRole, setRole } from "../../utils/role";

type WorkerIncomeDetailData = {
  id: string;
  amountText: string;
  settleStateText: string;
  orderNo: string;
  serviceType: string;
  completedAt: string;
  settleNote: string;
  coverImage: string;
};

// TODO(backend): 接入单条收益详情接口（按 recordId 返回金额、状态、订单与结算说明）
const mockIncomeDetail: WorkerIncomeDetailData = {
  id: "hist-5",
  amountText: "+¥120.00",
  settleStateText: "结算成功",
  orderNo: "ORD-20240523-9981",
  serviceType: "绝密保底带出",
  completedAt: "2024-05-23 14:30:22",
  settleNote: "工资将由财务月结后统一发放到银行卡或微信。如有疑问，请及时联系您的专属派单专员。",
  coverImage:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCjMMjMZ2dQLo_8g0j_rrHnwdEaO-tHSED9oKt0BCQpqb1IcQ7Ub2TvmzCfcc9fdidasMHIvRT8KTCVe4M97DmZEhJJvQxSMdc1li4pfzE0VGD1AzHkhvsE5X2ciJ89wQgpES6O3lg9vP1U2h6YVeVDVVy3aZPOkZBzRvPRz3wNqyDslRGgfegaFkPe_tu-uOos9xviyve7xH2cZ5M7eM8dps2q8XwoC-iQ1J0BSXB2vYySG14g4TDWph8b0qDdBSEUBtWz5OJoAkk"
};

const WorkerIncomeDetailPage = () => {
  const role = getRole();
  const router = useRouter();
  const recordId = String(router.params?.id ?? "");

  if (role !== "worker") {
    setRole("user");
    void Taro.showToast({ title: "仅打手可查看收益详情", icon: "none" });
    void Taro.redirectTo({ url: "/pages/home-user/index" });
    return <View className="workerIncomeDetail" />;
  }

  const handleContactDispatcher = () => {
    // TODO(backend): 按 recordId 打开派单员会话/工单
    void Taro.showToast({ title: `联系派单员（${recordId || "mock"}）`, icon: "none" });
  };

  return (
    <View className="workerIncomeDetail">
      <ScrollView className="workerIncomeDetail__scroll" scrollY enhanced showScrollbar={false}>
        <View className="workerIncomeDetail__hero">
          <View className="workerIncomeDetail__heroIconWrap">
            <Text className="workerIncomeDetail__heroIcon">✓</Text>
          </View>
          <Text className="workerIncomeDetail__heroAmount">{mockIncomeDetail.amountText}</Text>
          <Text className="workerIncomeDetail__heroState">{mockIncomeDetail.settleStateText}</Text>
        </View>

        <View className="workerIncomeDetail__section workerIncomeDetail__orderCard">
          <View className="workerIncomeDetail__kvRow">
            <Text className="workerIncomeDetail__kvKey">订单编号</Text>
            <Text className="workerIncomeDetail__kvValue">{mockIncomeDetail.orderNo}</Text>
          </View>
          <View className="workerIncomeDetail__kvRow">
            <Text className="workerIncomeDetail__kvKey">服务类型</Text>
            <Text className="workerIncomeDetail__kvValue workerIncomeDetail__kvValue--strong">
              {mockIncomeDetail.serviceType}
            </Text>
          </View>
          <View className="workerIncomeDetail__kvRow">
            <Text className="workerIncomeDetail__kvKey">完成时间</Text>
            <Text className="workerIncomeDetail__kvValue">{mockIncomeDetail.completedAt}</Text>
          </View>
        </View>

        <View className="workerIncomeDetail__section workerIncomeDetail__noteCard">
          <View className="workerIncomeDetail__noteHeader">
            <Text className="workerIncomeDetail__noteIcon">ⓘ</Text>
            <Text className="workerIncomeDetail__noteTitle">结算说明</Text>
          </View>
          <Text className="workerIncomeDetail__noteDesc">{mockIncomeDetail.settleNote}</Text>
        </View>

        <View className="workerIncomeDetail__posterWrap">
          <Image
            className="workerIncomeDetail__poster"
            src={mockIncomeDetail.coverImage}
            mode="aspectFill"
          />
          <View className="workerIncomeDetail__posterMask" />
          <Text className="workerIncomeDetail__posterTag">Elite Command Center</Text>
        </View>

        <View className="workerIncomeDetail__actionWrap">
          <View
            className="workerIncomeDetail__actionBtn"
            onClick={handleContactDispatcher}
            aria-label="联系派单员"
          >
            <Text className="workerIncomeDetail__actionBtnIcon">🎧</Text>
            <Text className="workerIncomeDetail__actionBtnText">联系派单员</Text>
          </View>
        </View>
      </ScrollView>

      <BottomBar role={role} activeKey="income" />
    </View>
  );
};

export default WorkerIncomeDetailPage;
