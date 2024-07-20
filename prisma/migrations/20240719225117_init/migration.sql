-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'PROCESSING', 'RETURNED');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'CANCELLED', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'INSTALLMENT_PAYMENT');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "order_status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "email_status" "NotificationStatus" NOT NULL,
    "telegram_status" "NotificationStatus" NOT NULL,
    "payment_status" "PaymentStatus" NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL,
    "promo_code" TEXT,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_reservations" (
    "id" SERIAL NOT NULL,
    "reservation_id" TEXT NOT NULL,
    "reservation_type" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT NOT NULL,
    "order_id" INTEGER NOT NULL,

    CONSTRAINT "order_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservation_prices" (
    "id" SERIAL NOT NULL,
    "price_type" TEXT NOT NULL,
    "base_price" INTEGER NOT NULL,
    "current_price" INTEGER NOT NULL,
    "amount_persons" INTEGER NOT NULL,
    "order_reservation_id" INTEGER NOT NULL,

    CONSTRAINT "reservation_prices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_reservations" ADD CONSTRAINT "order_reservations_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_prices" ADD CONSTRAINT "reservation_prices_order_reservation_id_fkey" FOREIGN KEY ("order_reservation_id") REFERENCES "order_reservations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
