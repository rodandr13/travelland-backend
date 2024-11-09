import { Decimal } from '@prisma/client/runtime/library';

import { CartItemOptionResponse } from './cart-item-option.response';

export type CartItemResponse = {
  id: number;
  service_id: string;
  service_type: string;
  date: Date;
  time: string;
  slug: string;
  title: string;
  image_lqip: string;
  image_src: string;
  total_base_price: Decimal;
  total_current_price: Decimal;
  cart_item_options: CartItemOptionResponse[];
};
