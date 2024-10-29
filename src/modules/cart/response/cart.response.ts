import { CartStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

import { CartItemResponse } from './cart-item.response';

export type CartResponse = {
  id: number;
  status: CartStatus;
  user_id: number | null;
  guest_session_id: string | null;
  total_base_price: Decimal;
  total_current_price: Decimal;
  cart_items: CartItemResponse[];
};
