/*
  Warnings:

  - You are about to drop the column `total_price` on the `order_item_prices` table. All the data in the column will be lost.
  - You are about to drop the column `total_amount` on the `orders` table. All the data in the column will be lost.
  - Added the required column `total_base_price` to the `order_item_prices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_current_price` to the `order_item_prices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_base_price` to the `order_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_current_price` to the `order_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_base_price` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_current_price` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "order_item_prices" DROP COLUMN "total_price",
ADD COLUMN     "total_base_price" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "total_current_price" DECIMAL(65,30) NOT NULL;

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "total_base_price" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "total_current_price" DECIMAL(65,30) NOT NULL;

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "total_amount",
ADD COLUMN     "total_base_price" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "total_current_price" DECIMAL(65,30) NOT NULL;
