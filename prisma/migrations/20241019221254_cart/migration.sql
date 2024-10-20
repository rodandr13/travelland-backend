/*
  Warnings:

  - You are about to drop the column `quantity` on the `cart_items` table. All the data in the column will be lost.
  - Added the required column `date` to the `cart_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `time` to the `cart_items` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CartStatus" AS ENUM ('ACTIVE', 'ORDERED', 'ABANDONED', 'EXPIRED');

-- DropIndex
DROP INDEX "carts_guest_session_id_key";

-- DropIndex
DROP INDEX "carts_user_id_key";

-- AlterTable
ALTER TABLE "cart_items" DROP COLUMN "quantity",
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "time" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "carts" ADD COLUMN     "status" "CartStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "cart_item_options" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "price_type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "cart_item_id" INTEGER NOT NULL,

    CONSTRAINT "cart_item_options_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "cart_item_options" ADD CONSTRAINT "cart_item_options_cart_item_id_fkey" FOREIGN KEY ("cart_item_id") REFERENCES "cart_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
