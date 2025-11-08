-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "category" TEXT,
ADD COLUMN     "stock" INTEGER NOT NULL DEFAULT 0;
