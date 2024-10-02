/*
  Warnings:

  - You are about to drop the column `paid_amount` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `payment_status` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `paid_at` on the `payments` table. All the data in the column will be lost.
  - Made the column `transaction_id` on table `payments` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "orders_payment_status_idx";

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "paid_amount",
DROP COLUMN "payment_status";

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "paid_at",
ALTER COLUMN "transaction_id" SET NOT NULL;
