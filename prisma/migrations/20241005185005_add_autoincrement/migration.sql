/*
  Warnings:

  - A unique constraint covering the columns `[transaction_id]` on the table `payments` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
CREATE SEQUENCE payments_transaction_id_seq;
ALTER TABLE "payments" ALTER COLUMN "transaction_id" SET DEFAULT nextval('payments_transaction_id_seq');
ALTER SEQUENCE payments_transaction_id_seq OWNED BY "payments"."transaction_id";

-- CreateIndex
CREATE UNIQUE INDEX "payments_transaction_id_key" ON "payments"("transaction_id");
