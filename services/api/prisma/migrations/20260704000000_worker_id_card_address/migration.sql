-- AlterTable
ALTER TABLE `WorkerJoinApplication`
  ADD COLUMN `idCardFrontUrl` TEXT NULL,
  ADD COLUMN `idCardBackUrl` TEXT NULL;

-- AlterTable
ALTER TABLE `WorkerAccount`
  ADD COLUMN `idNo` VARCHAR(191) NULL,
  ADD COLUMN `address` TEXT NULL,
  ADD COLUMN `idCardFrontUrl` TEXT NULL,
  ADD COLUMN `idCardBackUrl` TEXT NULL;
