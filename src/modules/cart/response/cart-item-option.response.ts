import { Decimal } from '@prisma/client/runtime/library';

export type CartItemOptionResponse = {
  id: number;
  price_type: string;
  base_price: Decimal;
  current_price: Decimal;
  quantity: number;
  category_title: string;
  category_description: string;
  total_base_price: Decimal;
  total_current_price: Decimal;
};
