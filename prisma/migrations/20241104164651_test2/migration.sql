-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_cart_id_fkey";

-- AlterTable
ALTER TABLE "orders" ALTER COLUMN "cart_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
