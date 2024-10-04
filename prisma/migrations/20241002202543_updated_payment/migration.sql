/*
  Warnings:

  - You are about to drop the column `method` on the `payments` table. All the data in the column will be lost.
  - Changed the type of `transaction_id` on the `payments` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "payments" DROP COLUMN "method",
ADD COLUMN     "prcode" TEXT,
ADD COLUMN     "result_text" TEXT,
ADD COLUMN     "srcode" TEXT,
DROP COLUMN "transaction_id",
ADD COLUMN     "transaction_id" INTEGER NOT NULL;
