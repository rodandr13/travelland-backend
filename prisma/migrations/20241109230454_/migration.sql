/*
  Warnings:

  - The values [INSTALLMENT_PAYMENT] on the enum `PaymentMethod` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PaymentMethod_new" AS ENUM ('CASH', 'CARD', 'PREPAYMENT');
ALTER TABLE "orders" ALTER COLUMN "payment_method" TYPE "PaymentMethod_new" USING ("payment_method"::text::"PaymentMethod_new");
ALTER TABLE "payments" ALTER COLUMN "method" TYPE "PaymentMethod_new" USING ("method"::text::"PaymentMethod_new");
ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old";
ALTER TYPE "PaymentMethod_new" RENAME TO "PaymentMethod";
DROP TYPE "PaymentMethod_old";
COMMIT;
