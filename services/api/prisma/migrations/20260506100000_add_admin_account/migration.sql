-- CreateEnum
CREATE TYPE "AdminManagerRole" AS ENUM ('admin', 'customer_service');

-- CreateEnum
CREATE TYPE "AdminAccountStatus" AS ENUM ('active', 'disabled');

-- CreateTable
CREATE TABLE "AdminAccount" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "AdminManagerRole" NOT NULL DEFAULT 'admin',
    "status" "AdminAccountStatus" NOT NULL DEFAULT 'active',

    CONSTRAINT "AdminAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminAccount_username_key" ON "AdminAccount"("username");

-- CreateIndex
CREATE INDEX "AdminAccount_status_idx" ON "AdminAccount"("status");
