-- 商品分类、商品、客服、打手入驻与订单等业务表落库

-- CreateEnum
CREATE TYPE "CatalogProductStatus" AS ENUM ('enabled', 'disabled');

-- CreateEnum
CREATE TYPE "BizOrderStatus" AS ENUM ('pendingPay', 'pendingTake', 'serving', 'pendingDone', 'done', 'cancelled');

-- CreateEnum
CREATE TYPE "BizRefundStatus" AS ENUM ('none', 'pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "WorkerJoinApplicationStatus" AS ENUM ('submitted', 'reviewing', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "WorkerAccountOperationalStatus" AS ENUM ('active', 'disabled');

-- CreateEnum
CREATE TYPE "WorkerAssessmentKind" AS ENUM ('moba', 'fps', 'strategy', 'all_around');

-- CreateTable
CREATE TABLE "ProductCategory" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "heroImages" TEXT[],
    "titleAccent" TEXT NOT NULL DEFAULT '',
    "categoryId" TEXT NOT NULL,
    "categoryName" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "originPrice" DECIMAL(12,2),
    "stockText" TEXT NOT NULL DEFAULT '',
    "badges" TEXT[],
    "descriptionLines" TEXT[],
    "notices" JSONB NOT NULL DEFAULT '[]',
    "status" "CatalogProductStatus" NOT NULL DEFAULT 'enabled',
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerServiceAgent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "nickname" TEXT NOT NULL,
    "wechatId" TEXT NOT NULL,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "avatarUrl" TEXT NOT NULL,
    "wechatQrUrl" TEXT NOT NULL,

    CONSTRAINT "CustomerServiceAgent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerJoinApplication" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "refNo" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "realName" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "phone" TEXT NOT NULL,
    "idNo" TEXT NOT NULL,
    "assessmentType" "WorkerAssessmentKind" NOT NULL,
    "status" "WorkerJoinApplicationStatus" NOT NULL,
    "rejectReason" TEXT,

    CONSTRAINT "WorkerJoinApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerAccount" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "realName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "assessmentType" "WorkerAssessmentKind" NOT NULL,
    "joinStatus" "WorkerJoinApplicationStatus" NOT NULL DEFAULT 'approved',
    "status" "WorkerAccountOperationalStatus" NOT NULL DEFAULT 'active',

    CONSTRAINT "WorkerAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "biz_orders" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "orderNo" TEXT NOT NULL,
    "status" "BizOrderStatus" NOT NULL,
    "packageTag" TEXT NOT NULL,
    "serviceTitle" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "quantityText" TEXT NOT NULL,
    "coverImage" TEXT NOT NULL,
    "payMethod" TEXT NOT NULL,
    "paidAmount" DECIMAL(12,2) NOT NULL,
    "deliveries" JSONB NOT NULL DEFAULT '[]',
    "createdBy" TEXT NOT NULL,
    "userId" TEXT,
    "productId" TEXT,
    "refundStatus" "BizRefundStatus" NOT NULL DEFAULT 'none',
    "assignedWorkerId" TEXT,
    "assignedAt" TEXT NOT NULL DEFAULT '',
    "completedAt" TEXT NOT NULL DEFAULT '',
    "wxTransactionId" TEXT,

    CONSTRAINT "biz_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateIndex
CREATE INDEX "Product_status_idx" ON "Product"("status");

-- CreateIndex
CREATE INDEX "CustomerServiceAgent_disabled_idx" ON "CustomerServiceAgent"("disabled");

-- CreateIndex
CREATE UNIQUE INDEX "WorkerJoinApplication_refNo_key" ON "WorkerJoinApplication"("refNo");

-- CreateIndex
CREATE INDEX "WorkerJoinApplication_userId_idx" ON "WorkerJoinApplication"("userId");

-- CreateIndex
CREATE INDEX "WorkerJoinApplication_status_idx" ON "WorkerJoinApplication"("status");

-- CreateIndex
CREATE UNIQUE INDEX "WorkerAccount_userId_key" ON "WorkerAccount"("userId");

-- CreateIndex
CREATE INDEX "WorkerAccount_joinStatus_idx" ON "WorkerAccount"("joinStatus");

-- CreateIndex
CREATE INDEX "WorkerAccount_status_idx" ON "WorkerAccount"("status");

-- CreateIndex
CREATE UNIQUE INDEX "biz_orders_orderNo_key" ON "biz_orders"("orderNo");

-- CreateIndex
CREATE INDEX "biz_orders_userId_status_idx" ON "biz_orders"("userId", "status");

-- CreateIndex
CREATE INDEX "biz_orders_status_idx" ON "biz_orders"("status");

-- CreateIndex
CREATE INDEX "biz_orders_assignedWorkerId_idx" ON "biz_orders"("assignedWorkerId");

-- CreateIndex
CREATE INDEX "biz_orders_createdAt_idx" ON "biz_orders"("createdAt");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "biz_orders" ADD CONSTRAINT "biz_orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "biz_orders" ADD CONSTRAINT "biz_orders_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
