/*
  Warnings:

  - Changed the type of `reservation_id` on the `order_reservations` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "order_reservations" DROP COLUMN "reservation_id",
ADD COLUMN     "reservation_id" UUID NOT NULL;
