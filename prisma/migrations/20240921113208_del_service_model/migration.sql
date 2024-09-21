/*
  Warnings:

  - You are about to drop the `services` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_service_id_fkey";

-- AlterTable
ALTER TABLE "order_items" ALTER COLUMN "service_id" SET DATA TYPE TEXT;

-- DropTable
DROP TABLE "services";
