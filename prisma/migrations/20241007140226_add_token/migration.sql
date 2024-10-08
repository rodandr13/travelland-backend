/*
  Warnings:

  - A unique constraint covering the columns `[token]` on the table `payments` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "token" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "payments_token_key" ON "payments"("token");
