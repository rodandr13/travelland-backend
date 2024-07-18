/*
  Warnings:

  - You are about to drop the column `actual_price` on the `reservation_prices` table. All the data in the column will be lost.
  - Added the required column `current_price` to the `reservation_prices` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "reservation_prices" DROP COLUMN "actual_price",
ADD COLUMN     "current_price" INTEGER NOT NULL;
