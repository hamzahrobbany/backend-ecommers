/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `Tenant` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `Tenant` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "address" TEXT,
ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "phone" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_code_key" ON "Tenant"("code");
