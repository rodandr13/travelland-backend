import { PaymentMethod } from '@prisma/client';

export type CreateOrderResponse = {
  payment_method: PaymentMethod;
  token?: string;
  redirect?: string;
};
