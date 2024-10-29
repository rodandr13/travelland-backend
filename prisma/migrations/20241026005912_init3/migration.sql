/*
  Warnings:

  - Added the required column `category_description` to the `cart_item_options` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "cart_item_options" ADD COLUMN     "category_description" TEXT NOT NULL;
