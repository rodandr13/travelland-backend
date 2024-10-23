import { CartItemResponse } from './cart-item.response';

export type CartResponse = {
  id: number;
  status: string;
  user_id: number;
  guest_session_id: string | null;
  cart_items: CartItemResponse[];
};
