import { JsonValue } from '@prisma/client/runtime/library';

export type CartItemResponse = {
  id: number;
  service_id: string;
  service_type: string;
  date: Date;
  time: string;
  options: JsonValue;
};
