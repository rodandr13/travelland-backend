-- AlterTable
ALTER TABLE "cart_item_options" ALTER COLUMN "base_price" SET DEFAULT 0,
ALTER COLUMN "current_price" SET DEFAULT 0,
ALTER COLUMN "total_base_price" SET DEFAULT 0,
ALTER COLUMN "total_current_price" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "cart_items" ALTER COLUMN "total_base_price" SET DEFAULT 0,
ALTER COLUMN "total_current_price" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "carts" ALTER COLUMN "total_base_price" SET DEFAULT 0,
ALTER COLUMN "total_current_price" SET DEFAULT 0;
