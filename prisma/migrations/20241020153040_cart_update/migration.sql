/*
  Warnings:

  - A unique constraint covering the columns `[cart_id,service_id,service_type,date,time]` on the table `cart_items` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "cart_items_cart_id_service_id_service_type_date_time_key" ON "cart_items"("cart_id", "service_id", "service_type", "date", "time");

-- CreateIndex
CREATE INDEX "carts_user_id_idx" ON "carts"("user_id");

-- CreateIndex
CREATE INDEX "carts_guest_session_id_idx" ON "carts"("guest_session_id");
