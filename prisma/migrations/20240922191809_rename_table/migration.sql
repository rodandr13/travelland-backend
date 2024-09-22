/*
  Warnings:

  - You are about to drop the `order_item_prices` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `order_items` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "order_item_prices" DROP CONSTRAINT "order_item_prices_order_item_id_fkey";

-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_order_id_fkey";

-- DropTable
DROP TABLE "order_item_prices";

-- DropTable
DROP TABLE "order_items";

-- CreateTable
CREATE TABLE "order_services" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "service_id" TEXT NOT NULL,
    "service_type" "ServiceType" NOT NULL,
    "service_title" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT NOT NULL,
    "slug" TEXT,
    "image_src" TEXT,
    "image_lqip" TEXT,
    "total_base_price" DECIMAL(65,30) NOT NULL,
    "total_current_price" DECIMAL(65,30) NOT NULL,
    "provider_name" TEXT,
    "provider_id" INTEGER,
    "order_id" INTEGER NOT NULL,

    CONSTRAINT "order_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_service_prices" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "price_type" TEXT NOT NULL,
    "base_price" DECIMAL(65,30) NOT NULL,
    "current_price" DECIMAL(65,30) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "category_title" TEXT NOT NULL,
    "total_base_price" DECIMAL(65,30) NOT NULL,
    "total_current_price" DECIMAL(65,30) NOT NULL,
    "order_service_id" INTEGER NOT NULL,

    CONSTRAINT "order_service_prices_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "order_services" ADD CONSTRAINT "order_services_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_service_prices" ADD CONSTRAINT "order_service_prices_order_service_id_fkey" FOREIGN KEY ("order_service_id") REFERENCES "order_services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
