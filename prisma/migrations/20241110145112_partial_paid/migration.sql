-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'PARTIALLY_PAID';

-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'PARTIALLY_PAID';

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "total_paid" DECIMAL(10,2) NOT NULL DEFAULT 0;
