"use strict";

/**
 * 演示数据写入（需在 `pnpm prisma migrate deploy` 之后运行）。
 *
 * `SEED_DEMO=true pnpm prisma db seed`（或开发环境不设 NODE_ENV=production 时也会写入）
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const {
  PrismaClient,
  CatalogProductStatus,
  BizOrderStatus,
  BizRefundStatus,
  WorkerJoinApplicationStatus,
  WorkerAssessmentKind,
  WorkerAccountOperationalStatus
} = require("@prisma/client");

/** @type {import('@prisma/client').PrismaClient} */
const prisma = new PrismaClient();

async function main() {
  const allowSeed = process.env.SEED_DEMO === "true" || process.env.NODE_ENV !== "production";
  if (!allowSeed) {
    // eslint-disable-next-line no-console
    console.log("[seed] skip (set SEED_DEMO=true or use non-production NODE_ENV)");
    return;
  }

  const existingCats = await prisma.productCategory.count();
  if (existingCats === 0) {
    await prisma.productCategory.createMany({
      data: [
        { id: "PC-1001", name: "带出类", disabled: false, createdBy: "seed" },
        { id: "PC-1002", name: "保底类", disabled: false, createdBy: "seed" }
      ]
    });
    // eslint-disable-next-line no-console
    console.log("[seed] product categories created");
  }

  const existingProducts = await prisma.product.count();
  if (existingProducts === 0) {
    await prisma.product.create({
      data: {
        id: "P-10001",
        name: "绝密保底400-1000万！",
        imageUrl:
          "https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=1200&q=80",
        heroImages: [
          "https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1542751110-97427bbecf20?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80"
        ],
        titleAccent: "赠送转盘",
        categoryId: "PC-1002",
        categoryName: "保底类",
        price: 69.9,
        originPrice: 128,
        stockText: "LIMITED STOCK",
        badges: ["极速接单", "极速响应", "服务至上", "官方严选"],
        descriptionLines: [
          "必须打绝密并且保底400-1000万！（地图由打手选择）",
          "可单护可双护根据打手情况来。",
          "专业打手，稳定产出，极速回款。"
        ],
        notices: [
          {
            id: "notice-1",
            level: "error",
            text: "未成年禁止下单。本店严格执行国家未成年人防沉迷相关规定。"
          },
          {
            id: "notice-2",
            level: "error",
            text: "拒绝卡保底行为。一经发现，立即终止服务且不予退款。"
          },
          {
            id: "notice-3",
            level: "info",
            text: "服务过程中请勿顶号，否则造成的损失由买家自行承担。"
          }
        ],
        status: CatalogProductStatus.enabled,
        createdBy: "seed"
      }
    });
    // eslint-disable-next-line no-console
    console.log("[seed] demo product created");
  }

  const orders = await prisma.bizOrder.count();
  if (orders === 0) {
    await prisma.bizOrder.createMany({
      data: [
        {
          id: "o1",
          orderNo: "ORD-8829-X",
          status: BizOrderStatus.pendingTake,
          packageTag: "至尊服务",
          serviceTitle: "暗区突围：全地图红卡带出",
          amount: 2899,
          quantityText: "× 1 套服务",
          coverImage:
            "https://lh3.googleusercontent.com/aida-public/AB6AXuDYi_2hfQ_QdmpZ6R0mEIRmCWANryQA3XfuFHRAshY17FNjeqygj4SItHwCbhseAOQYktoTId8sfzwAndrUsafJXNXzp30xQMB3VMxOeDcysbav0fMG1fXmLNFfkZaH__ly4KkLomU6q3tN0ljl3kdV44q7QkW67QmQuLbkDEPovMEWPHTu7yT_Vwbk2-9GgOhOSorTrrv1cCSqxCZMw-Dc06d256Yzx6naV6K9vwg1-JsOA9OehopSCDGbkvn_r9ZrGpV3o0XskdA",
          payMethod: "极氪代币支付",
          paidAmount: 2899,
          deliveries: [
            { id: "d1", text: "绝密红卡 (400-1000万价值)", done: false },
            { id: "d2", text: "全套满配装备 & 弹药补给", done: false },
            { id: "d3", text: "角色技能等级经验提升", done: false }
          ],
          createdBy: "seed",
          userId: null,
          productId: null,
          refundStatus: BizRefundStatus.none,
          assignedWorkerId: null,
          assignedAt: "",
          completedAt: "",
          wxTransactionId: null
        },
        {
          id: "o2",
          orderNo: "ORD-7741-K",
          status: BizOrderStatus.pendingPay,
          packageTag: "标准套餐",
          serviceTitle: "使命召唤：现代战争 III 全皮肤解锁",
          amount: 599,
          quantityText: "× 1 套服务",
          coverImage:
            "https://images.unsplash.com/photo-1542751110-97427bbecf20?auto=format&fit=crop&w=1200&q=80",
          payMethod: "待支付",
          paidAmount: 0,
          deliveries: [],
          createdBy: "seed",
          userId: null,
          productId: null,
          refundStatus: BizRefundStatus.none,
          assignedWorkerId: null,
          assignedAt: "",
          completedAt: "",
          wxTransactionId: null
        }
      ]
    });
    // eslint-disable-next-line no-console
    console.log("[seed] demo orders created");
  }

  const apps = await prisma.workerJoinApplication.count();
  if (apps === 0) {
    await prisma.workerJoinApplication.createMany({
      data: [
        {
          id: "app-1",
          refNo: "WK-2026-DEMO-0001",
          userId: "seed-user-1",
          realName: "张三",
          age: 22,
          phone: "+8613711112222",
          idNo: "110101199001011234",
          assessmentType: WorkerAssessmentKind.fps,
          status: WorkerJoinApplicationStatus.reviewing
        },
        {
          id: "app-2",
          refNo: "WK-2026-DEMO-0002",
          userId: "seed-user-2",
          realName: "李四",
          age: 26,
          phone: "+8613812345678",
          idNo: "310101199201011234",
          assessmentType: WorkerAssessmentKind.moba,
          status: WorkerJoinApplicationStatus.approved
        }
      ]
    });

    await prisma.workerAccount.upsert({
      where: { userId: "seed-user-2" },
      update: {},
      create: {
        id: "worker-seed-1",
        userId: "seed-user-2",
        realName: "李四",
        phone: "+8613812345678",
        assessmentType: WorkerAssessmentKind.moba,
        joinStatus: WorkerJoinApplicationStatus.approved,
        status: WorkerAccountOperationalStatus.active
      }
    });

    // eslint-disable-next-line no-console
    console.log("[seed] demo worker applications + account created");
  }
}

main()
  .catch((e) => {
    console.error("[seed]", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
