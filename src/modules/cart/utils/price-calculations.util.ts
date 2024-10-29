import { Prisma } from '@prisma/client';

import { ItemOptionDto } from '../dto/item-option.dto';

export interface PriceTotals {
  totalBasePrice: Prisma.Decimal;
  totalCurrentPrice: Prisma.Decimal;
}

interface PrepareOptionsParams {
  options: ItemOptionDto[];
  cartItemId?: number;
}

export const calculateOptionTotals = (
  basePrice: number | Prisma.Decimal,
  currentPrice: number | Prisma.Decimal,
  quantity: number,
): PriceTotals => {
  const totalBasePrice = new Prisma.Decimal(basePrice).mul(
    new Prisma.Decimal(quantity),
  );

  const totalCurrentPrice = new Prisma.Decimal(currentPrice).mul(
    new Prisma.Decimal(quantity),
  );

  return {
    totalBasePrice,
    totalCurrentPrice,
  };
};

export const calculateCartItemTotals = (
  options: ItemOptionDto[],
): PriceTotals => {
  return options.reduce(
    (sum, option) => {
      const optionTotals = calculateOptionTotals(
        option.base_price,
        option.current_price,
        option.quantity,
      );

      return {
        totalBasePrice: sum.totalBasePrice.add(optionTotals.totalBasePrice),
        totalCurrentPrice: sum.totalCurrentPrice.add(
          optionTotals.totalCurrentPrice,
        ),
      };
    },
    {
      totalBasePrice: new Prisma.Decimal(0),
      totalCurrentPrice: new Prisma.Decimal(0),
    },
  );
};

export const prepareCartItemOptions = ({
  options,
  cartItemId,
}: PrepareOptionsParams) => {
  return options.map((option) => {
    const { totalBasePrice, totalCurrentPrice } = calculateOptionTotals(
      option.base_price,
      option.current_price,
      option.quantity,
    );

    return {
      price_type: option.price_type,
      base_price: option.base_price,
      current_price: option.current_price,
      quantity: option.quantity,
      category_title: option.category_title,
      category_description: option.category_description,
      total_base_price: totalBasePrice,
      total_current_price: totalCurrentPrice,
      ...(cartItemId && { cart_item_id: cartItemId }),
    };
  });
};
