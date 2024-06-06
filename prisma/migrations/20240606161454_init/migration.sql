-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('NOT_SENT', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "active" BOOLEAN NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "excursion_id" TEXT NOT NULL,
    "selected_date" TIMESTAMP(3) NOT NULL,
    "time" TEXT NOT NULL,
    "total_price" INTEGER NOT NULL,
    "order_status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "email_status" "NotificationStatus" NOT NULL DEFAULT 'NOT_SENT',
    "telegram_status" "NotificationStatus" NOT NULL DEFAULT 'NOT_SENT',

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_details" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,

    CONSTRAINT "price_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prices" (
    "id" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price_detail_id" TEXT NOT NULL,
    "base_price_detail_id" TEXT NOT NULL,

    CONSTRAINT "prices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "price_details_order_id_key" ON "price_details"("order_id");

-- AddForeignKey
ALTER TABLE "price_details" ADD CONSTRAINT "price_details_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prices" ADD CONSTRAINT "prices_price_detail_id_fkey" FOREIGN KEY ("price_detail_id") REFERENCES "price_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prices" ADD CONSTRAINT "prices_base_price_detail_id_fkey" FOREIGN KEY ("base_price_detail_id") REFERENCES "price_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
