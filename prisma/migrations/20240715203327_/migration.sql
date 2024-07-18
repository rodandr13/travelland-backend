/*
  Warnings:

  - You are about to drop the column `promocode` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the `order_services` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `service_prices` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "order_services" DROP CONSTRAINT "order_services_order_id_fkey";

-- DropForeignKey
ALTER TABLE "service_prices" DROP CONSTRAINT "service_prices_order_service_id_fkey";

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "promocode",
ADD COLUMN     "promo_code" TEXT;

-- DropTable
DROP TABLE "order_services";

-- DropTable
DROP TABLE "service_prices";

-- CreateTable
CREATE TABLE "order_reservations" (
    "id" SERIAL NOT NULL,
    "reservation_id" TEXT NOT NULL,
    "reservation_type" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT NOT NULL,
    "order_id" UUID NOT NULL,

    CONSTRAINT "order_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservation_prices" (
    "id" SERIAL NOT NULL,
    "price_type" TEXT NOT NULL,
    "base_price" INTEGER NOT NULL,
    "actual_price" INTEGER NOT NULL,
    "amount_persons" INTEGER NOT NULL,
    "order_reservation_id" INTEGER NOT NULL,

    CONSTRAINT "reservation_prices_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "order_reservations" ADD CONSTRAINT "order_reservations_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_prices" ADD CONSTRAINT "reservation_prices_order_reservation_id_fkey" FOREIGN KEY ("order_reservation_id") REFERENCES "order_reservations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
