/*
  Warnings:

  - You are about to drop the column `provider_id` on the `order_services` table. All the data in the column will be lost.
  - You are about to drop the column `provider_name` on the `order_services` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "order_services" DROP COLUMN "provider_id",
DROP COLUMN "provider_name";
