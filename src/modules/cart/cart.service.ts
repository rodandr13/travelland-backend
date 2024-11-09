import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CartStatus, Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { AddItemDto } from './dto/add-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { CartResponse } from './response/cart.response';
import {
  calculateCartItemTotals,
  prepareCartItemOptions,
} from './utils/price-calculations.util';

@Injectable()
export class CartService {
  private readonly selectFields = {
    id: true,
    status: true,
    user_id: true,
    guest_session_id: true,
    total_base_price: true,
    total_current_price: true,
    cart_items: {
      select: {
        id: true,
        service_id: true,
        service_type: true,
        date: true,
        time: true,
        slug: true,
        title: true,
        image_lqip: true,
        image_src: true,
        total_base_price: true,
        total_current_price: true,
        cart_item_options: true,
      },
    },
  } as const;

  constructor(private readonly prismaService: PrismaService) {}

  async addItem(
    addItemDto: AddItemDto,
    userId?: number,
    sessionId?: string,
  ): Promise<CartResponse> {
    try {
      const cart = await this.getOrCreateActiveCart(userId, sessionId);

      await this.prismaService.$transaction(async (tx) => {
        const { totalBasePrice, totalCurrentPrice } = calculateCartItemTotals(
          addItemDto.cart_item_options,
        );

        const preparedOptions = prepareCartItemOptions({
          options: addItemDto.cart_item_options,
        });

        await tx.cartItem.create({
          data: {
            cart_id: cart.id,
            service_id: addItemDto.service_id,
            service_type: addItemDto.service_type,
            date: addItemDto.date,
            time: addItemDto.time,
            slug: addItemDto.slug,
            image_src: addItemDto.image_src,
            image_lqip: addItemDto.image_lqip,
            total_current_price: totalCurrentPrice,
            total_base_price: totalBasePrice,
            title: addItemDto.title,
            cart_item_options: {
              createMany: {
                data: preparedOptions,
              },
            },
          },
          include: {
            cart_item_options: true,
          },
        });

        const cartItems = await tx.cartItem.findMany({
          where: { cart_id: cart.id },
          include: { cart_item_options: true },
        });

        const cartTotals = cartItems.reduce(
          (totals, item) => {
            return {
              totalBasePrice: totals.totalBasePrice.add(item.total_base_price),
              totalCurrentPrice: totals.totalCurrentPrice.add(
                item.total_current_price,
              ),
            };
          },
          {
            totalBasePrice: new Prisma.Decimal(0),
            totalCurrentPrice: new Prisma.Decimal(0),
          },
        );

        await tx.cart.update({
          where: { id: cart.id },
          data: {
            total_base_price: cartTotals.totalBasePrice,
            total_current_price: cartTotals.totalCurrentPrice,
          },
        });
      });

      return await this.prismaService.cart.findUnique({
        where: { id: cart.id },
        include: {
          cart_items: {
            include: {
              cart_item_options: true,
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Этот item уже существует в корзине');
        }
      }
      throw error;
    }
  }

  async updateItem(
    cartItemId: number,
    updateItemDto: UpdateItemDto,
    userId?: number,
    sessionId?: string,
  ): Promise<CartResponse> {
    try {
      const cart = await this.getOrCreateActiveCart(userId, sessionId);

      await this.prismaService.$transaction(async (tx) => {
        const { totalBasePrice, totalCurrentPrice } = calculateCartItemTotals(
          updateItemDto.cart_item_options,
        );

        const preparedOptions = prepareCartItemOptions({
          options: updateItemDto.cart_item_options,
          cartItemId,
        });

        const existingItem = await tx.cartItem.findFirst({
          where: {
            id: cartItemId,
            cart_id: cart.id,
          },
          include: {
            cart_item_options: true,
          },
        });

        if (!existingItem) {
          throw new NotFoundException('Элемент корзины не найден');
        }

        const duplicateItem = await tx.cartItem.findFirst({
          where: {
            cart_id: cart.id,
            service_id: updateItemDto.service_id,
            service_type: updateItemDto.service_type,
            date: updateItemDto.date,
            time: updateItemDto.time,
            NOT: {
              id: cartItemId,
            },
          },
        });

        if (duplicateItem) {
          throw new ConflictException(
            'Элемент с такими параметрами уже существует в корзине',
          );
        }

        await tx.cartItem.update({
          where: { id: cartItemId },
          data: {
            service_id: updateItemDto.service_id,
            service_type: updateItemDto.service_type,
            date: updateItemDto.date,
            time: updateItemDto.time,
            total_current_price: totalCurrentPrice,
            total_base_price: totalBasePrice,
          },
        });

        await tx.cartItemOption.deleteMany({
          where: {
            cart_item_id: cartItemId,
          },
        });

        await tx.cartItemOption.createMany({
          data: preparedOptions,
        });

        const cartItems = await tx.cartItem.findMany({
          where: { cart_id: cart.id },
          include: { cart_item_options: true },
        });

        const cartTotals = cartItems.reduce(
          (totals, item) => {
            return {
              totalBasePrice: totals.totalBasePrice.add(item.total_base_price),
              totalCurrentPrice: totals.totalCurrentPrice.add(
                item.total_current_price,
              ),
            };
          },
          {
            totalBasePrice: new Prisma.Decimal(0),
            totalCurrentPrice: new Prisma.Decimal(0),
          },
        );

        await tx.cart.update({
          where: { id: cart.id },
          data: {
            total_base_price: cartTotals.totalBasePrice,
            total_current_price: cartTotals.totalCurrentPrice,
          },
        });
      });

      return await this.prismaService.cart.findUnique({
        where: { id: cart.id },
        include: {
          cart_items: {
            include: {
              cart_item_options: true,
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case 'P2002':
            throw new ConflictException(
              'Невозможно обновить элемент корзины. Возможно, такой элемент уже существует.',
            );
          case 'P2025':
            throw new NotFoundException('Элемент корзины не найден');
          default:
            throw new InternalServerErrorException(
              'Произошла ошибка при обновлении элемента корзины',
            );
        }
      }
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Произошла ошибка при обновлении элемента корзины',
      );
    }
  }

  async removeItem(
    itemId: number,
    userId?: number,
    sessionId?: string,
  ): Promise<CartResponse> {
    const cart = await this.getOrCreateActiveCart(userId, sessionId);
    return this.prismaService.$transaction(async (tx) => {
      const cartItem = await tx.cartItem.findFirst({
        where: {
          id: itemId,
          cart_id: cart.id,
        },
        include: {
          cart_item_options: true,
        },
      });

      if (!cartItem) {
        throw new NotFoundException('Элемент корзины не найден');
      }

      await tx.cartItem.delete({
        where: { id: cartItem.id },
      });

      const cartItems = await tx.cartItem.findMany({
        where: { cart_id: cart.id },
        include: { cart_item_options: true },
      });

      const cartTotals = cartItems.reduce(
        (totals, item) => {
          return {
            totalBasePrice: totals.totalBasePrice.add(item.total_base_price),
            totalCurrentPrice: totals.totalCurrentPrice.add(
              item.total_current_price,
            ),
          };
        },
        {
          totalBasePrice: new Prisma.Decimal(0),
          totalCurrentPrice: new Prisma.Decimal(0),
        },
      );

      return tx.cart.update({
        where: { id: cart.id },
        data: {
          total_base_price: cartTotals.totalBasePrice,
          total_current_price: cartTotals.totalCurrentPrice,
        },
        include: {
          cart_items: {
            include: {
              cart_item_options: true,
            },
          },
        },
      });
    });
  }

  async clearCart(userId?: number, sessionId?: string): Promise<void> {
    const cart = await this.getOrCreateActiveCart(userId, sessionId);

    await this.prismaService.$transaction(async (tx) => {
      await tx.cartItem.deleteMany({
        where: {
          cart_id: cart.id,
        },
      });

      await tx.cart.update({
        where: { id: cart.id },
        data: {
          total_base_price: new Prisma.Decimal(0),
          total_current_price: new Prisma.Decimal(0),
        },
      });
    });
  }

  // async mergeCarts(userId: number, sessionId: string): Promise<void> {
  //   const guestCart = await this.prismaService.cart.findFirst({
  //     where: {
  //       guest_session_id: sessionId,
  //       status: CartStatus.ACTIVE,
  //     },
  //     include: {
  //       cart_items: true,
  //     },
  //   });
  //
  //   if (!guestCart) {
  //     return;
  //   }
  //
  //   const userCart = await this.prismaService.cart.findFirst({
  //     where: {
  //       user_id: userId,
  //       status: CartStatus.ACTIVE,
  //     },
  //     include: {
  //       cart_items: true,
  //     },
  //   });
  //
  //   if (!userCart) {
  //     await this.prismaService.cart.update({
  //       where: { id: guestCart.id },
  //       data: {
  //         user_id: userId,
  //         guest_session_id: null,
  //       },
  //     });
  //   } else {
  //     for (const guestItem of guestCart.cart_items) {
  //       const existingItem = userCart.cart_items.find(
  //         (item) =>
  //           item.service_id === guestItem.service_id &&
  //           item.service_type === guestItem.service_type &&
  //           item.date.getTime() === guestItem.date.getTime() &&
  //           item.time === guestItem.time,
  //       );
  //
  //       if (existingItem) {
  //         await this.prismaService.cartItem.update({
  //           where: { id: existingItem.id },
  //           data: {
  //             options: guestItem.options,
  //           },
  //         });
  //       } else {
  //         await this.prismaService.cartItem.create({
  //           data: {
  //             cart_id: userCart.id,
  //             service_id: guestItem.service_id,
  //             service_type: guestItem.service_type,
  //             date: guestItem.date,
  //             time: guestItem.time,
  //             title: guestItem.title,
  //             slug: guestItem.slug,
  //             image_src: guestItem.image_src,
  //             image_lqip: guestItem.image_lqip,
  //             total_base_price: guestItem.total_base_price,
  //             total_current_price: guestItem.total_current_price,
  //           },
  //         });
  //       }
  //     }
  //
  //     await this.prismaService.cart.delete({ where: { id: guestCart.id } });
  //   }
  // }

  async getOrCreateActiveCart(
    userId?: number,
    sessionId?: string,
  ): Promise<CartResponse> {
    if (!userId && !sessionId) {
      throw new BadRequestException('Не найден пользователь или сессия');
    }

    const whereCondition = userId
      ? { user_id: userId, status: CartStatus.ACTIVE }
      : { guest_session_id: sessionId, status: CartStatus.ACTIVE };

    try {
      return await this.prismaService.$transaction(async (tx) => {
        const cart = await tx.cart.findFirst({
          where: whereCondition,
          select: this.selectFields,
        });
        if (cart) {
          return cart;
        }

        return tx.cart.create({
          data: {
            ...whereCondition,
            total_base_price: new Prisma.Decimal(0),
            total_current_price: new Prisma.Decimal(0),
          },
          select: this.selectFields,
        });
      });
    } catch {
      throw new InternalServerErrorException(
        'Ошибка при получении или создании корзины',
      );
    }
  }
}
